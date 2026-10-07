import React, { useState } from 'react';
import { Lock, User, KeyRound, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, informe o usuário e a senha.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Acesso negado. Credenciais inválidas.');
      }

      // Store auth session
      localStorage.setItem('imaranhao_auth_token', data.token);
      localStorage.setItem('imaranhao_auth_user', data.user);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao tentar autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-[#b91c1c] text-white p-6 sm:p-7 text-center relative">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
            imaranhao
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Painel de Inteligência Editorial & Monitoramento
          </p>
          <div className="inline-flex items-center gap-1.5 bg-black/20 text-white/90 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-3">
            <ShieldCheck className="w-3 h-3 text-emerald-300" />
            <span>Acesso Restrito à Redação</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#b91c1c] hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Portal</span>
            </button>

            <span className="text-[11px] text-slate-400">
              imaranhao © 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
