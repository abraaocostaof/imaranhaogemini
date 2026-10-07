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
  scrapedAt?: string;
  auditChecks?: {
    temTitulo: boolean;
    temSubtitulo: boolean;
    temDataValida: boolean;
    temImagem: boolean;
    paragrafosSuficientes: boolean;
    livreDeRuido: boolean;
  };
}

export interface ArticlesResponse {
  lastScrapedAt: string | null;
  editoria: string | null;
  total: number;
  articles: ScrapedArticle[];
}

export interface EditoriaOption {
  id: string;
  name: string;
  description: string;
}

export interface RewrittenArticle {
  id: string;
  originalId: string;
  urlOriginal: string;
  imagem: string;
  creditoImagem?: string;
  editoria: string;
  dataPublicacaoOriginal: string;
  processadoEm: string;
  
  // Dados Originais
  tituloOriginal: string;
  subtituloOriginal: string;

  // Anotações & Pontos-chave
  anotacoes: string[];

  // Conteúdo Reescrito
  tituloReescrito: string;
  subtituloReescrito: string;
  corpoReescrito: string[];
  tags: string[];

  // GEO - Generative Engine Optimization (Otimização para Motores Generativos / IA)
  geo?: {
    respostaDireta: string; // Resposta concisa para IAs (Perplexity / AI Overviews / ChatGPT)
    entidadesChave: string[]; // Entidades semânticas (pessoas, órgãos, leis, locais)
    faq: Array<{ pergunta: string; resposta: string }>; // Perguntas frequentes estruturadas
    schemaJsonLd: string; // Schema.org NewsArticle + FAQPage em JSON-LD
    metaDescription: string; // Meta descrição de alta densidade informativa
  };

  // Metadados de publicação
  status: 'nova' | 'reescrita' | 'publicada';
  publicadoEm?: string;
}

export interface CycleLog {
  id: string;
  timestamp: string;
  totalExamined: number;
  duplicatesCount: number;
  newCount: number;
  newTitles: string[];
}

export interface RegistryState {
  config: {
    intervalMinutes: number;
    enabled: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
  };
  articles: RewrittenArticle[];
  logs: CycleLog[];
}

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
}
