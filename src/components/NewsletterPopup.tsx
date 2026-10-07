import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, Phone, User, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface NewsletterPopupProps {
  onLeadCaptured?: () => void;
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({ onLeadCaptured }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Show popup shortly after visitor enters
    const hasSeenThisSession = sessionStorage.getItem('imaranhao_popup_dismissed');
    if (!hasSeenThisSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('imaranhao_popup_dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone }),
      });

      if (res.ok) {
        setSubmitted(true);
        sessionStorage.setItem('imaranhao_popup_dismissed', 'true');
        if (onLeadCaptured) onLeadCaptured();
        setTimeout(() => {
          setIsOpen(false);
        }, 1800);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-[#b91c1c] via-[#c4170c] to-amber-600 text-white p-6 pb-7 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-black text-lg tracking-tight text-white font-sans lowercase">
              <span className="text-amber-300 font-extrabold">i</span>maranhao
            </span>
            <span className="text-xs bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full">
              Boletim Gratuito
            </span>
          </div>

          <div className="flex items-start gap-3 mt-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Bell className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                Notícias em Primeira Mão
              </h3>
              <p className="text-xs text-red-100 mt-1 leading-snug">
                Receba as apurações mais importantes do Maranhão e do Brasil diretamente no seu celular ou e-mail.
              </p>
            </div>
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-6 pt-5">
          {submitted ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Cadastro Realizado com Sucesso!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Você receberá nossas principais apurações e alertas urgentes. Obrigado por acompanhar o <strong>imaranhao</strong>!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Preencha como preferir: <strong>nenhum campo é obrigatório</strong>.</span>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Nome <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como você prefere ser chamado?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b91c1c] transition-all"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b91c1c] transition-all"
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp / Telefone <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(98) 99999-9999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b91c1c] transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Salvando...' : 'Quero me Manter Informado'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-slate-400 hover:text-slate-600 font-semibold text-xs py-1 transition-colors cursor-pointer text-center"
                >
                  Agora não, continuar lendo notícias
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Privacidade 100% protegida. Zero spam.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
