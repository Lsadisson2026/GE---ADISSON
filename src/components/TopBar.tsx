import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, Settings, LogOut, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../utils';

interface TopBarProps {
  setActiveTab: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ setActiveTab }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/clients`);
      const clients = await response.json();
      const filtered = clients.filter((c: any) => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.phone.includes(query)
      ).slice(0, 5);
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-20 border-b border-white/5 bg-fin-dark/50 backdrop-blur-xl sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl" ref={searchRef}>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-fin-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar clientes, empréstimos ou transações..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setIsSearching(true)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-fin-blue/30 focus:bg-white/[0.05] transition-all"
          />
          
          <AnimatePresence>
            {isSearching && searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 glass-panel overflow-hidden z-50 border-white/10 shadow-2xl"
              >
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2">Clientes Encontrados</p>
                  {searchResults.map((client) => (
                    <button 
                      key={client.id}
                      onClick={() => {
                        setActiveTab('clients');
                        setIsSearching(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-fin-blue/10 flex items-center justify-center text-fin-blue font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-fin-blue transition-colors">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative",
                showNotifications && "bg-white/5 text-white"
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-fin-rose rounded-full border-2 border-fin-dark animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 glass-panel overflow-hidden z-50 border-white/10 shadow-2xl"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-sm font-bold text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] font-bold text-fin-blue hover:underline">Marcar todas como lidas</button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                        <p className="text-xs text-slate-500 font-medium">Nenhuma notificação por enquanto</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all relative group",
                            !n.read && "bg-fin-blue/5"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              n.type === 'success' ? "bg-fin-emerald/10 text-fin-emerald" : "bg-fin-blue/10 text-fin-blue"
                            )}>
                              {n.type === 'success' ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white mb-0.5">{n.title}</p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                              <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <button 
                              onClick={() => removeNotification(n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-fin-rose transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {!n.read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="absolute top-4 right-4 w-2 h-2 bg-fin-blue rounded-full"
                              title="Marcar como lida"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => {
              setActiveTab('users'); // Assuming users management is part of settings
              setShowProfile(false);
            }}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-white/10" />

        <div className="relative" ref={profileRef}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProfile(!showProfile)}
            className={cn(
              "flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-white/5 transition-all group",
              showProfile && "bg-white/5"
            )}
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fin-blue to-fin-indigo flex items-center justify-center text-white font-bold shadow-lg shadow-fin-blue/20">
              {user?.name?.charAt(0)}
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-500 group-hover:text-white transition-all", showProfile && "rotate-180 text-white")} />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 glass-panel overflow-hidden z-50 border-white/10 shadow-2xl"
              >
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setActiveTab('dashboard');
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                  >
                    <User className="w-4 h-4 text-slate-500 group-hover:text-fin-blue transition-colors" />
                    <span className="text-sm font-bold text-white">Meu Perfil</span>
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('users');
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                  >
                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-fin-blue transition-colors" />
                    <span className="text-sm font-bold text-white">Configurações</span>
                  </button>
                  <div className="h-px bg-white/5 my-2" />
                  <button 
                    onClick={() => {
                      logout();
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-fin-rose/10 transition-all text-left group"
                  >
                    <LogOut className="w-4 h-4 text-slate-500 group-hover:text-fin-rose transition-colors" />
                    <span className="text-sm font-bold text-white group-hover:text-fin-rose transition-colors">Sair da Conta</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
