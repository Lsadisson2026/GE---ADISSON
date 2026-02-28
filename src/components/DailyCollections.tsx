import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import { Phone, MessageCircle, CheckCircle, XCircle, DollarSign, Copy, ExternalLink, FileDown, CalendarClock, MapPin, Wallet, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateCollectionsPDF } from '../services/pdfService';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Collection {
  installmentId: number;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  pending_value: number;
  paid_amount: number;
  due_date: string;
  installmentStatus: string;
  payment_method: string;
  loanCapital: number;
  loanDebt: number;
}

export const DailyCollections: React.FC = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CASH'>('PIX');
  const [exporting, setExporting] = useState(false);

  const [clientDetails, setClientDetails] = useState<{ totalLoaned: number, totalDebt: number } | null>(null);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_collection_list')
        .select('*')
        .neq('status', 'PAID');

      if (error) throw error;

      const mappedCollections: Collection[] = (data || []).map((item: any) => ({
        installmentId: item.installment_id,
        clientName: item.client_name,
        clientPhone: item.client_phone,
        clientAddress: item.client_address,
        pending_value: item.pending_value,
        paid_amount: item.paid_amount || 0,
        due_date: item.due_date,
        installmentStatus: item.status,
        payment_method: item.payment_method,
        loanCapital: item.loan_capital || 0,
        loanDebt: item.loan_debt || 0
      }));

      setCollections(mappedCollections);
    } catch (err) {
      console.error('Erro ao buscar cobranças:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!selectedCollection) {
        setClientDetails(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clients_summary')
          .select('totalLoaned, totalDebt')
          .eq('name', selectedCollection.clientName) // Assuming name is unique enough for this context, ideally we'd have client_id
          .single();

        if (error) throw error;

        // Force refresh if capital is 0 but there are pending installments
        if (data.totalLoaned === 0 && selectedCollection.pending_value > 0) {
          // In a real scenario without SQL access, we might just use the view's data or trigger a backend refresh.
          // Since we can't run SQL, we'll just use the fetched data.
          setClientDetails({ totalLoaned: data.totalLoaned, totalDebt: data.totalDebt });
        } else {
          setClientDetails({ totalLoaned: data.totalLoaned, totalDebt: data.totalDebt });
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do cliente:', err);
        // Fallback to the data from the view if the summary fetch fails
        setClientDetails({ totalLoaned: selectedCollection.loanCapital, totalDebt: selectedCollection.loanDebt });
      }
    };

    fetchClientDetails();
  }, [selectedCollection]);

  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePayment = async (type: 'FULL' | 'PARTIAL' | 'INTEREST') => {
    if (!selectedCollection || !user) return;
    
    const amount = type === 'FULL' 
      ? selectedCollection.pending_value 
      : parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) return;

    try {
      // Call RPC to register payment and update installment status
      const { error: rpcError } = await supabase.rpc('register_payment_final', {
        payload: {
          p_installment_id: selectedCollection.installmentId,
          p_amount: amount,
          p_type: type,
          p_method: paymentMethod,
          p_created_by: user.id
        }
      });

      if (rpcError) throw rpcError;

      setSelectedCollection(null);
      setPaymentAmount('');
      alert('Pagamento registrado com sucesso!');
      
      // Refresh the list ignoring secondary network errors
      try {
        await fetchCollections();
      } catch (fetchErr) {
        // Ignora erros de rede secundários (ex: Failed to fetch) após o sucesso da operação principal
      }

    } catch (err: any) {
      alert('Erro ao registrar pagamento: ' + (err.message || 'Erro de conexão'));
    }
  };

  const sendWhatsApp = (collection: Collection) => {
    const message = `Olá ${collection.clientName}, passando para lembrar do seu pagamento de hoje. Qualquer dúvida estou à disposição!`;
    const url = `https://wa.me/${collection.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const copyMessage = (collection: Collection) => {
    const message = `Olá ${collection.clientName}, passando para lembrar do seu pagamento de hoje.`;
    navigator.clipboard.writeText(message);
    alert('Mensagem copiada!');
  };

  const handleExportPDF = async () => {
    if (collections.length === 0) return;
    setExporting(true);
    try {
      await generateCollectionsPDF(collections);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o PDF de cobranças.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Carregando cobranças...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="section-title">Cobranças do Dia</h2>
          <p className="text-slate-500 font-medium mt-1">Vencimentos para hoje, {formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportPDF}
            disabled={exporting || collections.length === 0}
            className="px-6 py-3 glass-button text-sm disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'Gerando...' : 'Exportar PDF'}
          </button>
          <div className="bg-fin-blue/10 text-fin-blue px-5 py-2.5 rounded-2xl font-bold text-sm border border-fin-blue/20 shadow-glow-blue">
            {collections.length} Pendentes
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {collections.length === 0 ? (
          <div className="glass-panel p-20 text-center border-dashed border-white/10">
            <div className="w-20 h-20 bg-fin-emerald/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-fin-emerald/20">
              <CheckCircle className="w-10 h-10 text-fin-emerald" />
            </div>
            <h3 className="text-2xl font-bold text-white">Tudo em dia!</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Não há cobranças pendentes para hoje. Excelente trabalho na gestão!</p>
          </div>
        ) : (
          collections.map((item) => (
            <motion.div
              key={item.installmentId}
              layout
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass-panel p-5 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 shadow-glow-blue border-white/5"
            >
              <div className="flex items-center gap-5 md:gap-8 flex-1">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-white/[0.05] to-transparent rounded-xl md:rounded-2xl flex items-center justify-center font-black text-white text-lg md:text-2xl border border-white/10 shadow-inner shrink-0">
                  {item.clientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
                    <h4 className="text-lg md:text-xl font-bold text-white truncate">{item.clientName}</h4>
                    <span className="badge badge-info w-fit">{item.payment_method}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5 md:gap-2.5"><Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-fin-blue" /> {item.clientPhone}</span>
                    {item.clientAddress && (
                      <span className="flex items-center gap-1.5 md:gap-2.5 truncate max-w-[150px] md:max-w-none"><MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600" /> {item.clientAddress}</span>
                    )}
                    <span className="flex items-center gap-1.5 md:gap-2.5 text-fin-blue"><CalendarClock className="w-3.5 h-3.5 md:w-4 md:h-4" /> Vence Hoje</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center px-0 lg:px-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0">
                <p className="metric-title mb-0 lg:mb-1">Valor Pendente</p>
                <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatBRL(item.pending_value)}</p>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendWhatsApp(item)}
                  className="p-3 md:p-4 text-fin-blue bg-fin-blue/10 rounded-xl md:rounded-2xl transition-all hover:bg-fin-blue/20 border border-fin-blue/20"
                  title="Enviar WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCollection(item)}
                  className="px-6 py-3 md:px-8 md:py-4 glow-button text-sm flex-1 lg:flex-none"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Receber</span>
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Payment Modal */}
<AnimatePresence>
  {selectedCollection && (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-fin-dark/80 backdrop-blur-xl p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-panel w-full sm:max-w-lg flex flex-col max-h-[95dvh] sm:max-h-[85vh] border-t sm:border border-white/10 shadow-2xl overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-fin-dark"
      >
        {/* Handle visual para mobile */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Registrar Recebimento</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fluxo de Caixa</p>
          </div>
          <button onClick={() => setSelectedCollection(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
            <XCircle className="w-7 h-7" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
          {/* Card de Informações do Cliente */}
          <div className="bg-white/[0.03] p-5 rounded-[24px] border border-white/5 shadow-inner">
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cliente em Cobrança</p>
              <p className="text-2xl font-black text-white leading-tight truncate">
                {selectedCollection.clientName}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Emprestado</p>
                <p className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-fin-emerald/50" />
                  {formatBRL(clientDetails?.totalLoaned || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Dívida Global</p>
                <p className="text-sm font-bold text-slate-300 flex items-center justify-end gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-fin-rose/50" />
                  {formatBRL(clientDetails?.totalDebt || 0)}
                </p>
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Parcela Atual</p>
                <p className="text-sm font-bold text-slate-400">
                  {formatBRL(selectedCollection.pending_value + selectedCollection.paid_amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-fin-blue uppercase mb-1">Saldo da Parcela</p>
                <p className="text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  {formatBRL(selectedCollection.pending_value)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Seletor de Método de Pagamento */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1">Método de Recebimento</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('PIX')}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all duration-300 active:scale-95",
                    paymentMethod === 'PIX' 
                      ? "border-fin-blue/50 bg-fin-blue/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                      : "border-white/5 text-slate-500 bg-white/5"
                  )}
                >
                  PIX / Transf.
                </button>
                <button 
                  onClick={() => setPaymentMethod('CASH')}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all duration-300 active:scale-95",
                    paymentMethod === 'CASH' 
                      ? "border-fin-blue/50 bg-fin-blue/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
                      : "border-white/5 text-slate-500 bg-white/5"
                  )}
                >
                  Dinheiro
                </button>
              </div>
            </div>

            {/* Input de Valor Personalizado */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1">Valor a Receber</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-blue font-bold">R$</div>
                <input 
                  type="number"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-black text-xl transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer com botões de ação rápidos */}
        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
          <button 
            onClick={() => handlePayment('FULL')}
            className="w-full py-5 bg-fin-blue text-white font-black text-sm uppercase tracking-[0.1em] rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all"
          >
            Quitar Parcela Integral
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handlePayment('PARTIAL')}
              className="py-4 bg-white/5 border border-white/10 text-slate-300 text-[10px] uppercase tracking-widest font-black rounded-2xl active:scale-[0.98] transition-all"
            >
              Parcial
            </button>
            <button 
              onClick={() => handlePayment('INTEREST')}
              className="py-4 bg-white/5 border border-white/10 text-slate-300 text-[10px] uppercase tracking-widest font-black rounded-2xl active:scale-[0.98] transition-all"
            >
              Apenas Juros
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
