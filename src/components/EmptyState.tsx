import React from 'react';
import { Newspaper, ArrowRight, ShieldCheck, Filter, FileSearch, Sparkles } from 'lucide-react';
import { EditoriaOption } from '../types.ts';

interface EmptyStateProps {
  editorias: EditoriaOption[];
  onSelectAndScrape: (id: string) => void;
  isLoading: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  editorias,
  onSelectAndScrape,
  isLoading,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-600/10 text-red-600 mx-auto flex items-center justify-center mb-5">
        <Newspaper className="w-8 h-8" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
        Sistema de Extração & Validação de Notícias do G1
      </h2>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Protótipo automatizado para captura das 5 matérias mais recentes do portal G1, saneamento profundo de parágrafos (remoção de anúncios e ruídos de WhatsApp) e auditoria visual lado a lado.
      </p>

      {/* Main Action */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => onSelectAndScrape('geral')}
          disabled={isLoading}
          className="inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isLoading ? 'Extraindo Notícias...' : 'Iniciar Extração: Feed Geral (Brasil)'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Editorias Quick Start (Interactive tabs per design constitution) */}
      <div className="mt-10 pt-8 border-t border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Ou escolha uma editoria específica para testar:
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {editorias.map((ed) => (
            <button
              key={ed.id}
              onClick={() => onSelectAndScrape(ed.id)}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:border-red-400 hover:text-red-700 transition-colors cursor-pointer"
            >
              {ed.name}
            </button>
          ))}
        </div>
      </div>

      {/* Architecture feature badges */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-1.5">
            <FileSearch className="w-4 h-4 text-red-600" />
            <span>Descoberta via RSS</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consumo automático dos canais RSS da Globo com fallback inteligente para a home da editoria.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-1.5">
            <Filter className="w-4 h-4 text-red-600" />
            <span>Filtro Anti-Ruído</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exclusão de chamadas de canais de WhatsApp, blocos de "Leia Também", publicidades e podcasts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auditoria Comparativa</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Painel dividido em duas colunas para conferir o texto limpo extraído contra a publicação oficial original.
          </p>
        </div>
      </div>
    </div>
  );
};
