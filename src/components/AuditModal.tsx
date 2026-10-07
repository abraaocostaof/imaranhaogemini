import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  CheckSquare,
  Square,
  FileCode,
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  User,
  Compass,
  Link2,
  Eye,
  ListChecks,
  Maximize2
} from 'lucide-react';
import { ScrapedArticle } from '../types.ts';

interface AuditModalProps {
  article: ScrapedArticle | null;
  articles: ScrapedArticle[];
  onClose: () => void;
  onNavigate: (article: ScrapedArticle) => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({
  article,
  articles,
  onClose,
  onNavigate,
}) => {
  if (!article) return null;

  const currentIndex = articles.findIndex((a) => a.id === article.id || a.urlOriginal === article.urlOriginal);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < articles.length - 1;

  // View Mode: 'editorial' | 'json' | 'markdown'
  const [viewMode, setViewMode] = useState<'editorial' | 'json' | 'markdown'>('editorial');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Right column tab: 'checklist' | 'original-iframe'
  const [rightTab, setRightTab] = useState<'checklist' | 'iframe'>('checklist');

  // Interactive Checklist State per article
  const [checklist, setChecklist] = useState({
    titleMatch: true,
    subtitleValid: true,
    dateRecent: true,
    paragraphsIntact: true,
    noiseSanitized: true,
    imageLoaded: true,
  });

  // Automated sanity checks
  const noiseFoundInBody = article.conteudo.some(
    p => /canal\s+do\s+g1\s+no\s+whatsapp/i.test(p) ||
         /^LEIA\s+TAMB[EÉ]M/i.test(p) ||
         /^VEJA\s+MAIS/i.test(p)
  );

  const hasEmptyParagraphs = article.conteudo.some(p => !p || p.trim().length === 0);

  useEffect(() => {
    // Reset/update checklist state based on article data
    setChecklist({
      titleMatch: Boolean(article.titulo && article.titulo.length > 5),
      subtitleValid: Boolean(article.subtitulo),
      dateRecent: Boolean(article.dataPublicacao),
      paragraphsIntact: article.quantidadeParagrafos > 0 && !hasEmptyParagraphs,
      noiseSanitized: !noiseFoundInBody,
      imageLoaded: Boolean(article.imagem),
    });
  }, [article.id]);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateMarkdown = () => {
    return [
      `# ${article.titulo}`,
      article.subtitulo ? `\n> ${article.subtitulo}\n` : '',
      `**Data de Publicação:** ${article.dataPublicacao}`,
      `**URL Original:** ${article.urlOriginal}`,
      article.imagem ? `\n![${article.titulo}](${article.imagem})\n` : '',
      '---',
      ...article.conteudo.map((p) => (p.startsWith('## ') ? `\n${p}\n` : `\n${p}`))
    ].join('\n');
  };

  const totalChecks = Object.keys(checklist).length;
  const passedChecks = Object.values(checklist).filter(Boolean).length;
  const auditScore = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              Auditoria G1
            </span>
            <span className="text-slate-300 text-xs hidden sm:inline">
              Matéria {currentIndex >= 0 ? currentIndex + 1 : 1} de {articles.length}
            </span>
            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
            <p className="text-xs text-slate-300 truncate max-w-md hidden md:block">
              {article.titulo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next navigation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => hasPrev && onNavigate(articles[currentIndex - 1])}
                disabled={!hasPrev}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Matéria anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => hasNext && onNavigate(articles[currentIndex + 1])}
                disabled={!hasNext}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Próxima matéria"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar comparador (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-Header Toolbar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* View mode toggle for left side */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('editorial')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'editorial' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Texto Limpo ({article.quantidadeParagrafos} p)</span>
            </button>

