import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardData } from '../types';
import { formatCurrency } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users as UsersIcon, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const [timeRange, setTimeRange] = useState<'1D' | '7D' | '30D'>('7D');

  const testConnection = async () => {
      console.log('Supabase connection removed.');
      alert('Supabase removido.');
  };

  const fetchChartData = async (days: number) => {
    try {
      const { data: flowData, error: flowError } = await supabase.rpc('get_cash_flow', { days });
      
      if (flowError) throw flowError;

      const newChartData = flowData.map((d: any) => {
        const date = new Date(d.date);
        // Adjust for timezone offset to get the correct local day
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return {
          name: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
          valor: d.received
        };
      }).reverse();

      setChartData(newChartData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  useEffect(() => {
    const daysMap = { '1D': 1, '7D': 7, '30D': 30 };
    fetchChartData(daysMap[timeRange]);
  }, [timeRange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: summaryData, error } = await supabase
          .from('dashboard_summary')
          .select('*')
          .single();

        if (error) throw error;

        const realData: DashboardData = {
          today: { 
            expected: summaryData.today_expected || 0, 
            paid: summaryData.today_paid || 0, 
            late: summaryData.total_late_amount || 0 
          },
          overview: {
            totalEmprestado: summaryData.total_emprestado || 0,
            totalRecebido: summaryData.total_recebido || 0,
            totalEmAberto: summaryData.total_em_aberto || 0,
            lucroProjetado: summaryData.lucro_projetado || 0,
            activeClients: summaryData.active_clients || 0,
            lateClients: summaryData.late_clients || 0,
            loanCount: summaryData.loan_count || 0
          }
        };

        setData(realData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-400">Carregando painel...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500">Erro ao carregar dados</div>;

  const stats = [
    { 
      label: 'Esperado Hoje', 
      value: formatCurrency(data.today.expected), 
      icon: Clock, 
      gradient: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      glow: 'shadow-glow-blue',
      show: true
    },
    { 
      label: 'Recebido Hoje', 
      value: formatCurrency(data.today.paid), 
      icon: CheckCircle2, 
      gradient: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-glow-emerald',
      show: true
    },
    { 
      label: 'Atrasado Hoje', 
      value: formatCurrency(data.today.late), 
      icon: AlertTriangle, 
      gradient: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      glow: 'shadow-glow-rose',
      show: true
    },
    { 
      label: 'Capital na Rua', 
      value: formatCurrency(data.overview.totalEmprestado), 
      icon: Wallet, 
      gradient: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      glow: 'shadow-glow-amber',
      show: isAdmin 
    },
  ];


  return (
    <div className="space-y-8 lg:space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Bem-vindo de volta, <span className="text-gradient-blue">{user?.name.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-500 font-medium mt-2">Aqui está o que está acontecendo com sua carteira hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={testConnection}
            className="px-4 py-2 glass-button text-xs font-bold flex items-center gap-2 hover:bg-fin-blue/10 hover:text-fin-blue hover:border-fin-blue/30"
          >
            <Database className="w-4 h-4" />
            Testar Conexão
          </button>
          <div className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-fin-emerald rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistema Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Main Balance Card - High End Fintech Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 relative overflow-hidden glass-panel p-6 md:p-10 lg:p-12 min-h-[280px] md:min-h-[320px] flex flex-col justify-between group shadow-glow-blue border-white/10"
        >
          <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-fin-blue/10 blur-[80px] md:blur-[120px] -mr-20 md:-mr-40 -mt-20 md:-mt-40 rounded-full pointer-events-none group-hover:bg-fin-blue/15 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-fin-indigo/10 blur-[60px] md:blur-[100px] -ml-10 md:-ml-20 -mb-10 md:-mb-20 rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <p className="metric-title">Lucro Projetado Total</p>
              <div className="px-2 py-0.5 bg-fin-emerald/10 text-fin-emerald text-[10px] font-bold rounded-md border border-fin-emerald/20">+12.5%</div>
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter text-gradient break-words">
              {formatCurrency(data.overview.lucroProjetado)}
            </h3>
            <p className="text-slate-500 font-medium mt-4 max-w-md text-sm md:text-base">Estimativa baseada em todos os contratos ativos e juros acumulados até o momento.</p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-4 md:gap-8 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5">
            <div>
              <p className="metric-title mb-1">Clientes Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-white">{data.overview.activeClients}</p>
            </div>
            <div className="w-px h-8 md:h-10 bg-white/10" />
            <div>
              <p className="metric-title mb-1">Contratos</p>
              <p className="text-xl md:text-2xl font-bold text-white">{data.overview.loanCount}</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="hidden sm:flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-xl bg-fin-dark border-2 border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-10 h-10 rounded-xl bg-fin-blue border-2 border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                +{data.overview.activeClients - 4}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary Stats Grid */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {stats.filter(s => s.show).slice(0, 4).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("glass-panel p-8 flex flex-col justify-between group hover:scale-[1.02]", stat.glow)}
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 duration-500", stat.gradient)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="mt-8">
                <p className="metric-title mb-2">{stat.label}</p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel p-10 shadow-glow-blue border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Análise de Fluxo</h3>
                <p className="text-sm text-slate-500 mt-1">Volume de transações nos últimos {timeRange === '1D' ? '24 horas' : timeRange === '7D' ? '7 dias' : '30 dias'}</p>
              </div>
              <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                {(['1D', '7D', '30D'] as const).map((range) => (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-5 py-2 text-xs font-bold transition-all rounded-lg",
                      timeRange === range 
                        ? "bg-fin-blue text-white shadow-lg shadow-fin-blue/20" 
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 700}} dy={15} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(2,2,5,0.9)', backdropFilter: 'blur(16px)', color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: '12px 16px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: '800', fontSize: '14px' }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-10 flex flex-col relative overflow-hidden shadow-glow-purple border-white/5">
            <div className="absolute top-0 right-0 w-60 h-60 bg-fin-indigo/10 blur-[80px] rounded-full pointer-events-none" />
            <h3 className="text-xl font-bold text-white tracking-tight mb-10 relative z-10">Saúde da Carteira</h3>
            <div className="space-y-6 flex-1 relative z-10">
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between group cursor-pointer p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-fin-rose/10 border border-fin-rose/20 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                    <TrendingDown className="text-fin-rose w-7 h-7" />
                  </div>
                  <div>
                    <p className="metric-title group-hover:text-slate-300 transition-colors">Inadimplência</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{data.overview.lateClients} Clientes</p>
                  </div>
                </div>
                <ArrowUpRight className="text-slate-600 w-6 h-6 group-hover:text-fin-rose group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </motion.div>

              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between group cursor-pointer p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-fin-blue/10 border border-fin-blue/20 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                    <UsersIcon className="text-fin-blue w-7 h-7" />
                  </div>
                  <div>
                    <p className="metric-title group-hover:text-slate-300 transition-colors">Base de Clientes</p>
                    <p className="text-xl font-extrabold text-white mt-0.5">{data.overview.activeClients} Ativos</p>
                  </div>
                </div>
                <ArrowUpRight className="text-slate-600 w-6 h-6 group-hover:text-fin-blue group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
