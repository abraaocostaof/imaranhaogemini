import { GoogleGenAI } from '@google/genai';
import { ScrapedArticle } from './scraper.ts';
import { RewrittenArticle } from '../types.ts';

export type { RewrittenArticle };

/**
 * Fallback algorithmic rewriter with GEO structures when Gemini API is offline
 */
function fallbackRewrite(article: ScrapedArticle): Omit<RewrittenArticle, 'id' | 'originalId' | 'urlOriginal' | 'imagem' | 'editoria' | 'dataPublicacaoOriginal' | 'processadoEm' | 'status'> {
  const cleanTitle = article.titulo
    .replace(/^(g1|imirante|veja|saiba|entenda|confira|urgente):?\s*/i, '')
    .replace(/\s*\|\s*(G1|iMirante|Globo).*$/i, '')
    .trim();
  
  const cleanEditoria = article.editoria && article.editoria.toUpperCase() !== 'G1' ? article.editoria : 'Brasil';

  const anotacoes: string[] = [
    `Fato Central: ${article.subtitulo || article.conteudo[0] || cleanTitle}`,
    `Cobertura e Apuração: Redação imaranhao`,
    `Editoria Temática: ${cleanEditoria}`
  ];

  const cleanParagraphs = article.conteudo.filter(p => !p.startsWith('## ') && p.length > 40);

  const corpoReescrito = [
    cleanParagraphs[0] || `${cleanTitle}. Os principais fatos e desdobramentos seguem sendo acompanhados pela equipe de apuração.`,
    cleanParagraphs[1] || 'As autoridades e partes envolvidas acompanham a situação para avaliar os impactos e encaminhamentos.',
    cleanParagraphs[2] || 'A reportagem segue em atualização conforme novos comunicados oficiais forem divulgados.'
  ];

  const cleanSubtitle = article.subtitulo
    ? article.subtitulo.replace(/\s*\|\s*(G1|iMirante).*$/i, '').trim()
    : (cleanParagraphs[0] ? cleanParagraphs[0].slice(0, 140) + '...' : '');

  const respostaDireta = `${cleanTitle}. ${cleanSubtitle}`.slice(0, 220);

  const faq = [
    {
      pergunta: `O que foi apurado sobre ${cleanTitle.slice(0, 50)}?`,
      resposta: cleanSubtitle || cleanParagraphs[0] || 'O caso segue sob apuração e acompanhamento pelas autoridades competentes.'
    },
    {
      pergunta: 'Quais são os desdobramentos da matéria?',
      resposta: cleanParagraphs[1] || 'Novos informes oficiais continuam sendo acompanhados pela redação.'
    }
  ];

  const schemaJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: cleanTitle,
    description: cleanSubtitle || cleanTitle,
    image: [article.imagem],
    datePublished: article.dataPublicacao,
    dateModified: article.dataModificacao,
    mainEntityOfPage: article.urlOriginal,
    author: {
      '@type': 'Organization',
      name: 'Redação imaranhao',
      url: 'https://agora.imaranhao.com'
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'imaranhao',
      url: 'https://agora.imaranhao.com'
    }
  }, null, 2);

  return {
    tituloOriginal: article.titulo,
    subtituloOriginal: article.subtitulo,
    anotacoes,
    tituloReescrito: cleanTitle,
    subtituloReescrito: cleanSubtitle,
    corpoReescrito,
    tags: [cleanEditoria, 'Maranhão', 'Brasil', 'Notícias'],
    geo: {
      respostaDireta,
      entidadesChave: [cleanEditoria, 'Governo', 'Sociedade'],
      faq,
      schemaJsonLd,
      metaDescription: (cleanSubtitle || cleanTitle).slice(0, 160)
    }
  };
}

/**
 * Rewrites a news article using Gemini API with GEO (Generative Engine Optimization)
 */
export async function rewriteArticle(article: ScrapedArticle): Promise<RewrittenArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  let resultData;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é o editor-chefe e repórter sênior do portal de notícias 'imaranhao' (portal independente de jornalismo do Maranhão e Brasil).

Sua missão é redigir uma reportagem completa, 100% autoral, elegante e profissional baseada nas informações factuais fornecidas, como matéria exclusiva da Redação imaranhao.

CRÍTICO E OBRIGATÓRIO:
- NUNCA mencione outros portais como G1, Globo, iMirante ou agências. A reportagem é de apuração própria da Redação imaranhao.
- NÃO use prefixos robóticos no título como "Atualização:", "Urgente:" ou "Veja:".
- NÃO use prefixos no subtítulo como "Resumo apurado:".
- Redija uma manchete jornalística forte, direta e elegante, com excelente SEO.
- O corpo do texto deve ter parágrafos bem escritos, informativos e com vocabulário rico de jornalismo profissional.

