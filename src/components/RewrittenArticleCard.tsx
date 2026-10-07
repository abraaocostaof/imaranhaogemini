import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  ListFilter,
  Tag,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  Code2,
  Flame,
  MessageCircle,
  Link2
} from 'lucide-react';
import { RewrittenArticle } from '../types.ts';

interface RewrittenArticleCardProps {
  article: RewrittenArticle;
  index: number;
  onMarkPublished: (id: string) => void;
}

export const RewrittenArticleCard: React.FC<RewrittenArticleCardProps> = ({
  article,
  index,
  onMarkPublished,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showGeo, setShowGeo] = useState(true);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/noticia/${article.id}`
    : `/noticia/${article.id}`;

  const shareOnWhatsApp = () => {
    const text = `*${article.tituloReescrito}*\n\n${article.subtituloReescrito || ''}\n\nConfira no imaranhao:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const copyFullArticle = () => {
    const textToCopy = [
      article.tituloReescrito,
      '',
      article.subtituloReescrito,
      '',
      '--- GEO: RESPOSTA DIRETA P/ IA ---',
      article.geo?.respostaDireta || '',
      '',
      '--- ANOTAÇÕES & PONTOS-CHAVE ---',
      ...article.anotacoes.map(a => `• ${a}`),
      '',
      '--- TEXTO DA MATÉRIA ---',
      ...article.corpoReescrito,
      '',
      '--- FAQ GEO ---',
      ...(article.geo?.faq || []).map(f => `P: ${f.pergunta}\nR: ${f.resposta}`),
      '',
      `Fonte original: ${article.urlOriginal}`
    ].join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySchemaJsonLd = () => {
    if (article.geo?.schemaJsonLd) {
      navigator.clipboard.writeText(article.geo.schemaJsonLd);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const isPublished = article.status === 'publicada';

  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden flex flex-col">
      {/* Card Header Status */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">
            #{index + 1}
          </span>
          <span className="text-red-700 font-bold uppercase tracking-wider text-[11px]">
            {article.editoria && article.editoria.toUpperCase() !== 'G1' ? article.editoria : 'Brasil'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            Processada em {formatDate(article.processadoEm)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* GEO Badge */}
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/80 text-[10px] font-bold px-2 py-0.5 rounded">
            <Cpu className="w-3 h-3 text-purple-600" />
            GEO Estruturado
          </span>

          {isPublished ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Publicada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Reescrita Autoral
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Comparison: Original vs Rewritten Headlines */}
        <div className="space-y-3">
          {/* Original headline (subdued) */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Título Original do G1 (Bloqueado p/ Evitar Plágio):
            </span>
            <p className="text-slate-700 line-clamp-2 italic">
              "{article.tituloOriginal}"
            </p>
          </div>

          {/* New Autoral Headline */}
          <div>
            <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Novo Título Autoral (Otimizado SEO & GEO):</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {article.tituloReescrito}
            </h3>
            {article.subtituloReescrito && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-serif">
                {article.subtituloReescrito}
              </p>
            )}
          </div>
        </div>

        {/* Thumbnail preview with image credits */}
        {article.imagem && (
          <div className="rounded-xl overflow-hidden aspect-video max-h-48 bg-slate-100 border border-slate-200 relative flex flex-col">
            <img
              src={article.imagem}
              alt={article.tituloReescrito}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {article.creditoImagem && (
              <div className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-xs text-slate-200 text-[10px] px-2.5 py-1 truncate">
                {article.creditoImagem}
              </div>
            )}
          </div>
        )}

        {/* GEO (Generative Engine Optimization) Box */}
        {article.geo && (
          <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowGeo(!showGeo)}
              className="w-full bg-purple-100/60 hover:bg-purple-100 p-3 text-left flex items-center justify-between text-xs font-bold text-purple-950 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                Estrutura GEO (Generative Engine Optimization p/ Motores de IA)
              </span>
              {showGeo ? <ChevronUp className="w-4 h-4 text-purple-700" /> : <ChevronDown className="w-4 h-4 text-purple-700" />}
            </button>

            {showGeo && (
              <div className="p-4 space-y-3.5 text-xs text-purple-950 border-t border-purple-100">
                {/* Direct Answer for AI Overviews / Perplexity / ChatGPT */}
                {article.geo.respostaDireta && (
                  <div>
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide block mb-1">
                      Resposta Direta (Direct Answer / Perplexity & ChatGPT Citation):
                    </span>
                    <p className="bg-white p-3 rounded-lg border border-purple-200 text-slate-800 leading-relaxed font-medium">
                      {article.geo.respostaDireta}
                    </p>
                  </div>
                )}

                {/* Key Entities */}
                {article.geo.entidadesChave && article.geo.entidadesChave.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide block mb-1">
                      Entidades Semânticas Mapeadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {article.geo.entidadesChave.map((ent, eIdx) => (
                        <span key={eIdx} className="bg-white border border-purple-200 text-purple-900 text-[11px] px-2 py-0.5 rounded font-medium">
                          {ent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ for AI */}
                {article.geo.faq && article.geo.faq.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide block">
                      FAQ Estruturado para Crawlers de IA:
                    </span>
                    <div className="space-y-1.5">
                      {article.geo.faq.map((item, fIdx) => (
                        <div key={fIdx} className="bg-white p-2.5 rounded-lg border border-purple-200 space-y-1">
                          <p className="font-bold text-purple-900 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            {item.pergunta}
                          </p>
                          <p className="text-slate-700 pl-5 leading-relaxed">
                            {item.resposta}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schema.org Button */}
                {article.geo.schemaJsonLd && (
                  <div className="flex items-center justify-between pt-2 border-t border-purple-200/60 text-[11px]">
                    <span className="text-purple-700">Schema.org JSON-LD (NewsArticle) pronto</span>
                    <button
                      onClick={copySchemaJsonLd}
                      className="inline-flex items-center gap-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Code2 className="w-3 h-3" />}
                      <span>{copiedSchema ? 'Copiado!' : 'Copiar JSON-LD'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Anotações da Pauta (Key takeaways) */}
        {article.anotacoes && article.anotacoes.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5 text-amber-700" />
              Anotações & Pontos-Chave Apurados:
            </h4>
            <ul className="text-xs text-amber-900/90 space-y-1.5 pl-1">
              {article.anotacoes.map((anotacao, aIdx) => (
                <li key={aIdx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <span>{anotacao}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rewritten Body (Collapsible) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full bg-slate-50 hover:bg-slate-100 p-3 text-left flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Texto Completo Reescrito ({article.corpoReescrito.length} parágrafos)
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {expanded && (
            <div className="p-4 bg-white space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-serif border-t border-slate-100">
              {article.corpoReescrito.map((paragrafo, pIdx) => (
                <p key={pIdx}>{paragrafo}</p>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {article.tags.map((t, tIdx) => (
              <span key={tIdx} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={shareOnWhatsApp}
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Compartilhar no WhatsApp com prévia de foto e título"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
              title="Copiar link direto para envio"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={copyFullArticle}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            {!isPublished ? (
              <button
                onClick={() => onMarkPublished(article.id)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar Publicada</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-700 font-medium">
                Publicada em {formatDate(article.publicadoEm || article.processadoEm)}
              </span>
            )}
          </div>

          <a
            href={article.urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-xs font-medium hover:underline"
          >
            <span>Ver Fonte Original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
