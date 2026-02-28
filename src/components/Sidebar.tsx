import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  CalendarClock, 
  AlertCircle, 
  BarChart3, 
  UserPlus, 
  LogOut,
  Menu,
  X,
  Globe,
  FileInput
} from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'collections', label: 'Cobranças do Dia', icon: CalendarClock, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'late', label: 'Inadimplentes', icon: AlertCircle, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'loans', label: 'Empréstimos', icon: HandCoins, roles: ['ADMIN'] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'users', label: 'Cobradores', icon: UserPlus, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Mobile Toggle - Hidden in favor of BottomNav */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-md rounded-lg shadow-md border border-white/10 text-white"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-fin-dark/80 backdrop-blur-3xl border-r border-white/5 transform transition-transform duration-500 ease-[0.23,1,0.32,1] lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-12">
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">Adisson</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-fin-blue font-bold mt-1.5">Gestão de Empréstimos</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="metric-title mb-5 ml-2">Menu Principal</p>
                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative group",
                          isActive 
                            ? "text-white bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/5" 
                            : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]"
                        )}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="active-pill"
                            className="absolute left-0 top-3 bottom-3 w-1 bg-fin-blue rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                          />
                        )}
                        <item.icon className={cn(
                          "w-5 h-5 transition-all duration-300", 
                          isActive ? "text-fin-blue scale-110" : "text-slate-600 group-hover:text-slate-400"
                        )} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-fin-rose bg-fin-rose/5 hover:bg-fin-rose/10 transition-all border border-fin-rose/10 hover:border-fin-rose/20 group"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
