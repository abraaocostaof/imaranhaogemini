import axios from 'axios';
import * as cheerio from 'cheerio';
import { HTTP_CONFIG, NOISE_PATTERNS } from './config.ts';

export interface ScrapedArticle {
  id: string;
  titulo: string;
  subtitulo: string;
  dataPublicacao: string;
  dataModificacao: string;
  imagem: string;
  creditoImagem?: string;
  urlOriginal: string;
  urlCanonica: string;
  quantidadeParagrafos: number;
  conteudo: string[];
  editoria?: string;
  autor?: string;
  palavrasTotais?: number;
  tempoLeituraMinutos?: number;
  scrapedAt: string;
  auditChecks?: {
    temTitulo: boolean;
    temSubtitulo: boolean;
    temDataValida: boolean;
    temImagem: boolean;
    paragrafosSuficientes: boolean;
    livreDeRuido: boolean;
  };
}

/**
 * Generates a clean URL slug / ID from title or URL
 */
function generateId(url: string, title?: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const match = pathname.match(/\/([^\/]+)\.ghtml$/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // fallback
  }

  if (title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 60);
  }

  return 'artigo-' + Math.random().toString(36).substring(2, 10);
}

/**
 * Checks whether a paragraph text is considered noise / ad / cross-link
 */
export function isNoise(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;

  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Deep scrapes a single G1 article URL using Cheerio
 */
export async function scrapeArticle(url: string, editoriaHint?: string): Promise<ScrapedArticle> {
  const response = await axios.get(url, {
    ...HTTP_CONFIG,
    responseType: 'text',
    timeout: 12000
  });

  const html = response.data;
  const $ = cheerio.load(html);

  // 1. TÍTULO: h1.content-head__title, fallback [itemprop="headline"] or h1
  let titulo = $('h1.content-head__title').text().trim() ||
               $('[itemprop="headline"]').text().trim() ||
               $('meta[property="og:title"]').attr('content')?.trim() ||
               $('h1').first().text().trim() || '';

  // Clean title suffix like " | Política | G1" if coming from og:title or title tag
  titulo = titulo.replace(/\s*\|\s*G1.*$/i, '').trim();

  // 2. SUBTÍTULO (Linha-fina): h2.content-head__subtitle, fallback [itemprop="alternativeHeadline"]
  const subtitulo = $('h2.content-head__subtitle').text().trim() ||
                    $('[itemprop="alternativeHeadline"]').text().trim() ||
                    $('meta[name="description"]').attr('content')?.trim() ||
                    $('meta[property="og:description"]').attr('content')?.trim() || '';

  // 3. DATA DE PUBLICAÇÃO: meta[itemprop="datePublished"] (content) / time[itemprop="datePublished"]
  const dataPublicacao = $('meta[itemprop="datePublished"]').attr('content') ||
                         $('time[itemprop="datePublished"]').attr('datetime') ||
                         $('meta[property="article:published_time"]').attr('content') ||
                         $('time').first().attr('datetime') ||
                         new Date().toISOString();

  // 4. DATA DE ATUALIZAÇÃO: meta[itemprop="dateModified"] (content) / time[itemprop="dateModified"]
  const dataModificacao = $('meta[itemprop="dateModified"]').attr('content') ||
                          $('time[itemprop="dateModified"]').attr('datetime') ||
                          $('meta[property="article:modified_time"]').attr('content') ||
                          dataPublicacao;

  // 5. URL CANÔNICA: link[rel="canonical"] (href) / URL original
  const urlCanonica = $('link[rel="canonical"]').attr('href') || url;

  // 6. IMAGEM DE DESTAQUE & CRÉDITO
  let imagem = $('meta[property="og:image"]').attr('content') ||
               $('meta[itemprop="image"]').attr('content') ||
               $('article figure img, .artigo__foto img').first().attr('src') || '';

  if (imagem && imagem.startsWith('//')) {
    imagem = 'https:' + imagem;
  }

  // Extrair créditos da imagem se existirem
  let creditoImagem = $('figure .content-media__description__credit, .content-media__description__credit, figcaption .credit, [itemprop="copyrightHolder"]').first().text().trim();
  if (!creditoImagem) {
    const rawCaption = $('figure figcaption, .content-media__description__caption, .foto-legenda, figcaption').first().text().trim();
    if (rawCaption) {
      // Check for parenthetical credits like "(Geyce Gomes/Grupo Mirante)" common in Imirante
      const parenMatch = rawCaption.match(/\(([^)]+)\)$/);
      const match = rawCaption.match(/(?:foto|crédito|imagem|reprodução|divulgação|agência)[\s:]+([^—\n]+)/i) ||
                    rawCaption.match(/—\s*([^—\n]+)$/);
      if (parenMatch && parenMatch[1] && parenMatch[1].length < 80) {
        creditoImagem = parenMatch[1].trim();
      } else if (match && match[0]) {
        creditoImagem = match[0].trim();
      } else if (rawCaption.length < 90 && (rawCaption.includes('/') || rawCaption.includes('Foto') || rawCaption.includes('Arquivo') || rawCaption.includes('Mirante'))) {
        creditoImagem = rawCaption;
      }
    }
  }

  if (creditoImagem) {
    creditoImagem = creditoImagem.replace(/^(foto|crédito|imagem)[\s:]+/i, '').trim();
    creditoImagem = `Foto: ${creditoImagem}`;
  } else {
    creditoImagem = 'Foto: Divulgação / Reprodução';
  }

  // 7. AUTOR / CHÁPEU / EDITORIA
  let autor = $('p.content-publication-data__from').text().trim() ||
              $('.artigo__autor, [itemprop="author"]').text().trim() ||
              $('meta[name="author"]').attr('content')?.trim() || '';

  let chapeu = $('span.content-head__label, .artigo__chapeu').text().trim() ||
               $('meta[property="article:section"]').attr('content') ||
               editoriaHint || (url.includes('imirante') ? 'Maranhão' : 'Brasil');

  if (chapeu.toUpperCase() === 'G1') {
    chapeu = 'Brasil';
  }

  // 8. CORPO DA NOTÍCIA: article[itemprop="articleBody"] e parágrafos sem ruídos
  // Prioritize article[itemprop="articleBody"], fallback to .artigo__conteudo, .mc-body, .theme-article-body, or article
  const bodyRoot = $('article[itemprop="articleBody"], .artigo__conteudo, .artigo__texto, .mc-body, .theme-article-body, article');

  const conteudo: string[] = [];
  let foundNoise = false;

  // Remove ad containers, polls, podcasts inside before walking
  bodyRoot.find('.content-ads, .glb-ad, .widget-podcast, .widget-poll, .banner, .glb-gallery, .artigo__saibamais, .artigo__compartilhar').remove();

  // Select candidate paragraph and intertitle elements
  bodyRoot.find('p.content-text__container, div.content-intertitle h2, .content-text__container, p').each((_, el) => {
    const $el = $(el);
    const tagName = el.tagName.toLowerCase();

    // Skip if inside an excluded container
    if ($el.parents('.content-ads, .glb-ad, .widget-podcast, .widget-poll').length > 0) {
      return;
    }

    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!text) return;

    // Check if byline author can be extracted if not already found
    if (!autor && /^por\s+[a-zÀ-ÿ\s,–—]+g1/i.test(text)) {
      autor = text;
      return;
    }

    if (isNoise(text)) {
      foundNoise = true;
      return;
    }

    // Intertitle styling format
    if (tagName === 'h2' || $el.parent().hasClass('content-intertitle')) {
      conteudo.push(`## ${text}`);
      return;
    }

    // Avoid duplicate adjacent paragraphs
    if (conteudo.length > 0 && conteudo[conteudo.length - 1] === text) {
      return;
    }

    conteudo.push(text);
  });

  // Calculate statistics
  const totalWords = conteudo.reduce((acc, p) => acc + (p.startsWith('## ') ? 0 : p.split(/\s+/).length), 0);
  const readingTime = Math.max(1, Math.ceil(totalWords / 200));

  const id = generateId(urlCanonica, titulo);

  // Quality Audit Checklist
  const auditChecks = {
    temTitulo: titulo.length > 10,
    temSubtitulo: subtitulo.length > 5,
    temDataValida: !isNaN(Date.parse(dataPublicacao)),
    temImagem: Boolean(imagem && (imagem.startsWith('http://') || imagem.startsWith('https://'))),
    paragrafosSuficientes: conteudo.length >= 2,
    livreDeRuido: !foundNoise || conteudo.every(c => !isNoise(c))
  };

  return {
    id,
    titulo,
    subtitulo,
    dataPublicacao,
    dataModificacao,
    imagem,
    creditoImagem,
    urlOriginal: url,
    urlCanonica,
    quantidadeParagrafos: conteudo.length,
    conteudo,
    editoria: chapeu,
    autor,
    palavrasTotais: totalWords,
    tempoLeituraMinutos: readingTime,
    scrapedAt: new Date().toISOString(),
    auditChecks
  };
}

/**
 * Scrapes a list of URLs with concurrency control and error handling
 */
export async function scrapeArticleList(urls: string[], editoriaHint?: string): Promise<ScrapedArticle[]> {
  const results: ScrapedArticle[] = [];

  for (const url of urls) {
    try {
      console.log(`[scraper.ts] Scraping: ${url}`);
      const article = await scrapeArticle(url, editoriaHint);
      results.push(article);
    } catch (err: any) {
      console.error(`[scraper.ts] Failed to scrape ${url}: ${err.message}`);
    }
  }

  return results;
}
