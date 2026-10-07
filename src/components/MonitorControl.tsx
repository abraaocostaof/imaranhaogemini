import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { RegistryState, CycleLog } from '../types.ts';

interface MonitorControlProps {
  registry: RegistryState | null;
  onRunCycle: () => void;
  isRunningCycle: boolean;
  onUpdateConfig: (intervalMinutes: number, enabled: boolean) => void;
  onClearRegistry: () => void;
}

export const MonitorControl: React.FC<MonitorControlProps> = ({
  registry,
  onRunCycle,
  isRunningCycle,
  onUpdateConfig,
  onClearRegistry,
}) => {
  const [countdown, setCountdown] = useState<string>('--:--');
  const config = registry?.config || { intervalMinutes: 60, enabled: true, lastRunAt: null, nextRunAt: null };
  const lastLog: CycleLog | undefined = registry?.logs?.[0];

  // Live countdown timer to next scheduled run
  useEffect(() => {
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

  const formatLastRun = (isoStr: string | null) => {
    if (!isoStr) return 'Nenhum ciclo executado ainda';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-slate-100">
        {/* Title and Purpose */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 -ml-4.5"></span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Monitor Contínuo de Pautas Factuais (Regional & Nacional)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Monitora coberturas em tempo real, descarta matérias já publicadas anteriormente com filtro anti-duplicação, sintetiza os fatos e redige novas reportagens autorais para o <strong>imaranhao</strong>.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRunCycle}
            disabled={isRunningCycle}
            className="inline-flex items-center gap-2 bg-[#b91c1c] hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningCycle ? 'animate-spin' : ''}`} />
            <span>{isRunningCycle ? 'Apurando Novas Matérias...' : 'Buscar Novas Pautas Agora'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Telemetry and Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
        {/* Card 1: Interval and Toggle */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Intervalo de Checagem
            </span>
            <button
              onClick={() => onUpdateConfig(config.intervalMinutes, !config.enabled)}
              className={`p-1 rounded cursor-pointer ${
                config.enabled ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'
              }`}
              title={config.enabled ? 'Pausar monitoramento automático' : 'Ativar monitoramento automático'}
            >
              {config.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <select
              value={config.intervalMinutes}
              onChange={(e) => onUpdateConfig(parseInt(e.target.value, 10), config.enabled)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 cursor-pointer text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value={60}>A cada 1 hora (Padrão)</option>
              <option value={30}>A cada 30 minutos</option>
              <option value={15}>A cada 15 minutos</option>
              <option value={5}>A cada 5 minutos (Teste)</option>
              <option value={1}>A cada 1 minuto (Demonstração)</option>
            </select>

            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {config.enabled ? 'Ativo' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Card 2: Countdown Timer */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Próximo Ciclo Automático
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-mono font-bold text-slate-900 tracking-tight">
              {config.enabled ? countdown : 'Pausado'}
            </span>
            <span className="text-[11px] text-slate-400">
              Último: {formatLastRun(config.lastRunAt)}
            </span>
          </div>
        </div>

        {/* Card 3: Anti-duplication Telemetry */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Filtro Anti-Duplicação
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-lg font-bold text-slate-900">
                {registry?.articles?.length || 0}
              </span>
              <span className="text-slate-500 ml-1 text-[11px]">matérias no banco</span>
            </div>
            {registry && registry.articles.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Deseja realmente limpar o histórico de matérias gravadas para recomeçar os testes?')) {
                    onClearRegistry();
                  }
                }}
                className="text-[11px] text-red-600 hover:text-red-800 underline cursor-pointer"
              >
                Limpar banco
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Last Cycle Result */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Resultado do Último Ciclo
          </span>
          <div className="mt-1">
            {lastLog ? (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">
                  <strong className="text-slate-900">{lastLog.totalExamined}</strong> avaliadas
                </span>
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-semibold">
                  {lastLog.duplicatesCount} já publicadas
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                  +{lastLog.newCount} novas
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Nenhum ciclo registrado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
