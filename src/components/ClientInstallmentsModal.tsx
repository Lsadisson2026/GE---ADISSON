import React, { useEffect, useState } from 'react';
import { Client } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomSheet } from './BottomSheet';
import { supabase } from '../supabaseClient';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface Installment {
  number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: string;
}

interface ClientInstallmentsModalProps {
  client: Client;
  onClose: () => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    PAID:    { label: 'Pago',      cls: 'bg-fin-emerald/10 text-fin-emerald border-fin-emerald/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    LATE:    { label: 'Atrasado',  cls: 'bg-fin-rose/10 text-fin-rose border-fin-rose/20',         icon: <AlertCircle  className="w-3 h-3" /> },
    PARTIAL: { label: 'Parcial',   cls: 'bg-fin-amber/10 text-fin-amber border-fin-amber/20',      icon: <Clock        className="w-3 h-3" /> },
  };
  const { label, cls, icon } = map[status] ?? { label: 'Pendente', cls: 'bg-white/5 text-slate-400 border-white/10', icon: <Clock className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
      {icon}{label}
    </span>
  );
};

export const ClientInstallmentsModal: React.FC<ClientInstallmentsModalProps> = ({ client, onClose }) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('installments')
          .select('number, due_date, amount, paid_amount, status, loans!inner(client_id)')
          .eq('loans.client_id', client.id)
          .neq('status', 'PAID')
          .order('due_date', { ascending: true });
        if (error) throw error;
        setInstallments(data as Installment[]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [client.id]);

  const totalPending = installments.reduce((s, i) => s + (i.amount - i.paid_amount), 0);
  const lateCount    = installments.filter(i => i.status === 'LATE').length;

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Parcelas Pendentes"
      subtitle={client.name}
      maxWidth="sm:max-w-2xl"
    >
      {/* Resumo rápido */}
      {!loading && installments.length > 0 && (
        <div className="flex items-center gap-5 pb-4 mb-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Pendente</p>
            <p className="text-base font-black text-fin-rose font-mono">{formatCurrency(totalPending)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Parcelas</p>
            <p className="text-base font-black text-white">{installments.length}</p>
          </div>
          {lateCount > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Atrasadas</p>
              <p className="text-base font-black text-fin-rose">{lateCount}</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-fin-blue/30 border-t-fin-blue rounded-full animate-spin" />
          Carregando...
        </div>
      ) : installments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
          <CheckCircle2 className="w-8 h-8 text-fin-emerald/40" />
          <p className="text-sm">Nenhuma parcela pendente.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['#', 'Vencimento', 'Valor', 'Saldo', 'Status'].map((h, i) => (
                    <th key={i} className="pb-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {installments.map((inst, i) => (
                  <tr key={i} className={cn('transition-colors', inst.status === 'LATE' && 'bg-fin-rose/[0.02]')}>
                    <td className="py-3 pr-4 font-mono text-sm font-bold text-white">#{inst.number}</td>
                    <td className="py-3 pr-4 text-xs text-slate-400">{formatDate(inst.due_date)}</td>
                    <td className="py-3 pr-4 text-xs font-mono text-slate-500">{formatCurrency(inst.amount)}</td>
                    <td className="py-3 pr-4">
                      <p className={cn('text-sm font-mono font-bold', inst.status === 'LATE' ? 'text-fin-rose' : 'text-white')}>
                        {formatCurrency(inst.amount - inst.paid_amount)}
                      </p>
                      {inst.paid_amount > 0 && (
                        <p className="text-[10px] text-fin-emerald/60 mt-0.5">Pago: {formatCurrency(inst.paid_amount)}</p>
                      )}
                    </td>
                    <td className="py-3"><StatusBadge status={inst.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {installments.map((inst, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]',
                inst.status === 'LATE' ? 'bg-fin-rose/[0.03]' : 'bg-white/[0.02]'
              )}>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-black text-slate-400 flex-shrink-0">
                  {inst.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    <span className="text-xs text-slate-400">{formatDate(inst.due_date)}</span>
                  </div>
                  {inst.paid_amount > 0 && (
                    <p className="text-[10px] text-fin-emerald/60 mt-0.5">Pago: {formatCurrency(inst.paid_amount)}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-sm font-mono font-bold', inst.status === 'LATE' ? 'text-fin-rose' : 'text-white')}>
                    {formatCurrency(inst.amount - inst.paid_amount)}
                  </p>
                  <div className="mt-1"><StatusBadge status={inst.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  );
};