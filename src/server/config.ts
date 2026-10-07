export interface EditoriaConfig {
  id: string;
  name: string;
  description: string;
  rssUrl: string;
  fallbackHtmlUrl: string;
}

export const EDITORIAS: Record<string, EditoriaConfig> = {
  geral: {
    id: 'geral',
    name: 'Geral (Brasil)',
    description: 'Principais notícias do Brasil em tempo real',
    rssUrl: 'https://g1.globo.com/rss/g1/',
    fallbackHtmlUrl: 'https://g1.globo.com/'
  },
  politica: {
    id: 'politica',
    name: 'Política',
    description: 'Poder, Congresso, STF, governo e bastidores',
    rssUrl: 'https://g1.globo.com/rss/g1/politica/',
    fallbackHtmlUrl: 'https://g1.globo.com/politica/'
  },
  economia: {
    id: 'economia',
    name: 'Economia',
    description: 'Mercados, inflação, negócios e finanças pessoais',
    rssUrl: 'https://g1.globo.com/rss/g1/economia/',
    fallbackHtmlUrl: 'https://g1.globo.com/economia/'
  },
  tecnologia: {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Inovação, inteligência artificial, redes e gadgets',
    rssUrl: 'https://g1.globo.com/rss/g1/tecnologia/',
    fallbackHtmlUrl: 'https://g1.globo.com/tecnologia/'
  },
  carros: {
    id: 'carros',
    name: 'Carros',
    description: 'Lançamentos automotivos, testes, mercado e mobilidade',
    rssUrl: 'https://g1.globo.com/rss/g1/carros/',
    fallbackHtmlUrl: 'https://g1.globo.com/carros/'
  },
  'ciencia-e-saude': {
    id: 'ciencia-e-saude',
    name: 'Ciência e Saúde',
    description: 'Pesquisas médicas, espaço, clima e descobertas',
    rssUrl: 'https://g1.globo.com/rss/g1/ciencia-e-saude/',
    fallbackHtmlUrl: 'https://g1.globo.com/ciencia-e-saude/'
  },
  mundo: {
    id: 'mundo',
    name: 'Mundo',
    description: 'Notícias internacionais, diplomacia e geopolítica',
    rssUrl: 'https://g1.globo.com/rss/g1/mundo/',
    fallbackHtmlUrl: 'https://g1.globo.com/mundo/'
  }
};

export const HTTP_CONFIG = {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

export const URL_IGNORE_PATTERNS = [
  /\/videos\//i,
  /\/playlist\//i,
  /\/podcast\//i,
  /globoplay\.globo\.com/i,
  /\/especial-publicitario\//i,
  /\/ao-vivo\//i, // Live blogs generally don't follow articleBody semantics
  /\/interatividades\//i,
  /\/quiz\//i,
  /\/enquete\//i
];

export const NOISE_PATTERNS = [
  /^LEIA\s+TAMB[EÉ]M/i,
  /^VEJA\s+MAIS/i,
  /^CONFIRA\s+TAMB[EÉ]M/i,
  /canal\s+do\s+g1\s+no\s+whatsapp/i,
  /participe\s+do\s+canal\s+do\s+g1/i,
  /siga\s+o\s+g1\s+no\s+whatsapp/i,
  /siga\s+o\s+g1\s+no\s+google\s+news/i,
  /siga\s+o\s+g1\s+no\s+telegram/i,
  /clique\s+aqui\s+para\s+seguir\s+o\s+canal/i,
  /^v[ií]deo:\s*veja\s*os\s*destaques/i,
  /de\s+segunda\s+a\s+s[aá]bado,\s+as\s+not[ií]cias\s+que\s+voc[eê]\s+n[aã]o\s+pode\s+perder/i,
  /para\s+se\s+inscrever,\s+entre\s+ou\s+crie\s+uma\s+conta\s+globo/i,
  /a\s+globo\s+n[aã]o\s+possui\s+qualquer\s+inger[eê]ncia/i,
  /questionamentos\s+ou\s+reclama[cç][oõ]es\s+em\s+rela[cç][aã]o\s+ao\s+produto/i,
  /—\s*foto:\s*/i,
  /^por\s+[a-zÀ-ÿ\s,–—]+g1/i,
  /^\d{2}\/\d{2}\/\d{4}\s+\d{2}h\d{2}/i,
  /^agora\s+no\s+g1$/i,
  /^clique\s+aqui\s+para\s+retornar/i,
  /^veja\s+o\s+que\s+j[aá]\s+foi\s+publicado/i
];
