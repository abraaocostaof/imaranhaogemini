import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScrapedArticle } from './scraper.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, '../../data/articles.json');

export interface ArticlesHistory {
  lastScrapedAt: string | null;
  editoria: string | null;
  total: number;
  articles: ScrapedArticle[];
}

let inMemoryState: ArticlesHistory = {
  lastScrapedAt: null,
  editoria: null,
  total: 0,
  articles: []
};

// Initialize from file if exists
export function initStorage(): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.articles)) {
        inMemoryState = parsed;
        console.log(`[storage.ts] Loaded ${inMemoryState.articles.length} articles from disk.`);
      }
    }
  } catch (err: any) {
    console.warn(`[storage.ts] Could not load initial data: ${err.message}`);
  }
}

export function getCachedArticles(): ArticlesHistory {
  return inMemoryState;
}

export function saveArticles(articles: ScrapedArticle[], editoria: string): ArticlesHistory {
  const updatedState: ArticlesHistory = {
    lastScrapedAt: new Date().toISOString(),
    editoria,
    total: articles.length,
    articles
  };

  inMemoryState = updatedState;

  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(updatedState, null, 2), 'utf-8');
    console.log(`[storage.ts] Persisted ${articles.length} articles to ${DATA_FILE_PATH}`);
  } catch (err: any) {
    console.error(`[storage.ts] Failed to persist data/articles.json: ${err.message}`);
  }

  return updatedState;
}

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
}

const LEADS_FILE_PATH = path.resolve(__dirname, '../../data/leads.json');
let inMemoryLeads: Lead[] = [];

export function initLeadsStorage(): void {
  try {
    const dir = path.dirname(LEADS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(LEADS_FILE_PATH)) {
      const raw = fs.readFileSync(LEADS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryLeads = parsed;
        console.log(`[storage.ts] Loaded ${inMemoryLeads.length} leads from disk.`);
      }
    }
  } catch (err: any) {
    console.warn(`[storage.ts] Could not load leads data: ${err.message}`);
  }
}

export function getLeads(): Lead[] {
  return inMemoryLeads;
}

export function addLead(data: { nome?: string; email?: string; telefone?: string }): Lead {
  const newLead: Lead = {
    id: 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    nome: (data.nome || '').trim(),
    email: (data.email || '').trim(),
    telefone: (data.telefone || '').trim(),
    criadoEm: new Date().toISOString()
  };

  inMemoryLeads.unshift(newLead);

  try {
    const dir = path.dirname(LEADS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify(inMemoryLeads, null, 2), 'utf-8');
  } catch (err: any) {
    console.error(`[storage.ts] Failed to persist leads: ${err.message}`);
  }

  return newLead;
}

export function deleteLead(id: string): boolean {
  const initialLength = inMemoryLeads.length;
  inMemoryLeads = inMemoryLeads.filter(l => l.id !== id);

  if (inMemoryLeads.length !== initialLength) {
    try {
      fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify(inMemoryLeads, null, 2), 'utf-8');
      return true;
    } catch (e: any) {
      console.error(`[storage.ts] Failed to persist leads after delete: ${e.message}`);
    }
  }
  return false;
}

