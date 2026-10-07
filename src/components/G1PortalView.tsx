import React, { useState } from 'react';
import { RewrittenArticle } from '../types.ts';
import { NewsletterPopup } from './NewsletterPopup.tsx';
import {
  Menu,
  ChevronRight,
  TrendingUp,
  CloudSun,
  Search,
  ExternalLink,
  Cpu,
  Clock,
  ArrowRight,
  Camera,
  Radio,
  MapPin,
  Calendar,
  Lock,
  Bell,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface IMaranhaoPortalViewProps {
  articles: RewrittenArticle[];
  onOpenArticleReader: (article: RewrittenArticle) => void;
  onSwitchToAdmin: () => void;
}

export const G1PortalView: React.FC<IMaranhaoPortalViewProps> = ({
  articles,
  onOpenArticleReader,
  onSwitchToAdmin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [forceShowNewsletter, setForceShowNewsletter] = useState<boolean>(false);

  // Hero article (top priority rewritten story)
  const heroArticle = articles[0];
  const secondaryTop1 = articles[1];
  const secondaryTop2 = articles[2];

  // Feed articles with load more pagination
  const allFeedArticles = articles.slice(3);
  const feedArticles = allFeedArticles.slice(0, visibleCount);

  const getCurrentDateFormatted = () => {
    try {
      return new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 font-sans selection:bg-[#b91c1c] selection:text-white relative">
      {/* 1. TOP UTILITY BAR (Clean, neutral & local - Public Portal) */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="capitalize text-slate-300 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3 h-3 text-red-500" />
              {getCurrentDateFormatted()}
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-400" />
              São Luís / Brasília / Brasil
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-amber-400 font-medium">
              Cobertura Especial: Maranhão & Brasil
            </span>
            <button
              onClick={() => setForceShowNewsletter(true)}
              className="text-[11px] text-white hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Receber Alertas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN IMARANHAO HEADER */}
      <header className="bg-[#b91c1c] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          {/* Menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedCategory('todos')}
              className="flex items-center gap-1.5 font-bold text-xs tracking-wider uppercase bg-black/20 hover:bg-black/30 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline">MENU</span>
            </button>
          </div>

          {/* IMARANHAO Logo */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer select-none group"
            onClick={() => setSelectedCategory('todos')}
          >
            <div className="flex items-baseline">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter lowercase font-sans text-white group-hover:opacity-95 transition-opacity">
                <span className="text-amber-300 font-extrabold">i</span>maranhao
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold text-red-100 hidden sm:block -mt-1">
              Jornalismo Autoral & Inteligência Editorial
            </span>
          </div>

          {/* Quick Newsletter Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForceShowNewsletter(true)}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Cadastrar E-mail</span>
              <span className="sm:hidden">Alertas</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. CATEGORY SUB-NAV */}
      <nav className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 flex items-center space-x-6 h-11 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`whitespace-nowrap transition-colors pb-2.5 pt-2.5 cursor-pointer ${
              selectedCategory === 'todos'
                ? 'text-[#b91c1c] border-b-2 border-[#b91c1c] font-bold'
                : 'hover:text-[#b91c1c]'
            }`}
          >
            Últimas Notícias
          </button>
          {['Maranhão', 'Política', 'Economia', 'Brasil', 'Mundo', 'Tecnologia', 'Agro', 'Cidades'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat.toLowerCase())}
              className={`whitespace-nowrap transition-colors pb-2.5 pt-2.5 cursor-pointer ${
                selectedCategory === cat.toLowerCase()
                  ? 'text-[#b91c1c] border-b-2 border-[#b91c1c] font-bold'
                  : 'hover:text-[#b91c1c]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* 4. MAIN CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* BANNER EDITORIAL IMARANHAO */}
        <div className="bg-gradient-to-r from-red-50 via-white to-amber-50 border border-red-200/70 rounded-xl p-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b91c1c] animate-pulse"></span>
            <span className="font-extrabold text-[#b91c1c]">imaranhao Notícias:</span>
            <span className="text-slate-600 hidden sm:inline">
              Jornalismo independente com cobertura factual e apuração em tempo real no Maranhão, no Brasil e no mundo.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Plantão 24h
            </span>
            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded">
              {articles.length} notícias no ar
            </span>
          </div>
        </div>

        {/* HERO SECTION: SUPER MANCHETE IMARANHAO */}
        {heroArticle && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 mb-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Left Column: Big Red Headline (Hero Lead) */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-black text-[#b91c1c] uppercase tracking-wider">
                      {heroArticle.editoria && heroArticle.editoria.toUpperCase() !== 'G1'
                        ? heroArticle.editoria
                        : 'Maranhão'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Atualizado há pouco pela Redação imaranhao
                    </span>
                  </div>

                  {/* Big Bold Red Headline */}
                  <h1
                    onClick={() => onOpenArticleReader(heroArticle)}
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-[#b91c1c] hover:text-[#991b1b] leading-[1.15] cursor-pointer transition-colors tracking-tight font-sans"
                  >
                    {heroArticle.tituloReescrito}
                  </h1>

                  {/* Subtitle / Lead */}
                  {heroArticle.subtituloReescrito && (
                    <p className="text-sm sm:text-base text-slate-700 mt-3 leading-relaxed font-serif">
                      {heroArticle.subtituloReescrito}
                    </p>
                  )}

                  {/* Bullet points / Key takeaways */}
                  {heroArticle.anotacoes && heroArticle.anotacoes.length > 0 && (
                    <ul className="mt-4 space-y-1.5 text-xs text-slate-600 border-l-2 border-[#b91c1c] pl-3.5">
                      {heroArticle.anotacoes.slice(0, 3).map((anotacao, aIdx) => (
                        <li key={aIdx} className="leading-snug">
                          {anotacao}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenArticleReader(heroArticle)}
                    className="inline-flex items-center gap-1.5 font-bold text-[#b91c1c] hover:text-[#991b1b] hover:underline cursor-pointer"
                  >
                    <span>Ler matéria completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-600" />
                    GEO Estruturado
                  </span>
                </div>
              </div>

              {/* Right Column: Hero Visuals with Photo Credit */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {heroArticle.imagem && (
                  <div
                    onClick={() => onOpenArticleReader(heroArticle)}
                    className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 cursor-pointer group shadow-xs"
                  >
                    <img
                      src={heroArticle.imagem}
                      alt={heroArticle.tituloReescrito}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3.5">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-white text-[10px] font-bold bg-[#b91c1c] px-2 py-0.5 rounded shadow-xs uppercase">
                          Destaque imaranhao
                        </span>
                        {/* Crédito da foto */}
                        <span className="text-slate-300 text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <Camera className="w-3 h-3 text-slate-300" />
                          <span className="truncate max-w-[180px]">
                            {heroArticle.creditoImagem || 'Foto: Reprodução / Divulgação'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary tile */}
                {secondaryTop1 && (
                  <div
                    onClick={() => onOpenArticleReader(secondaryTop1)}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 transition-colors cursor-pointer flex gap-3.5 items-center shadow-2xs"
                  >
                    {secondaryTop1.imagem && (
                      <div className="relative w-22 h-18 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                        <img
                          src={secondaryTop1.imagem}
                          alt={secondaryTop1.tituloReescrito}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-[#b91c1c] uppercase">
                          {secondaryTop1.editoria && secondaryTop1.editoria.toUpperCase() !== 'G1'
                            ? secondaryTop1.editoria
                            : 'Notícias'}
                        </span>
                        <span className="truncate max-w-[120px] text-slate-400">
                          {secondaryTop1.creditoImagem || 'Foto: Divulgação'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#b91c1c]">
                        {secondaryTop1.tituloReescrito}
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 5. MAIN 2-COLUMN GRID (Feed da Esquerda + Widgets da Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FEED ESQUERDA (~68% width) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]"></span>
                Últimas Notícias Publicadas
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Cobertura Diária · Redação imaranhao
              </span>
            </div>

            {feedArticles.length === 0 && !heroArticle ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
                Nenhuma notícia publicada nesta editoria no momento. Novas reportagens estão em apuração.
              </div>
            ) : (
              <div className="space-y-5">
                {feedArticles.map((article, idx) => (
                  <article
                    key={article.id || idx}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-5"
                  >
                    {/* Thumbnail left with credit badge */}
                    {article.imagem && (
                      <div
                        onClick={() => onOpenArticleReader(article)}
                        className="sm:w-60 sm:h-40 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group relative flex flex-col"
                      >
                        <img
                          src={article.imagem}
                          alt={article.tituloReescrito}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Crédito da imagem na parte inferior da foto */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-slate-200 text-[10px] px-2 py-0.5 truncate flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                          <span className="truncate">{article.creditoImagem || 'Foto: Reprodução / Divulgação'}</span>
                        </div>
                      </div>
                    )}

                    {/* Content right */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Chapéu & Badges */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-black text-[#b91c1c] uppercase tracking-wide">
                            {article.editoria && article.editoria.toUpperCase() !== 'G1'
                              ? article.editoria
                              : 'Brasil'}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">
                            GEO IA
                          </span>
                        </div>

                        {/* Red Headline */}
                        <h3
                          onClick={() => onOpenArticleReader(article)}
                          className="text-base sm:text-lg font-bold text-slate-900 hover:text-[#b91c1c] leading-snug cursor-pointer transition-colors tracking-tight"
                        >
                          {article.tituloReescrito}
                        </h3>

                        {/* Subtitle */}
                        {article.subtituloReescrito && (
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed font-serif">
                            {article.subtituloReescrito}
                          </p>
                        )}

                        {/* Direct Answer snippet for AI */}
                        {article.geo?.respostaDireta && (
                          <div className="mt-2.5 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-[11px] text-slate-600">
                            <strong className="text-purple-950 font-semibold block mb-0.5">
                              Síntese Factual (Direct Answer):
                            </strong>
                            <p className="line-clamp-2 leading-relaxed">
                              {article.geo.respostaDireta}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer: Metadata & Read button */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Redação imaranhao
                        </span>

                        <button
                          onClick={() => onOpenArticleReader(article)}
                          className="font-bold text-[#b91c1c] hover:underline cursor-pointer text-xs"
                        >
                          Ler matéria completa
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Bottom Button: Carregar mais notícias */}
            {allFeedArticles.length > visibleCount && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider px-8 py-3 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#b91c1c]" />
                  <span>CARREGAR MAIS NOTÍCIAS</span>
                </button>
              </div>
            )}
          </div>

          {/* SIDEBAR DIREITA (~32% width) - WIDGETS IMARANHAO */}
          <aside className="lg:col-span-4 space-y-6">
            {/* WIDGET 1: PREVISÃO DO TEMPO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-amber-500" />
                  Previsão do Tempo
                </span>
                <span className="text-[11px] text-slate-500 font-medium">São Luís, MA</span>
              </div>
              <div className="flex items-center justify-between pt-3 text-xs">
                <div>
                  <span className="text-3xl font-black text-slate-900">30°</span>
                  <span className="text-slate-500 text-xs ml-1.5">Sol com nuvens</span>
                </div>
                <div className="text-[11px] text-slate-500 text-right">
                  <div>Máx: <strong className="text-slate-800">32°</strong></div>
                  <div>Mín: <strong className="text-slate-800">24°</strong></div>
                </div>
              </div>
            </div>

            {/* WIDGET 2: MAIS LIDAS (Numbered 1 to 5) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <h3 className="font-black text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Mais Lidas da Semana</span>
                <span className="text-[10px] text-slate-400 font-normal">imaranhao</span>
              </h3>
              <div className="divide-y divide-slate-100">
                {articles.slice(0, 5).map((art, idx) => (
                  <div
                    key={art.id || idx}
                    onClick={() => onOpenArticleReader(art)}
                    className="py-3 flex items-start gap-3 cursor-pointer group"
                  >
                    <span className="text-xl font-black text-[#b91c1c] shrink-0 w-5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-[#b91c1c] leading-snug line-clamp-2">
                        {art.tituloReescrito}
                      </p>
                      {art.creditoImagem && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {art.creditoImagem}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WIDGET 3: ECONOMIA & MOEDAS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Mercados & Cotações
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  Ibovespa +2,63%
                </span>
              </div>
              <div className="pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Dólar Comercial</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-mono">R$ 5,216</strong>
                    <span className="text-red-600 text-[11px]">-0,08%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Euro</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-mono">R$ 5,872</strong>
                    <span className="text-emerald-600 text-[11px]">+0,06%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 4: COMUNICAÇÃO IMARANHAO */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-2">
                <Radio className="w-4 h-4" />
                <span>EDITORIAL IMARANHAO</span>
              </div>
              <h4 className="text-sm font-bold leading-snug">
                Análise em Foco: Bastidores do Poder e Economia
              </h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Cobertura aprofundada com apuração dos principais acontecimentos do Maranhão e do Brasil.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* 6. IMARANHAO FOOTER (Discreet Admin Link for authorized personnel) */}
      <footer className="bg-slate-900 text-white py-10 mt-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-black tracking-tight lowercase text-white">
                <span className="text-amber-400">i</span>maranhao
              </span>
              <span className="text-xs text-slate-400 ml-2">| Portal de Notícias</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="hover:text-white cursor-pointer">Quem Somos</span>
              <span className="hover:text-white cursor-pointer">Princípios Editoriais</span>
              <span className="hover:text-white cursor-pointer">Política de Privacidade</span>
              <span className="hover:text-white cursor-pointer">Fale Conosco</span>
              {/* Discreet editorial access link */}
              <button
                onClick={onSwitchToAdmin}
                className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer ml-2"
                title="Acesso Editorial Restrito"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Área Editorial</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>© 2026 imaranhao Comunicação & Notícias. Todos os direitos reservados.</p>
            <p>Jornalismo independente · Cobertura factual e apuração em tempo real</p>
          </div>
        </div>
      </footer>

      {/* POPUP DE CAPTURA DE LEADS (Aparece ao entrar ou quando clicado) */}
      <NewsletterPopup />
    </div>
  );
};
