import React, { useState } from 'react';
import { Newspaper, RefreshCw, Link as LinkIcon, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { EditoriaOption } from '../types.ts';

interface HeaderProps {
  editorias: EditoriaOption[];
  selectedEditoria: string;
  onSelectEditoria: (id: string) => void;
  onScrape: () => void;
  isLoading: boolean;
  onScrapeCustomUrl: (url: string) => void;
  isCustomUrlLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  editorias,
  selectedEditoria,
  onSelectEditoria,
  onScrape,
  isLoading,
  onScrapeCustomUrl,
  isCustomUrlLoading,
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onScrapeCustomUrl(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl('');
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              G1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                  Extrator & Validador de Notícias
                </h1>
                <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded">
                  PoC Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Raspagem estruturada, saneamento de ruídos e conferência lado a lado
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Editoria Selector */}
            <div className="relative inline-flex items-center">
              <label htmlFor="editoria-select" className="sr-only">Editoria</label>
              <select
                id="editoria-select"
                value={selectedEditoria}
                onChange={(e) => onSelectEditoria(e.target.value)}
                disabled={isLoading}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-sm font-medium rounded-lg pl-3 pr-8 py-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                {editorias.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Scrape 5 Articles Button */}
            <button
              onClick={onScrape}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Extraindo 5 Notícias...' : 'Extrair 5 Notícias Recentes'}</span>
            </button>

            {/* Custom URL scraper trigger */}
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer"
              title="Testar URL avulsa do G1"
            >
              <LinkIcon className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">URL Avulsa</span>
            </button>
          </div>
        </div>

        {/* Custom URL Input Bar */}
        {showUrlInput && (
          <form
            onSubmit={handleCustomSubmit}
            className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 animate-in fade-in duration-200"
          >
            <div className="relative flex-1">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Cole qualquer link de notícia do G1 (ex: https://g1.globo.com/.../noticia/...ghtml)"
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCustomUrlLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isCustomUrlLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Extrair URL</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </header>
  );
};
