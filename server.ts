import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EDITORIAS } from './src/server/config.ts';
import { discoverRecentUrls } from './src/server/feed.ts';
import { scrapeArticle, scrapeArticleList } from './src/server/scraper.ts';
import {
  initStorage,
  getCachedArticles,
  saveArticles,
  initLeadsStorage,
  getLeads,
  addLead,
  deleteLead
} from './src/server/storage.ts';
import {
  initRegistry,
  getRegistryState,
  runMonitoringCycle,
  updateConfig,
  markAsPublished,
  clearRegistry
} from './src/server/registry.ts';
import { injectArticleSeo } from './src/server/seoHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize storage & deduplication registry
  initStorage();
  initLeadsStorage();
  initRegistry();

  app.use(express.json());

  // LEADS CAPTURE API
  // GET /api/leads
  app.get('/api/leads', (_req: Request, res: Response) => {
    res.json(getLeads());
  });

  // POST /api/leads
  app.post('/api/leads', (req: Request, res: Response) => {
    const { nome, email, telefone } = req.body || {};
    const created = addLead({ nome, email, telefone });
    res.status(201).json({ success: true, lead: created });
  });

  // DELETE /api/leads/:id
  app.delete('/api/leads/:id', (req: Request, res: Response) => {
    const success = deleteLead(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    res.json({ success: true });
  });

  // API Endpoints
  // 1. GET /api/editorias
  app.get('/api/editorias', (_req: Request, res: Response) => {
    res.json(Object.values(EDITORIAS));
  });

  // 2. GET /api/articles
  app.get('/api/articles', (_req: Request, res: Response) => {
    const data = getCachedArticles();
    res.json(data);
  });

  // 3. GET /api/scrape?editoria=geral
  app.get('/api/scrape', async (req: Request, res: Response) => {
    try {
      const editoriaKey = (req.query.editoria as string) || 'geral';
      console.log(`[server.ts] Starting scrape for editoria: ${editoriaKey}`);

      // Step 1: Discover 5 most recent URLs
      const urls = await discoverRecentUrls(editoriaKey, 5);
      console.log(`[server.ts] Discovered ${urls.length} URLs for ${editoriaKey}:`, urls);

      if (urls.length === 0) {
        return res.status(502).json({
          error: 'Nenhuma matéria encontrada para a editoria selecionada.',
          editoria: editoriaKey,
          articles: []
        });
      }

      // Step 2: Deep scrape each article
      const articles = await scrapeArticleList(urls, editoriaKey);

      // Step 3: Persist to storage & cache
      const saved = saveArticles(articles, editoriaKey);

      // Return according to PRD specification: array of 5 extracted objects
      // We also attach headers or provide both for maximum compatibility
      res.json(articles);
    } catch (err: any) {
      console.error('[server.ts] Scrape error:', err);
      res.status(500).json({ error: 'Erro durante o processo de extração: ' + err.message });
    }
  });

  // 4. POST /api/scrape-url (Deep scrape a specific G1 article URL for validation)
  app.post('/api/scrape-url', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.includes('g1.globo.com')) {
        return res.status(400).json({ error: 'URL inválida. Forneça uma URL de notícia do portal G1.' });
      }

      console.log(`[server.ts] Scraping custom URL: ${url}`);
      const article = await scrapeArticle(url);
      res.json(article);
    } catch (err: any) {
      console.error('[server.ts] Error scraping custom URL:', err);
      res.status(500).json({ error: 'Falha ao extrair artigo: ' + err.message });
    }
  });

  // 5. MONITOR & DEDUPLICATION ENDPOINTS
  // GET /api/monitor/state
  app.get('/api/monitor/state', (_req: Request, res: Response) => {
    res.json(getRegistryState());
  });

  // POST /api/monitor/run (Executes an hourly-style cycle immediately)
  app.post('/api/monitor/run', async (_req: Request, res: Response) => {
    try {
      const result = await runMonitoringCycle();
      res.json(result);
    } catch (err: any) {
      console.error('[server.ts] Monitor cycle error:', err);
      res.status(500).json({ error: 'Erro ao executar ciclo de monitoramento: ' + err.message });
    }
  });

  // POST /api/monitor/config (Update interval and enabled state)
  app.post('/api/monitor/config', (req: Request, res: Response) => {
    const { intervalMinutes, enabled } = req.body;
    const minutes = typeof intervalMinutes === 'number' ? intervalMinutes : 60;
    const isEnabled = typeof enabled === 'boolean' ? enabled : true;
    const updated = updateConfig(minutes, isEnabled);
    res.json(updated);
  });

  // POST /api/monitor/publish/:id
  app.post('/api/monitor/publish/:id', (req: Request, res: Response) => {
    const success = markAsPublished(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }
    res.json({ success: true, articleId: req.params.id });
  });

  // POST /api/monitor/clear (Reset registry for testing)
  app.post('/api/monitor/clear', (_req: Request, res: Response) => {
    clearRegistry();
    res.json({ success: true, message: 'Histórico de deduplicação limpo com sucesso.' });
  });

  // 6. Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Serve Frontend with Dynamic Open Graph / WhatsApp Cards
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');
  let vite: any = null;

  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }

  // 7. Dynamic Social Card Route for /noticia/:id (WhatsApp, Facebook, Twitter, Telegram, etc.)
  app.get('/noticia/:id', async (req: Request, res: Response, next) => {
    try {
      const articleId = req.params.id;
      const registryState = getRegistryState();
      const article = registryState.articles.find(a => a.id === articleId || a.originalId === articleId);

      if (!article) {
        return next();
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const fullUrl = `${protocol}://${host}/noticia/${article.id}`;

      let html = '';
      if (isProduction && fs.existsSync(path.resolve(distPath, 'index.html'))) {
        html = fs.readFileSync(path.resolve(distPath, 'index.html'), 'utf-8');
      } else {
        const indexPath = path.resolve(__dirname, 'index.html');
        html = fs.readFileSync(indexPath, 'utf-8');
        if (vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }
      }

      const enrichedHtml = injectArticleSeo(html, article, fullUrl);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(enrichedHtml);
    } catch (err: any) {
      console.error('[server.ts] Error generating dynamic Open Graph preview:', err);
      return next();
    }
  });

  if (isProduction && fs.existsSync(distPath)) {
    console.log('[server.ts] Serving static production build from', distPath);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else if (vite) {
    app.use(vite.middlewares);
    app.get('*', async (req: Request, res: Response, next) => {
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> G1 Scraper & Validator Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
