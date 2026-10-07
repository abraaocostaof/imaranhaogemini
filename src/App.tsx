import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { StatusBar } from './components/StatusBar.tsx';
import { ArticleCard } from './components/ArticleCard.tsx';
import { AuditModal } from './components/AuditModal.tsx';
import { EmptyState } from './components/EmptyState.tsx';
import { MonitorControl } from './components/MonitorControl.tsx';
import { RewrittenArticleCard } from './components/RewrittenArticleCard.tsx';
import { CycleLogsView } from './components/CycleLogsView.tsx';
import { G1PortalView } from './components/G1PortalView.tsx';
import { G1ArticleReaderModal } from './components/G1ArticleReaderModal.tsx';
import { AdminLeadsView } from './components/AdminLeadsView.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { ScrapedArticle, EditoriaOption, RegistryState, RewrittenArticle } from './types.ts';
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  SplitSquareVertical,
  History,
  Layout,
  SlidersHorizontal,
  ExternalLink,
  Users,
  LogOut
} from 'lucide-react';

const DEFAULT_EDITORIAS: EditoriaOption[] = [
  { id: 'geral', name: 'Geral (Brasil)', description: 'Principais notícias do Brasil' },
  { id: 'politica', name: 'Política', description: 'Poder, Congresso e STF' },
  { id: 'economia', name: 'Economia', description: 'Mercados, inflação e negócios' },
  { id: 'tecnologia', name: 'Tecnologia', description: 'Inovação e inteligência artificial' },
  { id: 'carros', name: 'Carros', description: 'Lançamentos e mobilidade' },
  { id: 'ciencia-e-saude', name: 'Ciência e Saúde', description: 'Saúde e pesquisas médicas' },
  { id: 'mundo', name: 'Mundo', description: 'Notícias internacionais' },
];

