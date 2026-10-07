import axios from 'axios';
import * as cheerio from 'cheerio';
import { HTTP_CONFIG } from './config.ts';
import { isEligibleArticleUrl } from './feed.ts';

/**
 * Scrapes top 10 unique article URLs directly from G1 home page: https://g1.globo.com/
 */
export async function getTop10FromHome(): Promise<string[]> {
  const homeUrl = 'https://g1.globo.com/';
  const urls: string[] = [];

  try {
    const response = await axios.get(homeUrl, {
      ...HTTP_CONFIG,
      responseType: 'text',
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Prioritized selectors on G1 home page
    const candidateElements = [
      'a.feed-post-link',
      '.bastian-feed-item a',
      '.feed-post-body a',
      '.theme-title a',
      'a[href*="/noticia/"]',
      'a[href$=".ghtml"]'
    ];

    $(candidateElements.join(', ')).each((_, el) => {
      if (urls.length >= 20) return; // gather a bit more for clean filtering
      let href = $(el).attr('href');
      if (!href) return;

      if (href.startsWith('//')) {
        href = 'https:' + href;
      } else if (href.startsWith('/')) {
        href = 'https://g1.globo.com' + href;
      }

      try {
        const parsed = new URL(href);
        // Normalize: remove query strings and hashes
        const cleanUrl = `${parsed.origin}${parsed.pathname}`;
        if (isEligibleArticleUrl(cleanUrl) && !urls.includes(cleanUrl)) {
          urls.push(cleanUrl);
        }
      } catch {
        // invalid URL
      }
    });
  } catch (err: any) {
    console.error(`[homeFeed.ts] Error fetching G1 home: ${err.message}`);
  }

  // Fallback to RSS if home page returned fewer than 10
  if (urls.length < 10) {
    try {
      console.log(`[homeFeed.ts] Home page gave ${urls.length} URLs. Supplementing from RSS...`);
      const rssResponse = await axios.get('https://g1.globo.com/rss/g1/', {
        ...HTTP_CONFIG,
        responseType: 'text',
        timeout: 8000
      });
      const $rss = cheerio.load(rssResponse.data, { xmlMode: true });
      $rss('item').each((_, item) => {
        if (urls.length >= 15) return;
        const link = $rss(item).find('link').text().trim() || $rss(item).find('guid').text().trim();
        if (link && isEligibleArticleUrl(link) && !urls.includes(link)) {
          urls.push(link);
        }
      });
    } catch (e: any) {
      console.warn('[homeFeed.ts] RSS fallback error:', e.message);
    }
  }

  return urls.slice(0, 10);
}
