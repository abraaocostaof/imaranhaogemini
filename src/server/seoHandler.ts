import { RewrittenArticle } from '../types.ts';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function injectArticleSeo(html: string, article: RewrittenArticle, fullUrl: string): string {
  const headline = escapeHtml(article.tituloReescrito);
  const summary = escapeHtml(
    article.subtituloReescrito ||
    article.geo?.respostaDireta ||
    (article.corpoReescrito && article.corpoReescrito[0]) ||
    'Notícia apurada e publicada pela redação do imaranhao.'
  ).slice(0, 200);

  const imageUrl = article.imagem || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&h=630&q=80';

  // Replace Title
  let modified = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${headline} | imaranhao</title>`
  );

  // Replace Description
  modified = modified.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${summary}" />`
  );

  // Replace Open Graph Tags
  modified = modified.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${headline}" />`
  );

  modified = modified.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${summary}" />`
  );

  modified = modified.replace(
    /<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:type" content="article" />`
  );

  modified = modified.replace(
    /<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:image" content="${imageUrl}" />`
  );

  // Replace Twitter Tags
  modified = modified.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${headline}" />`
  );

  modified = modified.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${summary}" />`
  );

  modified = modified.replace(
    /<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:image" content="${imageUrl}" />`
  );

  // Build NewsArticle Schema.org JSON-LD
  let schemaObj: any = null;
  try {
    if (article.geo?.schemaJsonLd) {
      schemaObj = JSON.parse(article.geo.schemaJsonLd);
    }
  } catch {}

  if (!schemaObj) {
    schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.tituloReescrito,
      description: summary,
      image: [imageUrl],
      datePublished: article.dataPublicacaoOriginal || article.processadoEm,
      dateModified: article.processadoEm,
    };
  }

  // Enforce imaranhao as single canonical publisher and author
  schemaObj.mainEntityOfPage = fullUrl;
  schemaObj.author = {
    '@type': 'Organization',
    name: 'Redação imaranhao',
    url: 'https://agora.imaranhao.com'
  };
  schemaObj.publisher = {
    '@type': 'NewsMediaOrganization',
    name: 'imaranhao',
    url: 'https://agora.imaranhao.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://agora.imaranhao.com/logo.png'
    }
  };

  const schemaJson = JSON.stringify(schemaObj, null, 2);

  // Inject additional tags into <head>
  const tagsToInject = `
    <!-- Dynamic Social Share Cards for WhatsApp & Facebook -->
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${headline}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta name="imaranhao-article-id" content="${article.id}" />
    <script>window.__INITIAL_ARTICLE_ID__ = "${article.id}";</script>
    <script type="application/ld+json">
      ${schemaJson}
    </script>
  `;

  return modified.replace('</head>', `${tagsToInject}\n  </head>`);
}
