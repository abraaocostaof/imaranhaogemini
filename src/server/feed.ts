import axios from 'axios';
import * as cheerio from 'cheerio';
import { EDITORIAS, HTTP_CONFIG, URL_IGNORE_PATTERNS } from './config.ts';

export function isEligibleArticleUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();

  // 1. Imirante URL validation
  if (cleanUrl.includes('imirante.com')) {
    if (cleanUrl.endsWith('/rss') || cleanUrl.includes('/sobre') || cleanUrl.includes('/contato') || cleanUrl.includes('/politica-de-privacidade')) {
      return false;
    }
    // Must look like an article (has year/month or section and slug)
    const hasDatePattern = /\/\d{4}\/\d{2}\/\d{2}\//.test(cleanUrl);
    const pathParts = new URL(cleanUrl).pathname.split('/').filter(Boolean);
    return hasDatePattern || pathParts.length >= 3;
  }

  // 2. G1 URL validation
  if (cleanUrl.includes('g1.globo.com')) {
    for (const pattern of URL_IGNORE_PATTERNS) {
      if (pattern.test(cleanUrl)) return false;
    }
    const hasGhtml = cleanUrl.endsWith('.ghtml') || cleanUrl.includes('.ghtml?');
    const hasNoticia = cleanUrl.includes('/noticia/');
    return hasGhtml || hasNoticia;
  }

  return false;
}

/**
 * Discovers the top 20 latest news URLs from https://imirante.com/rss
 */
export async function getTop20FromImiranteRss(): Promise<string[]> {
  const rssUrl = 'https://imirante.com/rss';
  try {
    const response = await axios.get(rssUrl, {
      ...HTTP_CONFIG,
      responseType: 'text',
      timeout: 10000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const urls: string[] = [];

    $('item').each((_, item) => {
      if (urls.length >= 20) return;

      const link = $(item).find('link').text().trim() ||
                   $(item).find('guid').text().trim();

      if (link && isEligibleArticleUrl(link) && !urls.includes(link)) {
        urls.push(link);
      }
    });

    console.log(`[feed.ts] Extracted ${urls.length} articles from Imirante RSS`);
    return urls.slice(0, 20);
  } catch (err: any) {
    console.error(`[feed.ts] Error fetching Imirante RSS: ${err.message}`);
    return [];
  }
}

export async function discoverUrlsFromRss(rssUrl: string, limit: number = 5): Promise<string[]> {
  try {
    const response = await axios.get(rssUrl, {
      ...HTTP_CONFIG,
      responseType: 'text',
      timeout: 8000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const urls: string[] = [];

    // Cheerio XML extraction
    $('item').each((_, item) => {
      if (urls.length >= limit * 2) return; // gather a bit more for filtering

      const link = $(item).find('link').text().trim() ||
                   $(item).find('guid').text().trim();

      if (link && isEligibleArticleUrl(link) && !urls.includes(link)) {
        urls.push(link);
      }
    });

    // Fallback regex inside RSS if cheerio XML missed anything due to CDATA or namespace
    if (urls.length < limit) {
      const matches = response.data.match(/https:\/\/g1\.globo\.com\/[^\s<>"'\\]+\.ghtml/g) || [];
      for (const link of matches) {
        const clean = link.replace(/&amp;/g, '&');
        if (isEligibleArticleUrl(clean) && !urls.includes(clean)) {
          urls.push(clean);
        }
      }
    }

    return urls.slice(0, limit);
  } catch (err: any) {
    console.warn(`[feed.ts] RSS discovery failed for ${rssUrl}: ${err.message}. Trying HTML fallback.`);
    return [];
  }
}

export async function discoverUrlsFromHtml(htmlUrl: string, limit: number = 5): Promise<string[]> {
  try {
    const response = await axios.get(htmlUrl, {
      ...HTTP_CONFIG,
      responseType: 'text',
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const urls: string[] = [];

    // Selectors commonly used on G1 homepages
    const selectors = [
      'a.feed-post-link',
      'div.feed-post-body a',
      '.bastian-feed-item a',
      'a[href*="/noticia/"]',
      'a[href$=".ghtml"]'
    ];

    $(selectors.join(', ')).each((_, el) => {
      if (urls.length >= limit) return;
      let href = $(el).attr('href');
      if (!href) return;

      if (href.startsWith('//')) {
        href = 'https:' + href;
      } else if (href.startsWith('/')) {
        href = 'https://g1.globo.com' + href;
      }

      // Remove query parameters or anchors for clean comparison
      try {
        const parsed = new URL(href);
        const canonicalUrl = `${parsed.origin}${parsed.pathname}`;
        if (isEligibleArticleUrl(canonicalUrl) && !urls.includes(canonicalUrl)) {
          urls.push(canonicalUrl);
        }
      } catch {
        if (isEligibleArticleUrl(href) && !urls.includes(href)) {
          urls.push(href);
        }
      }
    });

    return urls.slice(0, limit);
  } catch (err: any) {
    console.error(`[feed.ts] HTML discovery failed for ${htmlUrl}: ${err.message}`);
    return [];
  }
}

export async function discoverRecentUrls(editoriaKey: string = 'geral', limit: number = 5): Promise<string[]> {
  const editoria = EDITORIAS[editoriaKey] || EDITORIAS['geral'];

  // 1. Try RSS feed first
  let urls = await discoverUrlsFromRss(editoria.rssUrl, limit);

  // 2. If RSS didn't return enough URLs, supplement or fallback to HTML
  if (urls.length < limit) {
    console.log(`[feed.ts] RSS returned ${urls.length}/${limit} URLs. Falling back to HTML scraping at ${editoria.fallbackHtmlUrl}`);
    const htmlUrls = await discoverUrlsFromHtml(editoria.fallbackHtmlUrl, limit * 2);
    for (const u of htmlUrls) {
      if (urls.length >= limit) break;
      if (!urls.includes(u)) {
        urls.push(u);
      }
    }
  }

  return urls.slice(0, limit);
}
