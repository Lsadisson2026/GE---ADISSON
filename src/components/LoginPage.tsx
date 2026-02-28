import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types';
import { LogIn, ShieldCheck, User as UserIcon, UserPlus, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Real Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError) {
            // If profile doesn't exist, maybe fallback to metadata or throw error
            console.error('Error fetching profile:', profileError);
            throw new Error('Erro ao carregar perfil do usuário.');
          }

          const user: User = {
            id: authData.user.id,
            name: profileData.name || authData.user.user_metadata.name,
            login: authData.user.email || '',
            phone: profileData.phone || authData.user.user_metadata.phone || '',
            role: profileData.role as UserRole,
          };

          login(user);
        }
      } else {
        // Real Sign Up
        const role = (showAdminCode && adminCode === 'admin123') ? UserRole.ADMIN : UserRole.COLLECTOR;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: username,
          password: password,
          options: {
            data: {
              name: name,
              phone: phone,
              role: role, // Storing role in metadata as well for initial setup
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Create profile entry manually if trigger doesn't exist yet
          // Ideally a trigger on auth.users would create this, but we'll do it here just in case
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: signUpData.user.id,
                name: name,
                phone: phone,
                role: role,
                login: username,
              }
            ]);

          if (profileInsertError) {
             console.error('Error creating profile:', profileInsertError);
             // Don't block sign up success if profile creation fails, but warn
          }

          setIsLogin(true);
          setError(`Conta ${role === UserRole.ADMIN ? 'ADMIN' : ''} criada com sucesso! Verifique seu e-mail para confirmar.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-24 h-24 glass-panel rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] mx-auto mb-8 border-blue-500/30 overflow-hidden p-4"
          >
            <img src="https://i.postimg.cc/G3JkMH6z/image-removebg-preview.png" alt="Adisson Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-sm">Adisson</h1>
          <p className="text-lg text-slate-400 font-medium">Gestão de Empréstimos Privados</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-8 shadow-glow-blue">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-medium text-white placeholder:text-slate-600"
                      placeholder="Nome Completo"
                      required={!isLogin}
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-medium text-white placeholder:text-slate-600"
                      placeholder="Telefone"
                      required={!isLogin}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="adminMode" 
                      checked={showAdminCode} 
                      onChange={(e) => setShowAdminCode(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-black/40 text-blue-500 focus:ring-blue-500/50"
                    />
                    <label htmlFor="adminMode" className="text-sm text-slate-400 cursor-pointer select-none">Criar conta como Administrador</label>
                  </div>

                  {showAdminCode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="relative group"
                    >
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-fin-amber w-5 h-5" />
                      <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-black/40 border border-fin-amber/30 rounded-xl focus:border-fin-amber/50 focus:ring-1 focus:ring-fin-amber/50 outline-none transition-all font-medium text-white placeholder:text-slate-600"
                        placeholder="Código Secreto de Admin"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-medium text-white placeholder:text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                placeholder="Usuário"
                required
              />
            </div>

            <div className="relative group">
              <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-medium text-white placeholder:text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                placeholder="Senha"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${error.includes('sucesso') ? 'text-emerald-400' : 'text-rose-400'} text-sm font-bold text-center drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]`}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 glow-button text-lg disabled:opacity-50 disabled:grayscale"
          >
            <span className="relative z-10">
              {loading ? (isLogin ? 'Autenticando...' : 'Criando conta...') : (isLogin ? 'Entrar' : 'Criar Conta')}
            </span>
          </motion.button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Não tem uma conta? Criar agora
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Já tem uma conta? Fazer login
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
          Powered by SecureFlow Engine
        </p>
      </motion.div>
    </div>
  );
};
