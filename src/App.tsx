import React, { useState, useEffect, useCallback } from 'react';
import { AuditModal } from './components/AuditModal.tsx';
import { G1PortalView } from './components/G1PortalView.tsx';
import { G1ArticleReaderModal } from './components/G1ArticleReaderModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminExecutiveDashboard } from './components/AdminExecutiveDashboard.tsx';
import { ScrapedArticle, EditoriaOption, RegistryState, RewrittenArticle } from './types.ts';

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
        /* VIEW 2: PAINEL EDITORIAL EXECUTIVO & AUDITORIA DE FONTES */
        <AdminExecutiveDashboard
          articles={rewrittenList}
          registry={registry}
          leadsCount={leadsCount}
          isRunningCycle={isRunningCycle}
          onRunCycle={handleRunMonitoringCycle}
          onUpdateConfig={handleUpdateConfig}
          onClearRegistry={handleClearRegistry}
          onOpenArticleReader={handleOpenArticle}
          onSwitchToPortal={handleGoToPortal}
          onLogout={handleLogout}
        />
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
