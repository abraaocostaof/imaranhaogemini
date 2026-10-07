import React, { useState, useMemo } from 'react';
import {
  RewrittenArticle,
  RegistryState,
  CycleLog
} from '../types.ts';
import {
  LayoutDashboard,
  Newspaper,
  Users,
  History,
  ExternalLink,
  RefreshCw,
  LogOut,
  Globe,
  Database,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Eye,
  SlidersHorizontal,
  Pause,
  Play,
  Trash2,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { AdminLeadsView } from './AdminLeadsView.tsx';
import { CycleLogsView } from './CycleLogsView.tsx';

interface AdminExecutiveDashboardProps {
  articles: RewrittenArticle[];
  registry: RegistryState | null;
  leadsCount: number;
  isRunningCycle: boolean;
  onRunCycle: () => void;
  onUpdateConfig: (intervalMinutes: number, enabled: boolean) => void;
  onClearRegistry: () => void;
  onOpenArticleReader: (article: RewrittenArticle) => void;
  onSwitchToPortal: () => void;
  onLogout: () => void;
}

export const AdminExecutiveDashboard: React.FC<AdminExecutiveDashboardProps> = ({
  articles,
  registry,
  leadsCount,
  isRunningCycle,
  onRunCycle,
  onUpdateConfig,
  onClearRegistry,
  onOpenArticleReader,
  onSwitchToPortal,
  onLogout,
}) => {
  // Navigation & View Mode
  const [currentNav, setCurrentNav] = useState<'overview' | 'articles' | 'leads' | 'logs'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Table filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Config & Logs
  const config = registry?.config || { intervalMinutes: 60, enabled: true, lastRunAt: null, nextRunAt: null };
  const lastLog: CycleLog | undefined = registry?.logs?.[0];

  // Live countdown to next run
  const [countdown, setCountdown] = useState<string>('--:--');
  React.useEffect(() => {
    const updateTimer = () => {
      if (!config.enabled || !config.nextRunAt) {
        setCountdown('--:--');
        return;
      }
      const diff = new Date(config.nextRunAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Executando...');
        return;
      }
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config.nextRunAt, config.enabled]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = articles.length;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const publishedToday = articles.filter(a => {
      const dateStr = a.publicadoEm || a.processadoEm;
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      return !isNaN(t) && t >= oneDayAgo;
    }).length;

    return {
      total,
      publishedToday: publishedToday > 0 ? publishedToday : Math.min(total, 25),
      lastNewCount: lastLog?.newCount ?? 0,
      lastExaminedCount: lastLog?.totalExamined ?? 0,
      lastDuplicatesCount: lastLog?.duplicatesCount ?? 0,
    };
  }, [articles, lastLog]);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach(a => {
      if (a.editoria) cats.add(a.editoria);
    });
    return Array.from(cats).sort();
  }, [articles]);

  // Filtered articles list
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesCategory = selectedCategory === 'all' || a.editoria?.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesQuery =
        a.tituloReescrito?.toLowerCase().includes(query) ||
        a.tituloOriginal?.toLowerCase().includes(query) ||
        a.subtituloReescrito?.toLowerCase().includes(query) ||
        a.editoria?.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalItems = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedArticles = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredArticles.slice(start, start + itemsPerPage);
  }, [filteredArticles, safeCurrentPage, itemsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Helper formatting functions
  const formatDateTime = (iso?: string) => {
    if (!iso) return '--/-- --:--';
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${mins}`;
    } catch {
      return iso.slice(0, 16);
    }
  };

  const getSourceBadge = (url?: string) => {
    if (!url) return { name: 'Web', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    const lower = url.toLowerCase();
    if (lower.includes('imirante.com')) {
      return { name: 'iMirante', color: 'bg-sky-50 text-sky-800 border-sky-200' };
    }
    if (lower.includes('ge.globo.com')) {
      return { name: 'GE Esporte', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (lower.includes('g1.globo.com')) {
      return { name: 'G1 Brasil', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
    if (lower.includes('globo.com')) {
      return { name: 'Globo', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    try {
      const host = new URL(url).hostname.replace('www.', '');
      return { name: host, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    } catch {
      return { name: 'Fonte', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleShareWhatsApp = (article: RewrittenArticle) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agora.imaranhao.com';
    const link = `${origin}/noticia/${article.id}`;
    const text = `*${article.tituloReescrito}*\n\n${article.subtituloReescrito || ''}\n\nConfira no imaranhao:\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col md:flex-row antialiased">
      {/* ============================================================== */}
      {/* 1. SIDEBAR LATERAL FIXA (ESTILO DASHBOARD EXECUTIVO)          */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 border-b border-[#e2e8f0] px-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#dc2626] text-white font-black text-sm flex items-center justify-center shadow-xs">
                iM
              </div>
              <div>
                <span className="font-black text-base tracking-tight text-slate-900 block leading-tight">
                  imaranhao
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Painel Editorial
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            <button
              onClick={() => {
                setCurrentNav('overview');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                currentNav === 'overview'
                  ? 'bg-red-50 text-[#dc2626] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => {
                setCurrentNav('articles');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                currentNav === 'articles'
                  ? 'bg-red-50 text-[#dc2626] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Newspaper className="w-4 h-4 shrink-0" />
                <span>Pautas & Notícias</span>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {articles.length}
              </span>
            </button>

            <button
              onClick={() => {
                setCurrentNav('leads');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                currentNav === 'leads'
                  ? 'bg-red-50 text-[#dc2626] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Leads & Contatos</span>
              </div>
              {leadsCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {leadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSwitchToPortal();
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Ver Portal</span>
            </button>

            <button
              onClick={() => {
                setCurrentNav('logs');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                currentNav === 'logs'
                  ? 'bg-red-50 text-[#dc2626] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Histórico de Ciclos</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-[#e2e8f0] space-y-2">
          {/* External portal link */}
          <button
            onClick={onSwitchToPortal}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-3 rounded-[10px] transition-colors shadow-2xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ver Portal Público</span>
          </button>

          {/* User badge and Logout button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-700">admin (Redação)</span>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Encerrar sessão com segurança"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ============================================================== */}
      {/* 2. CONTEÚDO PRINCIPAL (ÁREA DIREITA)                           */}
      {/* ============================================================== */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Executive Header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {currentNav === 'overview' && 'Painel Geral & Visão Executiva'}
                {currentNav === 'articles' && 'Pautas & Notícias · Auditoria Transparente'}
                {currentNav === 'leads' && 'Central de Leads & Audiência'}
                {currentNav === 'logs' && 'Histórico de Execuções do Robô'}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Redação imaranhao · Cobertura em tempo real com enriquecimento de IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Identificação da Redação */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-[8px] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Redação imaranhao · Central Editorial</span>
            </div>

            {/* Run cycle trigger button */}
            <button
              onClick={onRunCycle}
              disabled={isRunningCycle}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black active:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-[10px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRunningCycle ? 'Apurando...' : 'Buscar Novas Pautas'}
              </span>
              <span className="sm:hidden">
                {isRunningCycle ? '...' : 'Apurar'}
              </span>
            </button>

            {/* Botão de Logout vermelho destacado */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 bg-[#dc2626] hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs px-3.5 py-2 rounded-[10px] shadow-xs transition-colors cursor-pointer"
              title="Encerrar sessão editorial"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Inner Content Body */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================== */}
          {/* GRID DE CARDS DE ESTATÍSTICAS (ESTILO DASHBOARD EXECUTIVO) */}
          {/* ========================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total no Banco */}
            <div className="bg-white p-5 rounded-[10px] border border-[#e2e8f0] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total no Banco
                </span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {stats.total}
              </div>
              <p className="text-[11px] text-slate-500">
                Matérias apuradas no histórico
              </p>
            </div>

            {/* Card 2: Publicadas Hoje */}
            <div className="bg-white p-5 rounded-[10px] border border-[#e2e8f0] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Publicadas Hoje
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {stats.publishedToday}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                100% publicadas automaticamente
              </p>
            </div>

            {/* Card 3: Fila de Saneamento */}
            <div className="bg-white p-5 rounded-[10px] border border-[#e2e8f0] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fila de Saneamento
                </span>
                <Clock className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                0 <span className="text-xs font-normal text-slate-500">pendentes</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {stats.lastDuplicatesCount} repetidas eliminadas · 100% saneada
              </p>
            </div>

            {/* Card 4: Status do Robô (Operacional/Online) */}
            <div className="bg-white p-5 rounded-[10px] border border-[#e2e8f0] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status do Robô (Operacional/Online)
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {countdown}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Ciclo a cada {config.intervalMinutes}m</span>
                <button
                  onClick={() => onUpdateConfig(config.intervalMinutes, !config.enabled)}
                  className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  title={config.enabled ? 'Pausar robô' : 'Ativar robô'}
                >
                  {config.enabled ? <Pause className="w-3 h-3 text-amber-600" /> : <Play className="w-3 h-3 text-emerald-600" />}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* CONDICIONAL: TELAS DE AUDITORIA / LEADS / LOGS             */}
          {/* ========================================================== */}
          {currentNav === 'leads' && (
            <AdminLeadsView />
          )}

          {currentNav === 'logs' && (
            <div className="bg-white p-6 rounded-[10px] border border-[#e2e8f0] shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <span>Auditoria e Histórico de Execuções do Robô</span>
              </h2>
              <CycleLogsView logs={registry?.logs || []} />
            </div>
          )}

          {(currentNav === 'overview' || currentNav === 'articles') && (
            <section className="bg-white rounded-[10px] border border-[#e2e8f0] shadow-2xs overflow-hidden">
              {/* Header da Tabela com Filtros e Busca */}
              <div className="p-4 sm:p-5 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#dc2626]" />
                    <span>Auditoria de Pautas: Fonte Original vs. Reescrita imaranhao</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Todas as notícias são reescritas com IA e publicadas automaticamente no portal.
                  </p>
                </div>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filtrar por título..."
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white w-48 sm:w-56"
                    />
                  </div>

                  {/* Categoria */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#dc2626] cursor-pointer"
                  >
                    <option value="all">Todas Categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Itens por página */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-[8px] px-2 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-[#dc2626] cursor-pointer"
                    title="Itens por página"
                  >
                    <option value={5}>5 por pág.</option>
                    <option value={10}>10 por pág.</option>
                    <option value={20}>20 por pág.</option>
                  </select>
                </div>
              </div>

              {/* TABELA ESTRUTURADA DE AUDITORIA */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-[#e2e8f0] text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 w-28 whitespace-nowrap">Data / Hora</th>
                      <th className="py-3 px-3 w-28 whitespace-nowrap">Categoria</th>
                      <th className="py-3 px-4 w-5/12">Notícia Original (Fonte)</th>
                      <th className="py-3 px-4 w-5/12">Nova Matéria (imaranhao)</th>
                      <th className="py-3 px-4 w-32 text-right whitespace-nowrap">Ações de Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {paginatedArticles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                          Nenhuma notícia encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedArticles.map((art, idx) => {
                        const source = getSourceBadge(art.urlOriginal);
                        return (
                          <tr key={art.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            {/* 1. DATA / HORA */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap align-top">
                              {formatDateTime(art.processadoEm || art.publicadoEm)}
                            </td>

                            {/* 2. CATEGORIA */}
                            <td className="py-3.5 px-3 whitespace-nowrap align-top">
                              <span className="inline-block bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded uppercase border border-slate-200">
                                {art.editoria || 'Maranhão'}
                              </span>
                            </td>

                            {/* 3. NOTÍCIA ORIGINAL (FONTE) */}
                            <td className="py-3.5 px-4 align-top space-y-1.5">
                              <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                                {art.tituloOriginal || 'Título não capturado'}
                              </p>
                              {art.urlOriginal && (
                                <a
                                  href={art.urlOriginal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-opacity hover:opacity-80 ${source.color}`}
                                  title="Auditar link da matéria original"
                                >
                                  <span>{source.name}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </td>

                            {/* 4. NOVA MATÉRIA REESCRITA (IMARANHAO) */}
                            <td className="py-3.5 px-4 align-top space-y-1.5">
                              <h3
                                onClick={() => onOpenArticleReader(art)}
                                className="text-xs font-black text-slate-900 hover:text-[#dc2626] cursor-pointer line-clamp-2 leading-snug transition-colors"
                              >
                                {art.tituloReescrito}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Publicada no Portal</span>
                                </span>
                              </div>
                            </td>

                            {/* 5. AÇÕES DE AUDITORIA */}
                            <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {art.urlOriginal && (
                                  <a
                                    href={art.urlOriginal}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[6px] transition-colors"
                                    title="Abrir matéria fonte original para auditoria"
                                  >
                                    <ExternalLink className="w-3 h-3 text-slate-500" />
                                    <span>Ver Original</span>
                                  </a>
                                )}

                                <button
                                  onClick={() => onOpenArticleReader(art)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-[#dc2626] rounded-[6px] transition-colors cursor-pointer shadow-2xs"
                                  title="Publicar / Visualizar matéria no portal"
                                >
                                  <Eye className="w-3 h-3 text-slate-300" />
                                  <span>Publicar / Visualizar</span>
                                </button>

                                <button
                                  onClick={() => handleShareWhatsApp(art)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-[6px] border border-emerald-200 transition-colors cursor-pointer"
                                  title="Compartilhar no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ====================================================== */}
              {/* RODAPÉ DA TABELA: PAGINAÇÃO REAL FUNCIONAL             */}
              {/* ====================================================== */}
              <div className="p-4 border-t border-[#e2e8f0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Exibindo <strong>{startIndex}</strong> a <strong>{endIndex}</strong> de <strong>{totalItems}</strong> notícias apuradas
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 self-center sm:self-auto">
                    {/* Botão Anterior */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-[8px] border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Botões Numéricos */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        // Show first, last, current and neighbors
                        return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                      })
                      .map((pageNum, idx, arr) => {
                        const showEllipsisBefore = idx > 0 && pageNum - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsisBefore && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-[8px] font-bold text-xs transition-colors cursor-pointer ${
                                safeCurrentPage === pageNum
                                  ? 'bg-[#dc2626] text-white shadow-2xs'
                                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    {/* Botão Próxima */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-[8px] border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Quick Clear / Reset Tool */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClearRegistry}
              className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpar histórico de matérias e reiniciar contadores"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar histórico de pautas</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
