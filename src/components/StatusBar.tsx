import React from 'react';
import { Clock, Layers, FileText, CheckCircle, Download, ShieldCheck } from 'lucide-react';
import { ScrapedArticle } from '../types.ts';

interface StatusBarProps {
  lastScrapedAt: string | null;
  editoria: string | null;
  articles: ScrapedArticle[];
  onExportJson: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  lastScrapedAt,
  editoria,
  articles,
  onExportJson,
}) => {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Nenhuma extração recente';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' (' + date.toLocaleDateString('pt-BR') + ')';
    } catch {
      return isoString;
    }
  };

  const avgParagraphs = articles.length
    ? Math.round(articles.reduce((acc, a) => acc + (a.quantidadeParagrafos || 0), 0) / articles.length)
    : 0;

  const totalWords = articles.reduce((acc, a) => acc + (a.palavrasTotais || 0), 0);

  return (
    <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        {/* Status items with clean typographical separators (Zero-Pill compliant) */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Feed Ativo:</span>
            <span className="capitalize text-slate-900 font-semibold">{editoria || 'Geral'}</span>
          </div>

          <span className="text-slate-300" aria-hidden="true">|</span>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Última extração: {formatTime(lastScrapedAt)}</span>
          </div>

          <span className="text-slate-300" aria-hidden="true">|</span>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{articles.length} matérias na fila</span>
          </div>

          {articles.length > 0 && (
            <>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Média: {avgParagraphs} parágrafos ({totalWords.toLocaleString('pt-BR')} palavras)</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {articles.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saneamento Ativo</span>
            </div>
            <button
              onClick={onExportJson}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-medium transition-colors hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar JSON</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
