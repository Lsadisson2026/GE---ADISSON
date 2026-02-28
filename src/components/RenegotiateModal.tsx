import React, { useState } from 'react';
import { PaymentType } from '../types';
import { formatCurrency } from '../utils';
import { Percent, ChevronDown } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { supabase } from '../supabaseClient';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const field = `w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none
  focus:border-fin-blue/50 focus:bg-white/[0.06] text-white text-sm font-medium
  transition-all duration-200`;

interface RenegotiateModalProps {
  client: { id: number; name: string };
  pendingLoans: { id: number; capital: number; pending: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const RenegotiateModal: React.FC<RenegotiateModalProps> = ({
  client, pendingLoans, onClose, onSuccess
}) => {
  const [selectedLoans, setSelectedLoans] = useState<number[]>(pendingLoans.map(l => l.id));
  const [form, setForm] = useState({
    interest_rate: '10',
    payment_type: PaymentType.DAILY,
    installments_count: '24',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const totalPending  = pendingLoans.filter(l => selectedLoans.includes(l.id)).reduce((s, l) => s + l.pending, 0);
  const rate          = parseFloat(form.interest_rate) || 0;
  const count         = parseInt(form.installments_count) || 1;
  const totalInterest = totalPending * (rate / 100);
  const totalAmount   = totalPending + totalInterest;
  const installmentValue = totalAmount / count;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoans.length) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc('renegotiate_loan', {
        p_client_id:          client.id,
        p_total_renegotiated: totalPending,
        p_interest_rate:      rate,
        p_payment_type:       form.payment_type,
        p_installments_count: count,
        p_start_date:         form.start_date,
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: number) =>
    setSelectedLoans(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Renegociar Dívida"
      subtitle={client.name}
      maxWidth="sm:max-w-2xl"
      footer={
        <button
          type="submit"
          form="renegotiate-form"
          disabled={!selectedLoans.length || loading}
          className="w-full py-3 rounded-xl bg-fin-blue text-white text-sm font-bold
            shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-fin-blue/90
            disabled:opacity-40 disabled:grayscale transition-all active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processando...
            </span>
          ) : 'Confirmar e Gerar Novo Contrato'}
        </button>
      }
    >
      {/* Resumo inline — compacto no topo */}
      <div className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-5">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Novo capital</p>
          <p className="text-sm font-black text-white font-mono">{formatCurrency(totalPending)}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Juros ({rate}%)</p>
          <p className="text-sm font-black text-fin-blue font-mono">+{formatCurrency(totalInterest)}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Nova parcela</p>
          <p className="text-sm font-black text-fin-emerald font-mono">{formatCurrency(installmentValue)}</p>
        </div>
      </div>

      <form id="renegotiate-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Grid de campos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Taxa (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="number" step="0.01"
                value={form.interest_rate}
                onChange={(e) => setForm(p => ({ ...p, interest_rate: e.target.value }))}
                className={`${field} pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Parcelas</label>
            <input type="number"
              value={form.installments_count}
              onChange={(e) => setForm(p => ({ ...p, installments_count: e.target.value }))}
              className={field} />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Frequência</label>
            <div className="relative">
              <select value={form.payment_type}
                onChange={(e) => setForm(p => ({ ...p, payment_type: e.target.value as PaymentType }))}
                className={`${field} pr-8 appearance-none`}>
                <option value={PaymentType.DAILY}   className="bg-[#111113]">Diário</option>
                <option value={PaymentType.WEEKLY}  className="bg-[#111113]">Semanal</option>
                <option value={PaymentType.MONTHLY} className="bg-[#111113]">Mensal</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">1º Vencimento</label>
            <input type="date"
              value={form.start_date}
              onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
              className={field}
              style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Contratos */}
        <div>
          <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Contratos Incluídos</label>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {pendingLoans.map(loan => (
              <label key={loan.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                  selectedLoans.includes(loan.id)
                    ? 'bg-fin-blue/8 border-fin-blue/25'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                )}>
                <div className="flex items-center gap-2.5">
                  <input type="checkbox"
                    checked={selectedLoans.includes(loan.id)}
                    onChange={() => toggle(loan.id)}
                    className="w-4 h-4 accent-red-500 rounded" />
                  <div>
                    <p className="text-xs font-bold text-white">Empréstimo #{loan.id}</p>
                    <p className="text-[10px] text-slate-500">Saldo devedor</p>
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-fin-rose">{formatCurrency(loan.pending)}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </BottomSheet>
  );
};