            <button
              onClick={() => setViewMode('json')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'json' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON Estruturado</span>
            </button>

            <button
              onClick={() => setViewMode('markdown')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'markdown' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          {/* Quick Copy actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(article, null, 2), 'json')}
              className="inline-flex items-center gap-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'json' ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={() => copyToClipboard(generateMarkdown(), 'md')}
              className="inline-flex items-center gap-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'md' ? 'Copiado!' : 'Copiar Markdown'}</span>
            </button>

            <a
              href={article.urlOriginal}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>Abrir no G1</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Main Split Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden min-h-0">
          {/* LADO ESQUERDO: Dados Capturados */}
          <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="bg-slate-50/80 px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="font-semibold text-slate-800 uppercase tracking-wide">
                Lado Esquerdo: Dados Extraídos (Limpos)
              </span>
              <span className="text-slate-500">
                {article.palavrasTotais?.toLocaleString('pt-BR')} palavras · {article.tempoLeituraMinutos} min de leitura
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {viewMode === 'editorial' && (
                <>
                  {/* Article Metadata Header */}
                  <div className="border-b border-slate-100 pb-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="text-red-700 font-bold uppercase">{article.editoria || 'G1'}</span>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Pub: {new Date(article.dataPublicacao).toLocaleString('pt-BR')}
                      </span>
                      {article.dataModificacao !== article.dataPublicacao && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">
                            Mod: {new Date(article.dataModificacao).toLocaleString('pt-BR')}
                          </span>
                        </>
                      )}
                      {article.autor && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {article.autor}
                          </span>
                        </>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                      {article.titulo}
                    </h1>

                    {article.subtitulo && (
                      <h2 className="text-sm sm:text-base font-normal text-slate-600 leading-relaxed italic border-l-2 border-red-500 pl-3">
                        {article.subtitulo}
                      </h2>
                    )}
                  </div>

                  {/* Featured Image */}
                  {article.imagem && (
                    <figure className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={article.imagem}
                        alt={article.titulo}
                        className="w-full max-h-80 object-cover"
                      />
                      <figcaption className="p-2 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span>Imagem de destaque capturada via og:image</span>
                        <a
                          href={article.imagem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          Ver original <ExternalLink className="w-3 h-3" />
                        </a>
                      </figcaption>
                    </figure>
                  )}

                  {/* Article Clean Body */}
                  <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed space-y-3.5 font-serif">
                    {article.conteudo.length === 0 ? (
                      <p className="text-slate-400 italic">Nenhum parágrafo extraído.</p>
                    ) : (
                      article.conteudo.map((paragrafo, idx) => {
                        if (paragrafo.startsWith('## ')) {
                          return (
                            <h3
                              key={idx}
                              className="text-base font-bold font-sans text-slate-900 pt-3 pb-1 border-b border-slate-100"
                            >
                              {paragrafo.replace('## ', '')}
                            </h3>
                          );
                        }
                        return (
                          <p key={idx} className="leading-relaxed">
                            {paragrafo}
                          </p>
                        );
                      })
                    )}
                  </div>

                  {/* Canonical URL and Footer info */}
                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono truncate">{article.urlCanonica || article.urlOriginal}</span>
                    </div>
                    <div>
                      ID Único: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{article.id}</code>
                    </div>
                  </div>
                </>
              )}

              {viewMode === 'json' && (
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-[70vh]">
                    {JSON.stringify(article, null, 2)}
                  </pre>
                </div>
              )}

              {viewMode === 'markdown' && (
                <div className="relative">
                  <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[70vh]">
                    {generateMarkdown()}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* LADO DIREITO: Fonte Original & Validação de Auditoria */}
          <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
            {/* Right Column Header Tabs */}
            <div className="bg-slate-100/80 px-5 py-2 border-b border-slate-200/80 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRightTab('checklist')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    rightTab === 'checklist' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5 text-red-600" />
                  <span>Checklist de Auditoria</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                    {passedChecks}/{totalChecks}
                  </span>
                </button>

                <button
                  onClick={() => setRightTab('iframe')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    rightTab === 'iframe' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Visualizador Web (G1)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Índice de Qualidade:</span>
                <span className={`font-bold font-mono text-xs ${
                  auditScore === 100 ? 'text-emerald-700' : auditScore >= 70 ? 'text-blue-700' : 'text-amber-700'
                }`}>
                  {auditScore}%
                </span>
              </div>
            </div>

            {/* Right Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {rightTab === 'checklist' && (
                <div className="space-y-6">
                  {/* Score & Automated Status Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Status de Integridade da Extração
                        </h4>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        auditScore === 100
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {auditScore === 100 ? 'Auditado & Conforme' : 'Conferência Parcial'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Parágrafos</span>
                        <span className="text-base font-bold text-slate-900">{article.quantidadeParagrafos}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Palavras</span>
                        <span className="text-base font-bold text-slate-900">{article.palavrasTotais || 0}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Leitura Est.</span>
                        <span className="text-base font-bold text-slate-900">{article.tempoLeituraMinutos || 1}m</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ruído Detectado</span>
                        <span className={`text-base font-bold ${noiseFoundInBody ? 'text-red-600' : 'text-emerald-600'}`}>
                          {noiseFoundInBody ? 'Sim' : 'Zero'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist visual de auditoria (PRD Section 6) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-red-600" />
                        Checklist Visual de Auditoria
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Clique para alterar o status da conferência
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Check 1 */}
                      <div
                        onClick={() => toggleCheck('titleMatch')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.titleMatch ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Título corresponde exatamente ao original?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Extraído do seletor <code>h1.content-head__title</code> ou <code>itemprop="headline"</code>.
                          </p>
                        </div>
                      </div>

                      {/* Check 2 */}
                      <div
                        onClick={() => toggleCheck('subtitleValid')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.subtitleValid ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Linha-fina (subtítulo) capturada sem ruídos?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Extraído de <code>h2.content-head__subtitle</code> sem cortes abruptos.
                          </p>
                        </div>
                      </div>

                      {/* Check 3 */}
                      <div
                        onClick={() => toggleCheck('dateRecent')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.dateRecent ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Data de publicação reflete a matéria mais recente do feed?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Data ISO válida: <code>{article.dataPublicacao}</code>
                          </p>
                        </div>
                      </div>

                      {/* Check 4 */}
                      <div
                        onClick={() => toggleCheck('paragraphsIntact')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.paragraphsIntact ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            A matéria contém todos os parágrafos sem quebras indevidas?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            Total de {article.quantidadeParagrafos} parágrafos capturados em sequência lógica.
                          </p>
                        </div>
                      </div>

                      {/* Check 5 */}
                      <div
                        onClick={() => toggleCheck('noiseSanitized')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.noiseSanitized ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Ruídos, anúncios e links de canais (WhatsApp) filtrados com sucesso?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {noiseFoundInBody ? (
                              <span className="text-amber-700 font-medium">Atenção: padrões de ruído podem estar presentes.</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Verificado: nenhum ruído residual detectado nos parágrafos.</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Check 6 */}
                      <div
                        onClick={() => toggleCheck('imageLoaded')}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        {checklist.imageLoaded ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            Imagem de destaque carregada com sucesso?
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {article.imagem ? 'URL de alta resolução presente' : 'Sem imagem associada nesta matéria'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Original Source Reference Card */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                        Conferência com Fonte Primária
                      </span>
                      <a
                        href={article.urlOriginal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium hover:underline"
                      >
                        Abrir no navegador <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Recomenda-se abrir a página oficial do G1 em uma nova aba para validar a integridade de matérias que possuam infográficos dinâmicos ou transmissões ao vivo.
                    </p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-xs">{article.urlOriginal}</span>
                      <a
                        href={article.urlOriginal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Ir para o G1</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {rightTab === 'iframe' && (
                <div className="h-full flex flex-col space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center justify-between">
                    <div>
                      <strong>Nota de Compatibilidade:</strong> Portais de notícias (Globo/G1) frequentemente bloqueiam exibição em iframes via cabeçalho <code>X-Frame-Options: SAMEORIGIN</code>.
                    </div>
                    <a
                      href={article.urlOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 shrink-0 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium inline-flex items-center gap-1"
                    >
                      <span>Abrir Aba</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden relative min-h-[480px]">
                    <iframe
                      src={article.urlOriginal}
                      title="G1 Original View"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin allow-scripts allow-popups"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