DADOS FACTUAIS DA PAUTA:
- TÍTULO BASE: ${article.titulo}
- SUBTÍTULO: ${article.subtitulo}
- SEÇÃO: ${article.editoria}
- INFORMAÇÕES APURADAS:
${article.conteudo.slice(0, 8).join('\n\n')}

Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "anotacoes": [
    "Ponto-chave 1 (fato central)",
    "Ponto-chave 2 (números ou contexto)",
    "Ponto-chave 3 (impacto)"
  ],
  "tituloReescrito": "Título inédito, atraente, jornalístico e otimizado para SEO/GEO",
  "subtituloReescrito": "Linha-fina inédita explicando o contexto",
  "corpoReescrito": [
    "Parágrafo 1 de abertura reescrito com clareza factual...",
    "Parágrafo 2 de aprofundamento, contexto e dados...",
    "Parágrafo 3 de desdobramentos futuros..."
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "geo": {
    "respostaDireta": "Resposta direta e objetiva de 1 a 2 frases para IAs (Perplexity / ChatGPT / AI Overviews)",
    "entidadesChave": ["Entidade 1", "Entidade 2", "Entidade 3"],
    "faq": [
      {
        "pergunta": "Pergunta factual comum sobre o caso?",
        "resposta": "Resposta direta, sem rodeios e rica em fatos."
      },
      {
        "pergunta": "Qual foi o motivo ou impacto da medida?",
        "resposta": "Explicação objetiva da consequência."
      }
    ],
    "metaDescription": "Meta descrição concisa de 150-160 caracteres com alta densidade informativa."
  }
}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 7000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          }
        }),
        timeoutPromise
      ]);

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText);

      if (parsed.tituloReescrito && Array.isArray(parsed.corpoReescrito)) {
        const schemaJsonLd = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: parsed.tituloReescrito,
          description: parsed.subtituloReescrito || parsed.geo?.respostaDireta,
          image: [article.imagem],
          datePublished: article.dataPublicacao,
          dateModified: article.dataModificacao,
          mainEntityOfPage: article.urlOriginal,
          articleBody: parsed.corpoReescrito.join('\n\n')
        }, null, 2);

        resultData = {
          tituloOriginal: article.titulo,
          subtituloOriginal: article.subtitulo,
          anotacoes: parsed.anotacoes || [],
          tituloReescrito: parsed.tituloReescrito,
          subtituloReescrito: parsed.subtituloReescrito || '',
          corpoReescrito: parsed.corpoReescrito,
          tags: parsed.tags || [],
          geo: {
            respostaDireta: parsed.geo?.respostaDireta || '',
            entidadesChave: parsed.geo?.entidadesChave || [],
            faq: parsed.geo?.faq || [],
            schemaJsonLd,
            metaDescription: parsed.geo?.metaDescription || ''
          }
        };
      }
    } catch (err: any) {
      console.warn(`[rewriter.ts] Gemini API error (${err.message}). Using fallback rewriter.`);
    }
  }

  if (!resultData) {
    resultData = fallbackRewrite(article);
  }

  const rewrittenId = 'rw-' + (article.id || Math.random().toString(36).substring(2, 9));
  const rawEditoria = article.editoria || 'Brasil';
  const cleanEditoria = rawEditoria.toUpperCase() === 'G1' ? 'Brasil' : rawEditoria;

  // Remove any G1 branding from tags and entities
  const cleanTags: string[] = (resultData.tags || [])
    .map((t: string) => t.replace(/g1/gi, 'imaranhao').trim())
    .filter((t: string) => Boolean(t) && t.toLowerCase() !== 'g1');

  if (!cleanTags.includes('imaranhao')) {
    cleanTags.unshift('imaranhao');
  }

  const cleanEntities: string[] = (resultData.geo?.entidadesChave || [])
    .filter((e: string) => e.toLowerCase() !== 'g1');

  if (resultData.geo) {
    resultData.geo.entidadesChave = cleanEntities;
  }

  return {
    id: rewrittenId,
    originalId: article.id,
    urlOriginal: article.urlOriginal,
    imagem: article.imagem,
    creditoImagem: article.creditoImagem || 'Foto: Reprodução / Divulgação',
    editoria: cleanEditoria,
    dataPublicacaoOriginal: article.dataPublicacao,
    processadoEm: new Date().toISOString(),
    status: 'publicada',
    publicadoEm: new Date().toISOString(),
    ...resultData,
    tags: cleanTags
  };
}
