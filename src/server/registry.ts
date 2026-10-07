import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTop10FromHome } from './homeFeed.ts';
import { getTop20FromImiranteRss } from './feed.ts';
import { scrapeArticle } from './scraper.ts';
import { rewriteArticle, RewrittenArticle } from './rewriter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_FILE = path.resolve(__dirname, '../../data/registry.json');

export interface CycleLog {
  id: string;
  timestamp: string;
  totalExamined: number;
  duplicatesCount: number;
  newCount: number;
  newTitles: string[];
}

export interface RegistryData {
  config: {
    intervalMinutes: number;
    enabled: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
  };
  articles: RewrittenArticle[];
  logs: CycleLog[];
}

let inMemoryRegistry: RegistryData = {
  config: {
    intervalMinutes: 60, // 1 hour by default
    enabled: true,
    lastRunAt: null,
    nextRunAt: null
  },
  articles: [],
  logs: []
};

let timerHandle: NodeJS.Timeout | null = null;
let isCycleRunning = false;

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase().replace(/\/+$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

export function normalizeTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 80);
}

export function initRegistry(): void {
  try {
    const dir = path.dirname(REGISTRY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(REGISTRY_FILE)) {
      const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.articles)) {
        inMemoryRegistry = {
          config: { ...inMemoryRegistry.config, ...(parsed.config || {}) },
          articles: parsed.articles,
          logs: parsed.logs || []
        };
        console.log(`[registry.ts] Registry loaded with ${inMemoryRegistry.articles.length} published articles and ${inMemoryRegistry.logs.length} logs.`);
      }
    }
  } catch (err: any) {
    console.warn(`[registry.ts] Notice loading registry: ${err.message}`);
  }

  // Start background monitoring scheduler
  setupScheduler();
}

function persistRegistry(): void {
  try {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(inMemoryRegistry, null, 2), 'utf-8');
  } catch (err: any) {
    console.error(`[registry.ts] Error saving registry: ${err.message}`);
  }
}

export function isAlreadyProcessed(url: string, title?: string): boolean {
  const cleanUrl = normalizeUrl(url);
  const cleanTitle = title ? normalizeTitle(title) : '';

  return inMemoryRegistry.articles.some(item => {
    if (normalizeUrl(item.urlOriginal) === cleanUrl) return true;
    if (cleanTitle && normalizeTitle(item.tituloOriginal) === cleanTitle) return true;
    return false;
  });
}

/**
 * Executes a single monitoring cycle:
 * 1. Checks top 10 from https://g1.globo.com/
 * 2. Compares against registry (deduplication)
 * 3. Extracts only the NEW ones (e.g. 3 new articles)
 * 4. Annotates and rewrites them
 * 5. Saves to database
 */
