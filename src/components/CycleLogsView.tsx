import React from 'react';
import { CycleLog } from '../types.ts';
import { History, ShieldCheck, Sparkles, Clock, CheckCircle } from 'lucide-react';

interface CycleLogsViewProps {
  logs: CycleLog[];
}

export const CycleLogsView: React.FC<CycleLogsViewProps> = ({ logs }) => {
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString('pt-BR') + ')';
    } catch {
      return iso;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Nenhum ciclo registrado ainda.</p>
        <p className="mt-1">Clique em "Verificar as 10 Agora" para disparar o primeiro ciclo de checagem na home do G1.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Histórico de Execuções e Auditoria Anti-Duplicação
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Últimos {logs.length} ciclos monitorados
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatTime(log.timestamp)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-mono">
                  {log.totalExamined} avaliadas no G1
                </span>
                <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] px-2 py-0.5 rounded font-medium">
                  {log.duplicatesCount} duplicadas descartadas
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                  log.newCount > 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  +{log.newCount} novas reescritas
                </span>
              </div>
            </div>

            {log.newTitles && log.newTitles.length > 0 ? (
              <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100/60 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Matérias Inéditas Processadas Neste Ciclo:
                </span>
                <ul className="space-y-1">
                  {log.newTitles.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhuma novidade no feed. Todas as 10 notícias já haviam sido processadas em ciclos anteriores. Nenhuma matéria foi duplicada.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
