import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils';
import { BarChart3, TrendingUp, Wallet, Users as UsersIcon, PieChart, Calendar, CheckCircle2, FileDown, Filter, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { generatePDFReport } from '../services/pdfService';
import { supabase } from '../supabaseClient';

export const Reports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [exporting, setExporting] = useState(false);

  const fetchReports = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      let days = 30;
      let startDate = new Date();
      
      if (selectedPeriod === 'daily') {
        days = 1;
        startDate.setDate(startDate.getDate() - 1);
      } else if (selectedPeriod === 'weekly') {
        days = 7;
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedPeriod === 'monthly') {
        days = 30;
        startDate.setDate(startDate.getDate() - 30);
      } else if (selectedPeriod === 'yearly') {
        days = 365;
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const startDateIso = startDate.toISOString();

      // Fetch indicators
      const { data: indicatorsData, error: indicatorsError } = await supabase
        .from('financial_indicators')
        .select('*')
        .gte('created_at', startDateIso);

      if (indicatorsError) throw indicatorsError;

      // Aggregate indicators
      const indicators = {
        totalLoaned: 0,
        totalReceived: 0,
        totalInterest: 0,
        openCapital: 0,
        loanCount: 0,
        activeClients: 0,
        lateClients: 0
      };

      const uniqueClients = new Set();
      const lateClientsSet = new Set();

      (indicatorsData || []).forEach((row: any) => {
        indicators.totalLoaned += Number(row.totalLoaned || 0);
        indicators.totalReceived += Number(row.totalReceived || 0);
        indicators.totalInterest += Number(row.totalInterest || 0);
        indicators.openCapital += Number(row.openCapital || 0);
        indicators.loanCount += 1;
        uniqueClients.add(row.client_id);
        if (row.isLate) {
          lateClientsSet.add(row.client_id);
        }
      });

      indicators.activeClients = uniqueClients.size;
      indicators.lateClients = lateClientsSet.size;

      // Fetch Cash Flow
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .rpc('get_cash_flow', { days });

      if (cashFlowError) throw cashFlowError;

      // Fetch Rankings - Top Profit
      const { data: topProfitData, error: topProfitError } = await supabase
        .from('clients_summary')
        .select('name, totalProfit')
        .order('totalProfit', { ascending: false })
        .limit(5);

      if (topProfitError) throw topProfitError;

      // Fetch Rankings - Top Debt
      const { data: topDebtData, error: topDebtError } = await supabase
        .from('clients_summary')
        .select('name, totalDebt')
        .order('totalDebt', { ascending: false })
        .limit(5);

      if (topDebtError) throw topDebtError;

      // Fetch Details for PDF
      const { data: detailsData, error: detailsError } = await supabase
        .from('clients_summary')
        .select('*')
        .order('name');

      if (detailsError) throw detailsError;

      setStats({
        indicators,
        charts: {
          cashFlow: cashFlowData || [],
          growth: [] 
        },
        details: (detailsData || []).map(d => ({
          clientName: d.name,
          loaned: d.totalLoaned,
          paid: d.totalLoaned + (d.totalProfit || 0) - d.totalDebt, // Approximate paid capital
          balance: d.totalDebt,
          status: d.status,
          daysLate: 0 // Placeholder
        })),
        rankings: {
          topProfit: (topProfitData || []).map(d => ({ name: d.name, profit: d.totalProfit })),
          topDebt: (topDebtData || []).map(d => ({ name: d.name, debt: d.totalDebt }))
        }
      });

    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(period);
  }, [period]);

  const handleExportPDF = async () => {
    if (!stats) return;
    setExporting(true);
    try {
      await generatePDFReport(stats, period);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o relatório PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !stats) return <div className="p-8 text-center text-zinc-400">Gerando relatórios...</div>;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const indicators = stats?.indicators || {};
  
  const pieData = [
    { name: 'Capital Recebido', value: indicators.totalReceived || 0 },
    { name: 'Capital em Aberto', value: indicators.openCapital || 0 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="section-title">Relatórios Financeiros</h2>
          <p className="text-slate-500 font-medium mt-1">Análise detalhada de capital, lucro e inadimplência.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-500 tracking-tight ${
                  period === p 
                    ? "bg-fin-blue/20 text-white shadow-glow-blue border border-fin-blue/30" 
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {p === 'daily' ? 'DIA' : p === 'weekly' ? 'SEMANA' : p === 'monthly' ? 'MÊS' : 'ANO'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-6 py-3 glass-button text-sm flex items-center gap-3 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{exporting ? 'Gerando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="glass-panel p-8 shadow-glow-blue relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fin-blue/5 blur-[50px] rounded-full pointer-events-none" />
          <p className="metric-title mb-4">Total Emprestado</p>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:text-fin-blue transition-colors duration-500">{formatCurrency(indicators.totalLoaned || 0)}</p>
          <div className="mt-6 flex items-center gap-3 text-fin-blue text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="w-8 h-8 bg-fin-blue/10 rounded-xl flex items-center justify-center border border-fin-blue/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            {indicators.loanCount || 0} Contratos
          </div>
        </div>

        <div className="glass-panel p-8 shadow-glow-green relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fin-emerald/5 blur-[50px] rounded-full pointer-events-none" />
          <p className="metric-title mb-4">Capital Recebido</p>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:text-fin-emerald transition-colors duration-500">{formatCurrency(indicators.totalReceived || 0)}</p>
          <div className="mt-6 flex items-center gap-3 text-fin-emerald text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="w-8 h-8 bg-fin-emerald/10 rounded-xl flex items-center justify-center border border-fin-emerald/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            {indicators.activeClients || 0} Ativos
          </div>
        </div>

        <div className="glass-panel p-8 shadow-glow-purple relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fin-blue/5 blur-[50px] rounded-full pointer-events-none" />
          <p className="metric-title mb-4">Juros Acumulados</p>
          <p className="text-3xl font-black text-fin-blue tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:text-white transition-colors duration-500">{formatCurrency(indicators.totalInterest || 0)}</p>
          <div className="mt-6 flex items-center gap-3 text-fin-blue text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="w-8 h-8 bg-fin-blue/10 rounded-xl flex items-center justify-center border border-fin-blue/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            Lucro Realizado
          </div>
        </div>

        <div className="glass-panel p-8 shadow-glow-rose relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fin-rose/5 blur-[50px] rounded-full pointer-events-none" />
          <p className="metric-title mb-4">Inadimplência</p>
          <p className="text-3xl font-black text-fin-rose tracking-tighter drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] group-hover:text-white transition-colors duration-500">{indicators.lateClients || 0}</p>
          <div className="mt-6 flex items-center gap-3 text-fin-rose text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="w-8 h-8 bg-fin-rose/10 rounded-xl flex items-center justify-center border border-fin-rose/20">
              <AlertCircle className="w-4 h-4" />
            </div>
            Ação Necessária
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 md:p-10 border-white/5">
          <h3 className="font-black text-xl text-white mb-10 flex items-center gap-4 tracking-tight">
            <div className="w-10 h-10 bg-fin-blue/10 rounded-2xl flex items-center justify-center border border-fin-blue/20">
              <BarChart3 className="w-5 h-5 text-fin-blue" />
            </div>
            Fluxo de Caixa Operacional
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats?.charts?.cashFlow || []}>
                <defs>
                  <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                  contentStyle={{backgroundColor: 'rgba(2,2,5,0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}} 
                  itemStyle={{color: '#fff', fontWeight: 'bold', fontSize: '12px'}}
                />
                <Bar dataKey="received" name="Recebido" fill="url(#receivedGrad)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expected" name="Previsto" fill="url(#expectedGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-10 border-white/5">
          <h3 className="font-black text-xl text-white mb-10 flex items-center gap-4 tracking-tight">
            <div className="w-10 h-10 bg-fin-blue/10 rounded-2xl flex items-center justify-center border border-fin-blue/20">
              <PieChart className="w-5 h-5 text-fin-blue" />
            </div>
            Distribuição de Ativos
          </h3>
          <div className="h-[300px] flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: 'rgba(2,2,5,0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff'}}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-6 w-full md:w-auto">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: COLORS[i], color: COLORS[i] }} />
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</p>
                    <p className="font-black text-white text-lg tracking-tighter">{formatCurrency(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 md:p-10 border-white/5">
          <h3 className="font-black text-xl text-white mb-8 flex items-center gap-4 tracking-tight">
            <div className="w-10 h-10 bg-fin-emerald/10 rounded-2xl flex items-center justify-center border border-fin-emerald/20">
              <TrendingUp className="w-5 h-5 text-fin-emerald" />
            </div>
            Top Performance por Cliente
          </h3>
          <div className="space-y-4">
            {stats?.rankings?.topProfit.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 group hover:bg-white/[0.04] transition-all duration-500">
                <div className="flex items-center gap-5">
                  <span className="w-10 h-10 flex items-center justify-center bg-fin-emerald/10 text-fin-emerald rounded-xl text-sm font-black border border-fin-emerald/20">{i+1}</span>
                  <span className="font-bold text-white text-lg tracking-tight">{item.name}</span>
                </div>
                <span className="font-black text-fin-emerald text-lg tracking-tighter">{formatCurrency(item.profit)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 md:p-10 border-white/5">
          <h3 className="font-black text-xl text-white mb-8 flex items-center gap-4 tracking-tight">
            <div className="w-10 h-10 bg-fin-rose/10 rounded-2xl flex items-center justify-center border border-fin-rose/20">
              <AlertCircle className="w-5 h-5 text-fin-rose" />
            </div>
            Exposição de Risco por Cliente
          </h3>
          <div className="space-y-4">
            {stats?.rankings?.topDebt.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 group hover:bg-white/[0.04] transition-all duration-500">
                <div className="flex items-center gap-5">
                  <span className="w-10 h-10 flex items-center justify-center bg-fin-rose/10 text-fin-rose rounded-xl text-sm font-black border border-fin-rose/20">{i+1}</span>
                  <span className="font-bold text-white text-lg tracking-tight">{item.name}</span>
                </div>
                <span className="font-black text-fin-rose text-lg tracking-tighter">{formatCurrency(item.debt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
