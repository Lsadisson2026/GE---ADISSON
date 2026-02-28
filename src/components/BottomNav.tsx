import React from 'react';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users, 
  AlertCircle, 
  HandCoins, 
  BarChart3, 
  UserPlus 
} from 'lucide-react';
import { cn } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'collections', label: 'Cobrar', icon: CalendarClock, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'late', label: 'Atrasos', icon: AlertCircle, roles: ['ADMIN', 'COLLECTOR'] },
    { id: 'loans', label: 'Novo', icon: HandCoins, roles: ['ADMIN'] },
    { id: 'reports', label: 'Relat.', icon: BarChart3, roles: ['ADMIN'] },
    { id: 'users', label: 'Equipe', icon: UserPlus, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="glass-panel rounded-[24px] px-3 py-3 flex justify-around items-center shadow-2xl border-white/5 bg-fin-dark/60 backdrop-blur-2xl">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 px-1 py-1 transition-all flex-1 min-w-0",
              activeTab === item.id ? "text-white" : "text-slate-500"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
              activeTab === item.id ? "bg-fin-blue/10 border border-fin-blue/20 shadow-glow-blue" : "bg-transparent border border-transparent"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-500", 
                activeTab === item.id ? "text-fin-blue" : "stroke-[2px]"
              )} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.1em] transition-all duration-500 truncate w-full text-center",
              activeTab === item.id ? "text-fin-blue" : "text-slate-600"
            )}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
