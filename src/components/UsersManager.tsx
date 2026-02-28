import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types';
import { UserPlus, Trash2, ShieldCheck, Shield, Phone, Key, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';

export const UsersManager: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    login: '',
    password: '',
    role: UserRole.COLLECTOR
  });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, login, role')
        .order('name');

      if (error) throw error;

      setUsers(data as User[]);
    } catch (err) {
      console.error('Erro ao buscar membros da equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const email = `${newUser.login}@sistema.com`;
      
      const { data, error } = await supabase.rpc('create_new_collector', {
        p_email: email,
        p_password: newUser.password,
        p_name: newUser.name,
        p_phone: newUser.phone
      });

      if (error) throw error;

      // Se o RPC retornar um objeto com success: true ou apenas o ID, consideramos sucesso
      const isSuccess = data && (typeof data === 'string' || (data as any).success === true);

      if (isSuccess || !error) {
        setShowModal(false);
        setNewUser({ name: '', phone: '', login: '', password: '', role: UserRole.COLLECTOR });
        
        // Atualiza a lista instantaneamente
        await fetchTeam();
        
        alert('Cobrador criado com sucesso!');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      alert('Erro ao criar usuário: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    if (!confirm('Tem certeza que deseja remover este cobrador?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Erro ao remover usuário: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Carregando usuários...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="section-title">Gestão de Equipe</h2>
          <p className="text-slate-500 font-medium mt-1">Gerencie sua equipe de campo, acessos e permissões.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-8 py-4 glow-button"
          >
            <UserPlus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Novo Cobrador</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map((user) => (
          <motion.div
            key={user.id}
            layout
            whileHover={{ y: -6 }}
            className="glass-panel p-10 shadow-glow-blue flex flex-col group border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-fin-blue/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
                user.role === UserRole.ADMIN 
                  ? "bg-fin-blue/10 text-fin-blue border-fin-blue/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] group-hover:shadow-glow-blue" 
                  : "bg-fin-blue/10 text-fin-blue border-fin-blue/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] group-hover:shadow-glow-blue"
              }`}>
                {user.role === UserRole.ADMIN ? <ShieldCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
              </div>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                user.role === UserRole.ADMIN 
                  ? "text-fin-blue bg-fin-blue/10 border-fin-blue/20" 
                  : "text-slate-400 bg-white/5 border-white/10"
              }`}>
                {user.role}
              </span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-fin-blue transition-colors duration-500">{user.name}</h3>
            <p className="text-sm text-slate-500 mb-8 flex items-center gap-3 font-semibold">
              <Phone className="w-4 h-4 text-slate-600" /> {user.phone || 'N/A'}
            </p>

            <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 metric-title">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <Key className="w-4 h-4 text-slate-500" />
                </div>
                <span className="font-black text-white tracking-tight">{user.login}</span>
              </div>
              {user.role === UserRole.COLLECTOR && currentUser?.id !== user.id && (
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-3 text-slate-600 hover:text-fin-rose hover:bg-fin-rose/10 rounded-2xl transition-all duration-500 border border-transparent hover:border-fin-rose/20"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-fin-dark/80 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-panel w-full sm:max-w-lg flex flex-col max-h-[80dvh] sm:max-h-[85vh] border-white/10 shadow-2xl overflow-hidden rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px]"
          >
            <form onSubmit={handleAddUser} className="flex flex-col h-full relative">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div>
                  <h3 className="font-black text-xl md:text-2xl text-white tracking-tight">Novo Cobrador</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Defina as credenciais de acesso.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 bg-fin-dark/40 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block metric-title mb-3">Nome Completo</label>
                    <input 
                      required
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner text-base"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="block metric-title mb-3">Login de Acesso</label>
                    <input 
                      required
                      type="text"
                      value={newUser.login}
                      onChange={(e) => setNewUser({...newUser, login: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner text-base"
                      placeholder="joao.silva"
                    />
                  </div>
                  <div>
                    <label className="block metric-title mb-3">Senha</label>
                    <input 
                      required
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner text-base"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block metric-title mb-3">Telefone / WhatsApp</label>
                    <input 
                      type="text"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-fin-blue/50 focus:ring-1 focus:ring-fin-blue/50 text-white font-semibold transition-all shadow-inner text-base"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-fin-dark/50 backdrop-blur-md shrink-0 pb-[calc(2rem+env(safe-area-inset-bottom))] flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 glass-button font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-4 glow-button disabled:opacity-50 disabled:grayscale text-base"
                >
                  <span className="relative z-10">{creating ? 'Criando...' : 'Criar Acesso'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