export default function App() {
  const [editorias, setEditorias] = useState<EditoriaOption[]>(DEFAULT_EDITORIAS);
  const [selectedEditoria, setSelectedEditoria] = useState<string>('geral');
  const [articles, setArticles] = useState<ScrapedArticle[]>([]);
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCustomLoading, setIsCustomLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeAuditArticle, setActiveAuditArticle] = useState<ScrapedArticle | null>(null);

  // View Mode: 'portal' vs 'admin'
  const [viewMode, setViewMode] = useState<'portal' | 'admin'>('portal');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? !!localStorage.getItem('imaranhao_auth_token') : false;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Active article reader modal for the G1 portal
  const [selectedReadingArticle, setSelectedReadingArticle] = useState<RewrittenArticle | null>(null);

  // Monitor & Registry State
  const [registry, setRegistry] = useState<RegistryState | null>(null);
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rewritten' | 'comparator' | 'logs' | 'leads'>('rewritten');
  const [leadsCount, setLeadsCount] = useState<number>(0);

  // Fetch monitor registry state
  const fetchRegistryState = async () => {
    try {
      const res = await fetch('/api/monitor/state');
      if (res.ok) {
        const data: RegistryState = await res.json();
        setRegistry(data);
      }
    } catch (e: any) {
      console.warn('Error fetching registry state:', e.message);
    }
  };

  const fetchLeadsCount = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLeadsCount(data.length);
      }
    } catch (e) {
      // ignore
    }
  };

  // Load editorias, cached articles, and monitor state on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 1. Fetch available editorias
        const edRes = await fetch('/api/editorias');
        if (edRes.ok) {
          const edData = await edRes.json();
          if (Array.isArray(edData) && edData.length > 0) {
            setEditorias(edData);
          }
        }

        // 2. Fetch cached articles
        const artRes = await fetch('/api/articles');
        if (artRes.ok) {
          const artData = await artRes.json();
          if (artData && Array.isArray(artData.articles) && artData.articles.length > 0) {
            setArticles(artData.articles);
            setLastScrapedAt(artData.lastScrapedAt);
            if (artData.editoria) {
              setSelectedEditoria(artData.editoria);
            }
          }
        }

        // 3. Fetch monitor & deduplication registry
        await fetchRegistryState();
        await fetchLeadsCount();
      } catch (err: any) {
        console.warn('Initial data load notice:', err.message);
      }
    };

    loadInitialData();
  }, []);

  // Poll registry status periodically to keep countdown & cycle logs synced
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRegistryState();
      fetchLeadsCount();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Check direct URL navigation for articles (e.g. /noticia/rw-123) or /admin
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.pathname === '/painel') {
      if (isAuthenticated) {
        setViewMode('admin');
        setShowLoginModal(false);
      } else {
        setViewMode('portal');
        setShowLoginModal(true);
      }
      return;
    }

    const match = window.location.pathname.match(/\/noticia\/([^\/]+)/);
    const initialArticleId = (window as any).__INITIAL_ARTICLE_ID__ || (match && match[1]);

    if (initialArticleId && registry?.articles && registry.articles.length > 0) {
      const found = registry.articles.find(a => a.id === initialArticleId || a.originalId === initialArticleId);
      if (found) {
        setSelectedReadingArticle(found);
      }
    }
  }, [registry?.articles, isAuthenticated]);

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.pathname === '/painel') {
        if (isAuthenticated) {
          setViewMode('admin');
          setShowLoginModal(false);
        } else {
          setViewMode('portal');
          setShowLoginModal(true);
        }
        setSelectedReadingArticle(null);
        return;
      }

      setViewMode('portal');
      setShowLoginModal(false);
      const match = window.location.pathname.match(/\/noticia\/([^\/]+)/);
      if (match && match[1] && registry?.articles) {
        const found = registry.articles.find(a => a.id === match[1] || a.originalId === match[1]);
        if (found) {
          setSelectedReadingArticle(found);
          return;
        }
      }
      setSelectedReadingArticle(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [registry?.articles, isAuthenticated]);

  const handleOpenArticle = (art: RewrittenArticle) => {
    setSelectedReadingArticle(art);
    try {
      window.history.pushState(null, '', `/noticia/${art.id}`);
    } catch {}
  };

  const handleCloseArticle = () => {
    setSelectedReadingArticle(null);
    try {
      window.history.pushState(null, '', viewMode === 'admin' ? '/admin' : '/');
    } catch {}
  };

  const handleGoToAdmin = () => {
    if (isAuthenticated) {
      setViewMode('admin');
      setShowLoginModal(false);
      try {
        window.history.pushState(null, '', '/admin');
      } catch {}
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setViewMode('admin');
    try {
      window.history.pushState(null, '', '/admin');
    } catch {}
  };

  const handleLoginCancel = () => {
    setShowLoginModal(false);
    setViewMode('portal');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('imaranhao_auth_token');
    localStorage.removeItem('imaranhao_auth_user');
    setIsAuthenticated(false);
    setShowLoginModal(false);
    setViewMode('portal');
    try {
      window.history.pushState(null, '', '/');
    } catch {}
  };

  const handleGoToPortal = () => {
    setViewMode('portal');
    setShowLoginModal(false);
    try {
      window.history.pushState(null, '', '/');
    } catch {}
  };

  // Keyboard shortcut: close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeAuditArticle) setActiveAuditArticle(null);
        if (selectedReadingArticle) handleCloseArticle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAuditArticle, selectedReadingArticle]);

  // Main scraper function
  const handleScrape = useCallback(async (editoriaKey?: string) => {
    const targetEditoria = editoriaKey || selectedEditoria;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scrape?editoria=${encodeURIComponent(targetEditoria)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha na requisição (HTTP ${response.status})`);
      }

      const data: ScrapedArticle[] = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Nenhuma notícia retornada para a editoria.');
      }

      setArticles(data);
      setSelectedEditoria(targetEditoria);
      setLastScrapedAt(new Date().toISOString());

      setSuccessToast(`5 matérias extraídas com sucesso da editoria "${targetEditoria}"!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Scrape error:', err);
      setError(err.message || 'Erro ao realizar a raspagem das notícias.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEditoria]);

  // Run 1-Hour Monitoring Cycle
  const handleRunMonitoringCycle = async () => {
    setIsRunningCycle(true);
    setError(null);

    try {
      const response = await fetch('/api/monitor/run', { method: 'POST' });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao executar ciclo de monitoramento.');
      }

      const result = await response.json();
      await fetchRegistryState();

      if (result.newCount > 0) {
        setSuccessToast(`Ciclo concluído: ${result.totalExamined} avaliadas no G1 → ${result.duplicatesCount} já publicadas (bloqueadas), ${result.newCount} novas reescritas com sucesso!`);
      } else {
        setSuccessToast(`Ciclo concluído: Todas as ${result.totalExamined} matérias já haviam sido publicadas anteriormente. Zero duplicações!`);
      }
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      console.error('Cycle error:', err);
      setError(err.message || 'Erro ao rodar ciclo de monitoramento.');
    } finally {
      setIsRunningCycle(false);
    }
  };

  // Update Scheduler Config
  const handleUpdateConfig = async (intervalMinutes: number, enabled: boolean) => {
    try {
      const res = await fetch('/api/monitor/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes, enabled }),
      });
      if (res.ok) {
        await fetchRegistryState();
        setSuccessToast(`Configuração atualizada: Verificação a cada ${intervalMinutes} min (${enabled ? 'Ativo' : 'Pausado'}).`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (e: any) {
      setError('Erro ao atualizar configurações: ' + e.message);
    }
  };

  // Mark article as published
  const handleMarkPublished = async (id: string) => {
    try {
      const res = await fetch(`/api/monitor/publish/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchRegistryState();
        setSuccessToast('Matéria marcada como publicada no banco!');
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (e: any) {
      setError('Erro ao marcar publicação: ' + e.message);
    }
  };

  // Clear registry
  const handleClearRegistry = async () => {
    try {
      const res = await fetch('/api/monitor/clear', { method: 'POST' });
      if (res.ok) {
        await fetchRegistryState();
        setSuccessToast('Banco de deduplicação reiniciado.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (e: any) {
      setError('Erro ao limpar histórico: ' + e.message);
    }
  };

  // Custom single URL scraper
  const handleScrapeCustomUrl = async (url: string) => {
    setIsCustomLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao processar URL.');
      }

      const article: ScrapedArticle = await response.json();

      setArticles((prev) => [article, ...prev.filter((a) => a.id !== article.id)]);
      setActiveAuditArticle(article);
      setActiveTab('comparator');
      setViewMode('admin');
      setSuccessToast('Notícia capturada com sucesso! Painel de auditoria aberto.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Custom URL scrape error:', err);
      setError(err.message || 'Erro ao extrair URL personalizada.');
    } finally {
      setIsCustomLoading(false);
    }
  };

  // Export articles as JSON file
  const handleExportJson = () => {
    const listToExport = registry?.articles || articles;
    if (!listToExport.length) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(listToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `imaranhao-noticias-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const rewrittenList = registry?.articles || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-[#b91c1c] selection:text-white">
      {/* VIEW 1: PORTAL IMARANHAO (TELA INICIAL PADRÃO) */}
      {viewMode === 'portal' ? (
        <G1PortalView
          articles={rewrittenList}
          onOpenArticleReader={handleOpenArticle}
          onSwitchToAdmin={handleGoToAdmin}
        />
      ) : (
        /* VIEW 2: PAINEL EDITORIAL & MONITOR */
        <div className="flex-1 flex flex-col">
          {/* Admin Header Top Banner */}
          <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">imaranhao</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">Painel de Monitoramento & Inteligência Editorial</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoToPortal}
                className="inline-flex items-center gap-1.5 bg-[#b91c1c] hover:bg-red-700 text-white font-bold text-xs px-3 py-1 rounded transition-colors cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Ver Portal imaranhao</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                title="Encerrar sessão de administrador"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Header with control bar */}
          <Header
            editorias={editorias}
            selectedEditoria={selectedEditoria}
            onSelectEditoria={(id) => {
              setSelectedEditoria(id);
              handleScrape(id);
            }}
            onScrape={() => handleScrape()}
            isLoading={isLoading}
            onScrapeCustomUrl={handleScrapeCustomUrl}
            isCustomUrlLoading={isCustomLoading}
          />

          {/* Status Bar */}
          <StatusBar
            lastScrapedAt={lastScrapedAt || registry?.config?.lastRunAt || null}
            editoria={selectedEditoria}
            articles={articles}
            onExportJson={handleExportJson}
          />

          {/* Notification Toast */}
          {successToast && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full animate-in fade-in slide-in-from-top-2">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successToast}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleRunMonitoringCycle()}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 underline ml-3 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Main Container */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                <button
                  onClick={() => setActiveTab('rewritten')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'rewritten'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pautas & Notícias da Redação</span>
                  {rewrittenList.length > 0 && (
                    <span className="bg-[#b91c1c] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {rewrittenList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('leads')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'leads'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Leads & Contatos</span>
                  {leadsCount > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {leadsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('comparator')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'comparator'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5 text-slate-700" />
                  <span>Auditor de Apuração</span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-slate-700" />
                  <span>Histórico de Ciclos</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('portal')}
                  className="inline-flex items-center gap-1.5 bg-[#b91c1c] hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Ver Portal imaranhao</span>
                </button>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Multi-fonte & Anti-duplicação ativo</span>
                </div>
              </div>
            </div>

            {/* TAB 1: MONITOR & REWRITTEN ARTICLES */}
            {activeTab === 'rewritten' && (
              <div>
                {/* Monitor Control Bar */}
                <MonitorControl
                  registry={registry}
                  onRunCycle={handleRunMonitoringCycle}
                  isRunningCycle={isRunningCycle}
                  onUpdateConfig={handleUpdateConfig}
                  onClearRegistry={handleClearRegistry}
                />

                {/* List of Rewritten Articles */}
                {rewrittenList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-xs">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Nenhuma notícia processada ainda
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Clique no botão abaixo para capturar as <strong>10 primeiras notícias</strong> da página inicial do G1 (<code>https://g1.globo.com/</code>), filtrar as duplicadas e reescrevê-las automaticamente.
                    </p>
                    <div className="mt-5">
                      <button
                        onClick={handleRunMonitoringCycle}
                        disabled={isRunningCycle}
                        className="inline-flex items-center gap-2 bg-[#c4170c] hover:bg-red-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
                        <span>{isRunningCycle ? 'Processando...' : 'Iniciar Ciclo das 10 Notícias Agora'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900">
                        Notícias Anotadas e Reescritas Prontas para Publicação ({rewrittenList.length})
                      </h3>
                      <span className="text-xs text-slate-500">
                        Todas verificadas contra o histórico — Zero duplicadas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {rewrittenList.map((article, idx) => (
                        <RewrittenArticleCard
                          key={article.id || idx}
                          article={article}
                          index={idx}
                          onMarkPublished={handleMarkPublished}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AUDITOR COMPARATIVO LADO A LADO */}
            {activeTab === 'comparator' && (
              <div>
                {isLoading && articles.length === 0 ? (
                  <div className="py-24 text-center">
                    <RefreshCw className="w-8 h-8 text-[#c4170c] animate-spin mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-slate-800">
                      Consultando RSS e extraindo matérias do G1...
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Baixando HTML, filtrando anúncios e sanitizando parágrafos via Cheerio.
                    </p>
                  </div>
                ) : articles.length === 0 ? (
                  <EmptyState
                    editorias={editorias}
                    onSelectAndScrape={(id) => {
                      setSelectedEditoria(id);
                      handleScrape(id);
                    }}
                    isLoading={isLoading}
                  />
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-slate-200 gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                          Matérias Extraídas Diretamente (Deep Scraping)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Clique em "Abrir Comparador" em qualquer notícia para iniciar a conferência visual lado a lado.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{articles.length} notícias</span>
                        <span>processadas sem anúncios</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {articles.map((article, idx) => (
                        <ArticleCard
                          key={article.id || article.urlOriginal || idx}
                          article={article}
                          index={idx}
                          onOpenAudit={(art) => setActiveAuditArticle(art)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HISTÓRICO & LOGS */}
            {activeTab === 'logs' && (
              <CycleLogsView logs={registry?.logs || []} />
            )}

            {/* TAB 4: LEADS & CONTATOS CAPTURADOS */}
            {activeTab === 'leads' && (
              <AdminLeadsView />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">imaranhao</span>
                <span>·</span>
                <span>Central de Inteligência & Gestão Editorial</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Node.js · Express · Cheerio · React</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Side-by-Side Audit Modal (For Cheerio comparator) */}
      {activeAuditArticle && (
        <AuditModal
          article={activeAuditArticle}
          articles={articles}
          onClose={() => setActiveAuditArticle(null)}
          onNavigate={(art) => setActiveAuditArticle(art)}
        />
      )}

      {/* Full Reading Page Modal */}
      {selectedReadingArticle && (
        <G1ArticleReaderModal
          article={selectedReadingArticle}
          onClose={handleCloseArticle}
        />
      )}

      {/* Admin Login Authentication Modal */}
      {showLoginModal && (
        <AdminLoginModal
          onSuccess={handleLoginSuccess}
          onCancel={handleLoginCancel}
        />
      )}
    </div>
  );
}
