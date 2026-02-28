import React, { useEffect, useState } from 'react';
import { Client, ClientStatus } from '../types';
import { formatDate, formatCurrency } from '../utils';
import { Search, UserPlus, Phone, Star, ShieldAlert, CheckCircle2, Wallet, Landmark, Trash2, Eye, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { ClientInstallmentsModal } from './ClientInstallmentsModal';
import { BottomSheet } from './BottomSheet';
import { supabase } from '../supabaseClient';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const field = `
  w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl outline-none
  focus:border-fin-blue/50 focus:bg-white/[0.06]
  text-white text-sm font-medium placeholder:text-slate-600
  transition-all duration-200
`;

/* ── Fora do componente — sem remount ao digitar ── */
const ClientFormFields: React.FC<{ data: any; onChange: (k: string, v: string) => void }> = ({ data, onChange }) => (
  <div className="space-y-3">
    {[
      { key: 'name',    label: 'Nome',     type: 'text',   placeholder: 'Nome completo',       required: true },
      { key: 'phone',   label: 'Telefone', type: 'tel',    placeholder: '(00) 00000-0000',     required: true },
      { key: 'cpf',     label: 'CPF',      type: 'text',   placeholder: '000.000.000-00' },
      { key: 'address', label: 'Endereço', type: 'text',   placeholder: 'Rua, nº, bairro...' },
    ].map(({ key, label, type, placeholder, required }) => (
      <div key={key}>
        <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">{label}</label>
        <input
          type={type} required={required}
          value={data[key] || ''} onChange={(e) => onChange(key, e.target.value)}
          className={field} placeholder={placeholder}
          autoComplete={key === 'name' ? 'name' : key === 'phone' ? 'tel' : 'off'}
        />
      </div>
    ))}
    <div>
      <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Observações</label>
      <textarea
        value={data.notes || ''} onChange={(e) => onChange('notes', e.target.value)}
        className={`${field} min-h-[80px] resize-none`}
        placeholder="Informações de crédito..."
      />
    </div>
  </div>
);

export const Clients: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [clients, setClients]         = useState<Client[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [addOpen, setAddOpen]         = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'UPDATE' | 'STATUS' | 'DELETE'; data: any } | null>(null);
  const [newClient, setNewClient]     = useState({ name: '', cpf: '', phone: '', address: '', notes: '' });
  const [editingClient, setEditingClient]   = useState<Client | null>(null);
  const [viewingClient, setViewingClient]   = useState<Client | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let q = supabase.from('clients_summary').select('*').order('name', { ascending: true });
      if (searchTerm) q = q.ilike('name', `%${searchTerm}%`);
      const { data, error } = await q;
      if (error) throw error;
      setClients(data as Client[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchClients, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ── Handlers ── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('clients').insert([{
        ...newClient, score: 100,
        status: isAdmin ? 'ACTIVE' : 'PENDING',
        created_by: user?.id,
      }]);
      if (error) throw error;
      setAddOpen(false);
      setNewClient({ name: '', cpf: '', phone: '', address: '', notes: '' });
      fetchClients();
    } catch (e) { console.error(e); }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setPendingAction({ type: 'UPDATE', data: editingClient });
    setEditOpen(false);
    setConfirmOpen(true);
  };

  const executeUpdate = async (client: Client) => {
    try {
      const { error } = await supabase.from('clients').update({
        name: client.name, cpf: client.cpf, phone: client.phone,
        address: client.address, notes: client.notes,
      }).eq('id', client.id);
      if (error) throw error;
      fetchClients();
    } catch (e) { console.error(e); }
  };

  const executeStatus = async (id: number, status: ClientStatus) => {
    try {
      const { error } = await supabase.from('clients').update({ status }).eq('id', id);
      if (error) throw error;
      fetchClients();
    } catch (e) { console.error(e); }
  };

  const executeDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      fetchClients();
    } catch (e) { console.error(e); }
  };

  const confirm = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'STATUS') executeStatus(pendingAction.data.id, pendingAction.data.status);
    else if (pendingAction.type === 'UPDATE') executeUpdate(pendingAction.data);
    else if (pendingAction.type === 'DELETE') executeDelete(pendingAction.data.id);
    setConfirmOpen(false);
    setPendingAction(null);
  };

  const triggerStatus = (client: Client, status: ClientStatus) => {
    setPendingAction({ type: 'STATUS', data: { id: client.id, status } });
    setConfirmOpen(true);
  };

  const triggerDelete = (client: Client) => {
    setPendingAction({ type: 'DELETE', data: client });
    setConfirmOpen(true);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
  );

  /* ── Shared footer buttons ── */
  const FormFooter = ({ onCancel, label }: { onCancel: () => void; label: string }) => (
    <div className="flex gap-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:border-white/20 hover:text-white transition-all active:scale-95">
        Cancelar
      </button>
      <button type="submit" form="client-form"
        className="flex-1 py-3 rounded-xl bg-fin-blue text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-fin-blue/90 transition-all active:scale-95">
        {label}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Clientes</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} cadastrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 glow-button text-xs">
          <UserPlus className="w-3.5 h-3.5" /> Novo
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
        <input type="text" placeholder="Buscar cliente..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-white/20 transition-all" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-fin-blue/30 border-t-fin-blue rounded-full animate-spin" />
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">Nenhum cliente encontrado.</div>
      ) : (
        <>
          {/* Desktop — tabela compacta */}
          <div className="hidden lg:block glass-panel overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Cliente', 'Financeiro', 'Score', 'Status', 'Cadastro', ''].map((h, i) => (
                    <th key={i} className={cn('px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider', i === 5 && 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fin-blue/10 border border-fin-blue/15 flex items-center justify-center text-xs font-black text-fin-blue flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-fin-blue transition-colors">{c.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />{c.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">
                          Emp: <span className="text-white font-mono font-medium">{formatCurrency(c.totalLoaned || 0)}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Dív: <span className="text-fin-rose font-mono font-medium">{formatCurrency(c.totalDebt || 0)}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Star className={cn('w-3 h-3', c.score >= 70 ? 'text-fin-amber fill-fin-amber' : 'text-slate-700')} />
                        <span className="text-sm font-mono font-bold text-white">{c.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('badge text-[10px]',
                        c.status === 'ACTIVE' ? 'badge-success' : c.status === 'PENDING' ? 'badge-warning' : 'badge-danger')}>
                        {c.status === 'ACTIVE' ? 'Ativo' : c.status === 'PENDING' ? 'Pendente' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && c.status === 'PENDING' && (
                          <button onClick={() => triggerStatus(c, ClientStatus.ACTIVE)}
                            className="p-2 text-fin-emerald hover:bg-fin-emerald/10 rounded-lg transition-colors" title="Aprovar">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && c.status === 'ACTIVE' && (
                          <button onClick={() => triggerStatus(c, ClientStatus.BLOCKED)}
                            className="p-2 text-fin-rose hover:bg-fin-rose/10 rounded-lg transition-colors" title="Bloquear">
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setViewingClient(c)}
                          className="p-2 text-fin-blue hover:bg-fin-blue/10 rounded-lg transition-colors" title="Parcelas">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingClient(c); setEditOpen(true); }}
                          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Editar">
                          <PencilLine className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => triggerDelete(c)}
                            className="p-2 text-slate-600 hover:text-fin-rose hover:bg-fin-rose/10 rounded-lg transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards compactos */}
          <div className="lg:hidden space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="glass-panel px-4 py-3.5 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-fin-blue/10 border border-fin-blue/15 flex items-center justify-center text-xs font-black text-fin-blue flex-shrink-0">
                  {c.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                    <span className={cn('badge text-[9px] flex-shrink-0 py-0.5',
                      c.status === 'ACTIVE' ? 'badge-success' : c.status === 'PENDING' ? 'badge-warning' : 'badge-danger')}>
                      {c.status === 'ACTIVE' ? 'Ativo' : c.status === 'PENDING' ? 'Pendente' : 'Bloq.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-500">{c.phone}</p>
                    <p className="text-xs text-fin-rose font-mono font-medium">{formatCurrency(c.totalDebt || 0)}</p>
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className={cn('w-2.5 h-2.5', c.score >= 70 ? 'text-fin-amber fill-fin-amber' : 'text-slate-700')} />
                      <span className="text-xs font-mono text-white">{c.score}</span>
                    </div>
                  </div>
                </div>

                {/* Ações mobile */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setViewingClient(c)}
                    className="p-2 text-fin-blue hover:bg-fin-blue/10 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingClient(c); setEditOpen(true); }}
                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <PencilLine className="w-4 h-4" />
                  </button>
                  {isAdmin && c.status === 'PENDING' && (
                    <button onClick={() => triggerStatus(c, ClientStatus.ACTIVE)}
                      className="p-2 text-fin-emerald hover:bg-fin-emerald/10 rounded-lg transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => triggerDelete(c)}
                      className="p-2 text-slate-600 hover:text-fin-rose hover:bg-fin-rose/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal: Novo Cliente ── */}
      <BottomSheet
        open={addOpen} onClose={() => setAddOpen(false)}
        title="Novo Cliente" subtitle="Preencha os dados de cadastro"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setAddOpen(false)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:text-white transition-all active:scale-95">
              Cancelar
            </button>
            <button type="submit" form="add-client-form"
              className="flex-1 py-3 rounded-xl bg-fin-blue text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-fin-blue/90 transition-all active:scale-95">
              Cadastrar
            </button>
          </div>
        }
      >
        <form id="add-client-form" onSubmit={handleAdd}>
          <ClientFormFields data={newClient} onChange={(k, v) => setNewClient(p => ({ ...p, [k]: v }))} />
        </form>
      </BottomSheet>

      {/* ── Modal: Editar Cliente ── */}
      <BottomSheet
        open={editOpen && !!editingClient}
        onClose={() => setEditOpen(false)}
        title="Editar Cliente"
        subtitle={editingClient?.name}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditOpen(false)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:text-white transition-all active:scale-95">
              Cancelar
            </button>
            <button type="submit" form="edit-client-form"
              className="flex-1 py-3 rounded-xl bg-fin-blue text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-fin-blue/90 transition-all active:scale-95">
              Salvar
            </button>
          </div>
        }
      >
        {editingClient && (
          <form id="edit-client-form" onSubmit={handleUpdateSubmit}>
            <ClientFormFields
              data={editingClient}
              onChange={(k, v) => setEditingClient(p => p ? { ...p, [k]: v } : p)}
            />
          </form>
        )}
      </BottomSheet>

      {/* ── Modal: Confirmação ── */}
      <BottomSheet
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
        title={pendingAction?.type === 'DELETE' ? 'Excluir cliente?' : 'Confirmar ação'}
        maxWidth="sm:max-w-sm"
        footer={
          <div className="flex gap-2">
            <button onClick={() => { setConfirmOpen(false); setPendingAction(null); }}
              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:text-white transition-all active:scale-95">
              Cancelar
            </button>
            <button onClick={confirm}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95',
                pendingAction?.type === 'DELETE'
                  ? 'bg-fin-rose hover:bg-fin-rose/90 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'bg-fin-blue hover:bg-fin-blue/90 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              )}>
              Confirmar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-400 leading-relaxed py-2">
          {pendingAction?.type === 'DELETE'
            ? `Tem certeza que deseja excluir "${pendingAction?.data?.name}"? Esta ação é irreversível.`
            : pendingAction?.type === 'UPDATE'
              ? 'Salvar as alterações deste cliente?'
              : 'Alterar o status deste cliente?'}
        </p>
      </BottomSheet>

      {/* ── Modal: Parcelas ── */}
      <AnimatePresence>
        {viewingClient && (
          <ClientInstallmentsModal 
            key="installments-modal"
            client={viewingClient} 
            onClose={() => setViewingClient(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};