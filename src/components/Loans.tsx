import React, { useEffect, useState } from 'react';
import { Client, PaymentType, ClientStatus } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { HandCoins, Plus, Calculator, Calendar, Percent, Landmark, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const Loans: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLoan, setNewLoan] = useState({
    client_id: '',
    capital: '',
    interest_rate: '10',
    payment_type: PaymentType.DAILY,
    installments_count: '24',
    start_date: new Date().toISOString().split('T')[0],
    late_fee_enabled: true
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients_summary')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('name');

        if (error) throw error;
        setClients(data as Client[]);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.client_id) {
      alert('Por favor, selecione um cliente.');
      return;
    }
    if (!user?.id) {
      alert('Erro de autenticação: Usuário não identificado.');
      return;
    }

    setCreating(true);
    try {
      const capital = parseFloat(newLoan.capital);
      const rate = parseFloat(newLoan.interest_rate);
      const count = parseInt(newLoan.installments_count);
      const totalInterest = capital * (rate / 100);
      const totalAmount = capital + totalInterest;
      const installmentValue = totalAmount / count;

      // 1. Create the loan
      const { error: loanError } = await supabase
        .from('loans')
        .insert([{
          client_id: newLoan.client_id,
          capital: capital,
          interest_rate: rate,
          payment_type: newLoan.payment_type,
          installments_count: count,
          start_date: newLoan.start_date,
          late_fee_enabled: newLoan.late_fee_enabled,
          status: 'ACTIVE',
          created_by: user.id
        }]);

      if (loanError) throw loanError;

      setNewLoan({
        client_id: '',
        capital: '',
        interest_rate: '10',
        payment_type: PaymentType.DAILY,
        installments_count: '24',
        start_date: new Date().toISOString().split('T')[0],
        late_fee_enabled: true
      });
      alert('Empréstimo criado com sucesso!');
    } catch (err: any) {
      console.error('Error creating loan:', err);
      alert('Erro ao criar empréstimo: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Calculation preview
  const capital = parseFloat(newLoan.capital) || 0;
  const rate = parseFloat(newLoan.interest_rate) || 0;
  const count = parseInt(newLoan.installments_count) || 1;
  const totalInterest = capital * (rate / 100);
  const totalAmount = capital + totalInterest;
  const installmentValue = totalAmount / count;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="section-title">Novo Empréstimo</h2>
          <p className="text-slate-500 font-medium mt-1">Configure as condições e gere as parcelas automaticamente.</p>
        </div>
      </header>

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Carregando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="glass-panel p-10 text-center border-fin-amber/20 bg-fin-amber/5">
          <AlertCircle className="w-12 h-12 text-fin-amber mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum cliente ativo encontrado</h3>
          <p className="text-slate-400">Verifique se há cadastros pendentes de aprovação na tela de Clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-10 shadow-glow-blue border-white/5">
            <form onSubmit={handleCreateLoan} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block metric-title mb-3">Selecionar Cliente Ativo</label>
                  <div className="relative group">
                    <select 
                      required
                      value={newLoan.client_id}
                      onChange={(e) => setNewLoan({...newLoan, client_id: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner appearance-none"
                    >
                      <option value="" className="bg-fin-dark">Selecione um cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-fin-dark">{c.name} (Score: {c.score})</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <Plus className="w-5 h-5 rotate-45" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block metric-title mb-3">Capital Emprestado</label>
                  <div className="relative group">
                    <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-fin-blue transition-colors" />
                    <input 
                      required
                      type="number"
                      value={newLoan.capital}
                      onChange={(e) => setNewLoan({...newLoan, capital: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-bold text-lg placeholder:text-slate-700 transition-all shadow-inner"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block metric-title mb-3">Taxa de Juros Mensal (%)</label>
                  <div className="relative group">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-fin-blue transition-colors" />
                    <input 
                      required
                      type="number"
                      value={newLoan.interest_rate}
                      onChange={(e) => setNewLoan({...newLoan, interest_rate: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-bold text-lg placeholder:text-slate-700 transition-all shadow-inner"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block metric-title mb-3">Frequência de Pagamento</label>
                  <div className="relative group">
                    <select 
                      value={newLoan.payment_type}
                      onChange={(e) => setNewLoan({...newLoan, payment_type: e.target.value as PaymentType})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner appearance-none"
                    >
                      <option value={PaymentType.DAILY} className="bg-fin-dark">Diário (Segunda a Sábado)</option>
                      <option value={PaymentType.WEEKLY} className="bg-fin-dark">Semanal (Toda semana)</option>
                      <option value={PaymentType.MONTHLY} className="bg-fin-dark">Mensal (Todo mês)</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <Plus className="w-5 h-5 rotate-45" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block metric-title mb-3">Número de Parcelas</label>
                  <div className="relative group">
                    <Calculator className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-fin-blue transition-colors" />
                    <input 
                      required
                      type="number"
                      value={newLoan.installments_count}
                      onChange={(e) => setNewLoan({...newLoan, installments_count: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-bold text-lg placeholder:text-slate-700 transition-all shadow-inner"
                      placeholder="24"
                    />
                  </div>
                </div>

                <div>
                  <label className="block metric-title mb-3">Data do Primeiro Vencimento</label>
                  <div className="relative group">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-fin-blue transition-colors" />
                    <input 
                      required
                      type="date"
                      value={newLoan.start_date}
                      onChange={(e) => setNewLoan({...newLoan, start_date: e.target.value})}
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-5 pt-4">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      id="late_fee"
                      checked={newLoan.late_fee_enabled}
                      onChange={(e) => setNewLoan({...newLoan, late_fee_enabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-fin-blue/50 peer-checked:after:bg-white peer-checked:after:border-white shadow-inner"></div>
                  </div>
                  <label htmlFor="late_fee" className="metric-title cursor-pointer select-none">Ativar Multa por Atraso (1% ao dia)</label>
                </div>
              </div>

              <button 
                type="submit"
                disabled={creating}
                className="w-full py-6 glow-button text-xl disabled:opacity-50 disabled:grayscale"
              >
                <HandCoins className="w-6 h-6" />
                <span>{creating ? 'Gerando Contrato...' : 'Gerar Contrato de Empréstimo'}</span>
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-10 shadow-glow-purple relative overflow-hidden border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fin-blue/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-5 mb-10 relative z-10">
                <div className="w-12 h-12 bg-fin-blue/10 rounded-2xl flex items-center justify-center border border-fin-blue/20">
                  <Calculator className="w-6 h-6 text-fin-blue" />
                </div>
                <h3 className="font-black text-2xl text-white tracking-tight">Projeção Financeira</h3>
              </div>
              
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-center py-5 border-b border-white/5">
                  <span className="metric-title">Capital Base</span>
                  <span className="font-black text-xl text-white tracking-tighter">{formatCurrency(capital)}</span>
                </div>
                <div className="flex justify-between items-center py-5 border-b border-white/5">
                  <span className="metric-title">Juros Totais ({rate}%)</span>
                  <span className="font-black text-xl text-fin-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">+{formatCurrency(totalInterest)}</span>
                </div>
                <div className="flex justify-between items-center py-5 border-b border-white/5">
                  <span className="metric-title">Montante Final</span>
                  <span className="font-black text-2xl text-white tracking-tighter">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="pt-4">
                  <span className="metric-title block mb-4">Valor Estimado da Parcela</span>
                  <div className="bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-inner text-center">
                    <p className="text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-2xl">{formatCurrency(installmentValue)}</p>
                    <p className="text-sm font-black text-fin-blue uppercase tracking-[0.2em]">{count}x {newLoan.payment_type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 border-dashed border-white/10 bg-transparent">
              <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Dica de Especialista</h4>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Clientes com score acima de 70 possuem menor taxa de inadimplência. Considere oferecer taxas competitivas para fidelizar bons pagadores.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