export async function runMonitoringCycle(): Promise<{
  totalExamined: number;
  duplicatesCount: number;
  newCount: number;
  newArticles: RewrittenArticle[];
}> {
  if (isCycleRunning) {
    console.log('[registry.ts] Monitoring cycle already in progress, skipping duplicate call.');
    return {
      totalExamined: 0,
      duplicatesCount: 0,
      newCount: 0,
      newArticles: []
    };
  }

  isCycleRunning = true;
  console.log('>>> [registry.ts] Starting Multi-Source Monitoring Cycle (G1 Top 10 + iMirante Top 20) ...');

  try {
    // 1. Discover top stories from both sources in parallel
    const [top10G1Urls, top20ImiranteUrls] = await Promise.all([
      getTop10FromHome().catch(e => {
        console.error('[registry.ts] Error fetching G1:', e.message);
        return [] as string[];
      }),
      getTop20FromImiranteRss().catch(e => {
        console.error('[registry.ts] Error fetching Imirante:', e.message);
        return [] as string[];
      })
    ]);

    console.log(`[registry.ts] Discovered ${top10G1Urls.length} from G1 and ${top20ImiranteUrls.length} from iMirante.`);

    // Interleave sources for a balanced mix of local (Maranhão) and national coverage
    const combinedUrls: string[] = [];
    const maxLen = Math.max(top10G1Urls.length, top20ImiranteUrls.length);
    for (let i = 0; i < maxLen; i++) {
      // Prioritize local Maranhão story from iMirante
      if (i < top20ImiranteUrls.length && !combinedUrls.includes(top20ImiranteUrls[i])) {
        combinedUrls.push(top20ImiranteUrls[i]);
      }
      // Followed by national/global story from G1
      if (i < top10G1Urls.length && !combinedUrls.includes(top10G1Urls[i])) {
        combinedUrls.push(top10G1Urls[i]);
      }
    }

    const newUrlsToProcess: string[] = [];
    let duplicatesCount = 0;

    // 2. Anti-duplication check before processing
    for (const url of combinedUrls) {
      if (isAlreadyProcessed(url)) {
        duplicatesCount++;
      } else {
        newUrlsToProcess.push(url);
      }
    }

    console.log(`[registry.ts] Dedup Analysis: ${duplicatesCount} already processed/published. ${newUrlsToProcess.length} brand new stories found across both sources!`);

    const newArticles: RewrittenArticle[] = [];

    // 3. Process, annotate & rewrite each new article in parallel batches
    for (let i = 0; i < newUrlsToProcess.length; i += 3) {
      const batch = newUrlsToProcess.slice(i, i + 3);
      await Promise.all(
        batch.map(async (url) => {
          try {
            console.log(`[registry.ts] Scraping new article: ${url}`);
            const scraped = await scrapeArticle(url);

            // Double check title dedup in case URL was slightly different
            if (isAlreadyProcessed(scraped.urlOriginal, scraped.titulo)) {
              console.log(`[registry.ts] Article title matched existing record, skipping duplicate: ${scraped.titulo}`);
              duplicatesCount++;
              return;
            }

            console.log(`[registry.ts] Annotating & Rewriting: "${scraped.titulo}"`);
            const rewritten = await rewriteArticle(scraped);

            newArticles.push(rewritten);
            // Add to front of registry
            inMemoryRegistry.articles.unshift(rewritten);
          } catch (err: any) {
            console.error(`[registry.ts] Error processing article ${url}:`, err.message);
          }
        })
      );
    }

    // 4. Log cycle stats
    const nowIso = new Date().toISOString();
    inMemoryRegistry.config.lastRunAt = nowIso;
    updateNextRunAt();

    const logEntry: CycleLog = {
      id: 'log-' + Date.now(),
      timestamp: nowIso,
      totalExamined: combinedUrls.length,
      duplicatesCount,
      newCount: newArticles.length,
      newTitles: newArticles.map(a => a.tituloOriginal)
    };

    inMemoryRegistry.logs.unshift(logEntry);
    if (inMemoryRegistry.logs.length > 50) {
      inMemoryRegistry.logs = inMemoryRegistry.logs.slice(0, 50);
    }

    persistRegistry();

    console.log(`[registry.ts] Cycle finished. ${newArticles.length} new rewritten articles recorded.`);

    return {
      totalExamined: combinedUrls.length,
      duplicatesCount,
      newCount: newArticles.length,
      newArticles
    };
  } finally {
    isCycleRunning = false;
  }
}

function updateNextRunAt(): void {
  const ms = inMemoryRegistry.config.intervalMinutes * 60 * 1000;
  inMemoryRegistry.config.nextRunAt = new Date(Date.now() + ms).toISOString();
}

export function setupScheduler(): void {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }

  if (!inMemoryRegistry.config.enabled) {
    console.log('[registry.ts] Scheduler is disabled in config.');
    return;
  }

  const intervalMs = Math.max(1, inMemoryRegistry.config.intervalMinutes) * 60 * 1000;
  updateNextRunAt();

  console.log(`[registry.ts] Monitoring scheduler active: checking every ${inMemoryRegistry.config.intervalMinutes} minutes.`);

  timerHandle = setInterval(async () => {
    try {
      await runMonitoringCycle();
    } catch (e: any) {
      console.error('[registry.ts] Scheduled cycle error:', e.message);
    }
  }, intervalMs);
}

export function updateConfig(intervalMinutes: number, enabled: boolean): RegistryData['config'] {
  inMemoryRegistry.config.intervalMinutes = intervalMinutes;
  inMemoryRegistry.config.enabled = enabled;
  setupScheduler();
  persistRegistry();
  return inMemoryRegistry.config;
}

export function markAsPublished(articleId: string): boolean {
  const item = inMemoryRegistry.articles.find(a => a.id === articleId);
  if (item) {
    item.status = 'publicada';
    item.publicadoEm = new Date().toISOString();
    persistRegistry();
    return true;
  }
  return false;
}

export function clearRegistry(): void {
  inMemoryRegistry.articles = [];
  inMemoryRegistry.logs = [];
  persistRegistry();
}

export function getRegistryState(): RegistryData {
  return inMemoryRegistry;
}
