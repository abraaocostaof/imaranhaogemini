import React, { useState } from 'react';
import { RewrittenArticle } from '../types.ts';
import {
  X,
  ArrowLeft,
  Copy,
  Check,
  Cpu,
  HelpCircle,
  Code2,
  ExternalLink,
  Camera,
  Calendar,
  Share2,
  Bookmark,
  MessageCircle,
  Link2,
  Sparkles
} from 'lucide-react';

interface G1ArticleReaderModalProps {
  article: RewrittenArticle;
  onClose: () => void;
}

export const G1ArticleReaderModal: React.FC<G1ArticleReaderModalProps> = ({
  article,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [showJsonLd, setShowJsonLd] = useState(false);

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
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const copyText = () => {
    const text = [
      article.tituloReescrito,
      '',
      article.subtituloReescrito,
      '',
      '--- GEO / SÍNTESE FACTUAL ---',
      article.geo?.respostaDireta || '',
      '',
      '--- TEXTO DA REPORTAGEM ---',
      ...article.corpoReescrito,
      '',
      article.creditoImagem ? `Créditos da imagem: ${article.creditoImagem}` : '',
      'Publicado por: imaranhao (https://imaranhao.com)'
    ].join('\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySchema = () => {
    if (article.geo?.schemaJsonLd) {
      navigator.clipboard.writeText(article.geo.schemaJsonLd);
      setCopiedJsonLd(true);
      setTimeout(() => setCopiedJsonLd(false), 2000);
    }
  };

  const cleanEditoria = article.editoria && article.editoria.toUpperCase() !== 'G1'
    ? article.editoria
    : 'Brasil';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs overflow-y-auto flex justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl min-h-screen sm:min-h-0 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* TOP READER BAR */}
        <div className="bg-[#b91c1c] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-white/95 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para imaranhao</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="bg-red-950/60 text-white text-[11px] font-bold px-2.5 py-1 rounded border border-red-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Reportagem Exclusiva
            </span>

            <button
              onClick={copyText}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* ARTICLE BODY */}
        <div className="p-5 sm:p-8 md:p-10 space-y-6 max-w-3xl mx-auto w-full">
          {/* Header Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[#b91c1c] font-black text-xs tracking-wider uppercase">
                {cleanEditoria}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                imaranhao Notícias
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight font-sans">
              {article.tituloReescrito}
            </h1>

            {/* Subtitle */}
            {article.subtituloReescrito && (
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-serif">
                {article.subtituloReescrito}
              </p>
            )}

            {/* Byline and dates */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Por <strong>Redação imaranhao</strong></span>
                <span>·</span>
                <span>{formatDate(article.processadoEm)}</span>
              </div>

              <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium">
                Apuração Própria
              </span>
            </div>

            {/* Social Share Toolbar (WhatsApp & Link) */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={shareOnWhatsApp}
                className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Compartilhar no WhatsApp com foto e título"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Compartilhar no WhatsApp</span>
              </button>

              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                title="Copiar link direto para envio"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da Notícia'}</span>
              </button>
            </div>
          </div>

          {/* Featured Image with Credit */}
          {article.imagem && (
            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs space-y-0">
              <img
                src={article.imagem}
                alt={article.tituloReescrito}
                className="w-full aspect-video object-cover"
              />
              <div className="p-3 bg-slate-50 text-xs text-slate-600 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <strong>Crédito da Imagem:</strong> {article.creditoImagem || 'Foto: Reprodução / Divulgação'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Direitos reservados ao autor / agência
                </span>
              </div>
            </div>
          )}

          {/* SÍNTESE FACTUAL DA NOTÍCIA */}
          {article.geo?.respostaDireta && (
            <div className="bg-slate-50 border-l-4 border-[#b91c1c] p-4 sm:p-5 rounded-r-2xl space-y-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Síntese dos Fatos:
              </span>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                {article.geo.respostaDireta}
              </p>
            </div>
          )}

          {/* Reportagem Completa */}
          <div className="space-y-5 text-base sm:text-lg text-slate-800 leading-relaxed font-serif pt-2">
            {article.corpoReescrito.map((paragrafo, pIdx) => (
              <p key={pIdx} className="leading-[1.85]">
                {paragrafo}
              </p>
            ))}
          </div>

          {/* JORNALISMO EXPLICATIVO / PERGUNTAS FREQUENTES */}
          {article.geo?.faq && article.geo.faq.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#b91c1c]" />
                Entenda o Caso · Principais Pontos:
              </h4>
              <div className="space-y-2.5">
                {article.geo.faq.map((item, fIdx) => (
                  <div key={fIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1">
                    <p className="font-bold text-slate-900">{item.pergunta}</p>
                    <p className="text-slate-600 leading-relaxed">{item.resposta}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Tags da Matéria:</span>
              {article.tags.map((t, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Editorial Copyright Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Redação imaranhao:</span>
            <p>
              Reportagem exclusiva apurada e publicada pelo portal <strong>imaranhao</strong>. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
