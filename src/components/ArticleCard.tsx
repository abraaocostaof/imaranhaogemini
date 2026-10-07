import React from 'react';
import { ExternalLink, SplitSquareVertical, FileText, CheckCircle2, AlertCircle, ImageOff } from 'lucide-react';
import { ScrapedArticle } from '../types.ts';

interface ArticleCardProps {
  article: ScrapedArticle;
  index: number;
  onOpenAudit: (article: ScrapedArticle) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  index,
  onOpenAudit,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const isAuditPassing = article.auditChecks?.temTitulo &&
                         article.auditChecks?.paragrafosSuficientes &&
                         article.auditChecks?.temDataValida;

  return (
    <article className="group bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100">
        {article.imagem ? (
          <img
            src={article.imagem}
            alt={article.titulo}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // fallback image if broken or blocked
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
            <ImageOff className="w-8 h-8 stroke-[1.5]" />
            <span className="text-xs">Sem imagem de destaque</span>
          </div>
        )}

        {/* Index counter kicker */}
        <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded">
          #{index + 1}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Kicker / Editoria as quiet uppercase text without pill enclosure */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <span className="text-red-700 font-semibold tracking-wider uppercase text-[11px]">
            {article.editoria || 'G1'}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{formatDate(article.dataPublicacao)}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{article.tempoLeituraMinutos || 2} min de leitura</span>
        </div>

        {/* Headline */}
        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-red-700 transition-colors mb-2">
          {article.titulo}
        </h3>

        {/* Subtitle / Linha-fina */}
        {article.subtitulo ? (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 flex-1">
            {article.subtitulo}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-4 flex-1">
            (Sem linha-fina declarada)
          </p>
        )}

        {/* Extraction Audit Telemetry */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1.5 font-medium">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700">{article.quantidadeParagrafos}</span>
            <span>parágrafos extraídos</span>
          </div>

          <div className="flex items-center gap-1">
            {isAuditPassing ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Estruturado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Revisar
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={() => onOpenAudit(article)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <SplitSquareVertical className="w-4 h-4" />
            <span>Abrir Comparador</span>
          </button>

          <a
            href={article.urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Abrir matéria original no G1"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  );
};
