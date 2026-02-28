import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '../utils';
import { AlertCircle, Phone, MessageCircle, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

import { RenegotiateModal } from './RenegotiateModal';

interface LatePayment {
  clientId: number;
  clientName: string;
  clientPhone: string;
  totalPending: number;
  oldestDueDate: string;
  lastPaymentDate: string | null;
}

export const LatePayments: React.FC = () => {
  const [latePayments, setLatePayments] = useState<LatePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number>(0);
  const [renegotiateClient, setRenegotiateClient] = useState<any>(null);

  const fetchLate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('late_payments_summary')
        .select('*');

      if (error) throw error;

      setLatePayments(data as LatePayment[]);
    } catch (err) {
      console.error('Error fetching late payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenegotiateClick = async (lp: LatePayment) => {
    try {
      // Fetch real loans with pending/late installments for this client
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          id,
          capital,
          installments (
            amount,
            paid_amount,
            status,
            due_date
          )
        `)
        .eq('client_id', lp.clientId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      // Calculate pending amount for each loan (sum of all unpaid installments)
      const pendingLoans = loans.map((loan: any) => {
        const pendingAmount = loan.installments
            .filter((i: any) => i.status !== 'PAID')
            .reduce((sum: number, i: any) => sum + (i.amount - i.paid_amount), 0);

        return {
            id: loan.id,
            capital: loan.capital,
            pending: pendingAmount
        };
      }).filter((l: any) => l.pending > 0);

      setRenegotiateClient({
        client: { id: lp.clientId, name: lp.clientName },
        pendingLoans: pendingLoans
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar detalhes do empréstimo.');
    }
  };

  useEffect(() => {
    fetchLate();
  }, []);

  const getDaysLate = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const filteredLate = latePayments.filter(lp => {
    const days = getDaysLate(lp.oldestDueDate);
    if (filter === 3) return days >= 3;
    if (filter === 7) return days >= 7;
    if (filter === 30) return days >= 30;
    return true;
  });

  const sendWhatsApp = (lp: LatePayment) => {
    const days = getDaysLate(lp.oldestDueDate);
    const message = `Olá ${lp.clientName}, notamos que seu pagamento está pendente há ${days} dias. Por favor, entre em contato para regularizar sua situação.`;
    const url = `https://wa.me/${lp.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Carregando inadimplentes...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="section-title">Inadimplentes</h2>
          <p className="text-slate-500 font-medium mt-1">Gestão de risco e recuperação de crédito em atraso.</p>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {[0, 3, 7, 30].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all duration-500 tracking-tight",
                filter === f 
                  ? "bg-fin-blue/20 text-white shadow-glow-blue border border-fin-blue/30" 
                  : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {f === 0 ? 'TODOS' : `+${f} DIAS`}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {filteredLate.length === 0 ? (
          <div className="glass-panel p-20 text-center border-dashed border-white/10">
            <div className="w-20 h-20 bg-fin-emerald/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-fin-emerald/20">
              <CheckCircle2 className="w-10 h-10 text-fin-emerald" />
            </div>
            <h3 className="text-2xl font-bold text-white">Carteira Saudável!</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Não há inadimplentes para o filtro selecionado. Sua gestão de cobrança está excelente.</p>
          </div>
        ) : (
          filteredLate.map((lp, i) => {
            const days = getDaysLate(lp.oldestDueDate);
            const isCritical = days >= 30;
            const isWarning = days >= 7;

            return (
              <motion.div
                key={lp.clientName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.005 }}
                className={cn(
                  "glass-panel p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-white/5",
                  isCritical ? "shadow-glow-rose border-fin-rose/20" : isWarning ? "shadow-glow-amber border-fin-amber/20" : "shadow-glow-blue"
                )}
              >
                <div className="flex items-center gap-8 lg:w-1/4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border transition-all duration-500 shadow-inner",
                    isCritical 
                      ? "bg-fin-rose/20 text-fin-rose border-fin-rose/30" 
                      : isWarning 
                        ? "bg-fin-amber/20 text-fin-amber border-fin-amber/30" 
                        : "bg-white/5 text-slate-300 border-white/10"
                  )}>
                    {lp.clientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold text-white truncate tracking-tight">{lp.clientName}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-2.5 font-semibold mt-1.5">
                      <Phone className="w-4 h-4 text-fin-blue/50" /> {lp.clientPhone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 flex-1 lg:px-12 border-l border-white/5">
                  <div>
                    <p className="metric-title mb-1.5">Dívida Total</p>
                    <p className={cn(
                      "text-2xl font-black tracking-tight",
                      isCritical ? "text-fin-rose" : isWarning ? "text-fin-amber" : "text-white"
                    )}>{formatCurrency(lp.totalPending)}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="metric-title mb-1.5">Tempo de Atraso</p>
                    <div className="flex items-center gap-3">
                      <Clock className={cn("w-5 h-5", isCritical ? "text-fin-rose" : isWarning ? "text-fin-amber" : "text-fin-blue")} />
                      <p className="text-xl font-black text-white tracking-tighter">{days} dias</p>
                    </div>
                  </div>
                  <div>
                    <p className="metric-title mb-1.5">Última Atividade</p>
                    <p className="text-lg font-bold text-slate-400 tracking-tight">{lp.lastPaymentDate ? formatDate(lp.lastPaymentDate) : 'Sem histórico'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRenegotiateClick(lp)}
                    className="px-8 py-4 glow-button text-sm flex-1 lg:flex-none"
                  >
                    <span>Renegociar Dívida</span>
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendWhatsApp(lp)}
                    className="p-4 text-fin-blue bg-fin-blue/10 hover:bg-fin-blue/20 border border-fin-blue/20 rounded-2xl transition-all shadow-glow-blue"
                    title="Cobrar via WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {renegotiateClient && (
          <RenegotiateModal 
            key="renegotiate-modal"
            client={renegotiateClient.client}
            pendingLoans={renegotiateClient.pendingLoans}
            onClose={() => setRenegotiateClient(null)}
            onSuccess={() => {
              setRenegotiateClient(null);
              fetchLate();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
