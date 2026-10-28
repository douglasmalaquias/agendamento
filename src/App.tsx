import React, { useState, useEffect, FormEvent } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { 
  Store, 
  WalletCards, 
  BarChart3, 
  CalendarDays, 
  Search, 
  Link2, 
  Pencil, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  X,
  Users,
  CheckCircle2,
  ExternalLink,
  Palette,
  LogOut,
  Lock,
  Mail,
  KeyRound
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// DEFINA AQUI O SEU E-MAIL DE SUPER ADMIN
const SUPER_ADMIN_EMAIL = 'dgmalaquias29@gmail.com';

// --- PALETA DE CORES (TEMAS) ---
const THEME_STYLES: Record<string, { bg: string; cardBg: string; textPrimary: string; accent: string; buttonBg: string; name: string }> = {
  coffee: { name: '🟤 Café / Moka', bg: '#f4f1eb', cardBg: '#ffffff', textPrimary: '#242329', accent: '#805d4e', buttonBg: '#805d4e' },
  dark: { name: '⬛ Dark / Grafite', bg: '#18181b', cardBg: '#27272a', textPrimary: '#ffffff', accent: '#a1a1aa', buttonBg: '#3f3f46' },
  blue: { name: '🔵 Azul Profundo', bg: '#f0f4f8', cardBg: '#ffffff', textPrimary: '#0f172a', accent: '#2563eb', buttonBg: '#2563eb' },
  emerald: { name: '🟢 Verde Esmeralda', bg: '#f0fdf4', cardBg: '#ffffff', textPrimary: '#064e3b', accent: '#059669', buttonBg: '#059669' },
};

// --- TIPOS DE DADOS ---
interface Tenant {
  id: string;
  name: string;
  slug: string;
  category: string;
  phone?: string;
  whatsapp: string;
  city?: string;
  theme?: string;
  owner_email?: string;
  pix_key?: string;
  pix_key_type?: string;
}

interface Service {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
}

interface Professional {
  id: string;
  tenant_id: string;
  name: string;
  role: string;
  specialty?: string;
  pix_key?: string;
  pix_key_type?: string;
  active: boolean;
}

interface Appointment {
  id: string;
  tenant_id: string;
  service_id?: string;
  professional_id?: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  payment_method: string;
  payment_status: string;
}

const fallbackTenant: Tenant = {
  id: 'demo-tenant',
  name: 'Barbearia Aurora',
  slug: 'barbearia-aurora',
  category: 'Barbearia',
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  city: 'São Paulo, SP',
  theme: 'coffee',
  pix_key: '11999999999',
  pix_key_type: 'telefone'
};

type View = 'super-admin' | 'tenant-admin' | 'public' | 'login';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path) {
      setCurrentSlug(path);
      setCurrentView('public');
      setAuthLoading(false);
      return;
    }

    const checkAuth = async () => {
      const client = supabase;
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await routeUserByEmail(session.user.email ?? '');
        } else {
          setCurrentView('login');
        }
      } else {
        setCurrentView('login');
      }
      setAuthLoading(false);
    };

    void checkAuth();
  }, []);

  const routeUserByEmail = async (email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setCurrentView('super-admin');
      return;
    }

    const client = supabase;
    if (client) {
      const { data } = await client.from('marco_tenants').select('*').eq('owner_email', email).single();
      if (data) {
        setActiveTenant(data as Tenant);
        setCurrentView('tenant-admin');
      } else {
        notify('Nenhum estabelecimento associado a este e-mail');
        setCurrentView('login');
      }
    }
  };

  const handleLogout = async () => {
    const client = supabase;
    if (client) await client.auth.signOut();
    setUser(null);
    setActiveTenant(null);
    setCurrentView('login');
  };

  const openPublicPage = (slug: string) => {
    window.history.pushState({}, '', `/${slug}`);
    setCurrentSlug(slug);
    setCurrentView('public');
  };

  const openTenantDashboard = (tenant: Tenant) => {
    setActiveTenant(tenant);
    setCurrentView('tenant-admin');
  };

  const backToSuperAdmin = () => {
    window.history.pushState({}, '', '/');
    if (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setActiveTenant(null);
      setCurrentView('super-admin');
    } else {
      setCurrentView('login');
    }
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-[#666]">Carregando sistema...</div>;
  }

  if (currentView === 'public') {
    return <BookingPage slug={currentSlug} onBack={backToSuperAdmin} notify={notify} />;
  }

  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={routeUserByEmail} notify={notify} />;
  }

  if (currentView === 'tenant-admin' && activeTenant) {
    return <TenantAdminView tenant={activeTenant} onBack={backToSuperAdmin} onLogout={handleLogout} notify={notify} openPublicPage={openPublicPage} isSuperAdmin={user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] font-sans">
      {notification && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#242329] px-4 py-3 text-sm text-white shadow-lg animate-bounce">
          {notification}
        </div>
      )}
      <SuperAdminView openPublicPage={openPublicPage} openTenantDashboard={openTenantDashboard} onLogout={handleLogout} notify={notify} userEmail={user?.email} />
    </div>
  );
}

// --- TELA DE LOGIN ---
function LoginPage({ onLoginSuccess, notify }: { onLoginSuccess: (email: string) => Promise<void>; notify: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const client = supabase;
    if (!client) {
      if (email === SUPER_ADMIN_EMAIL) {
        await onLoginSuccess(email);
      } else {
        notify('Supabase não conectado.');
      }
      setLoading(false);
      return;
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      notify('E-mail ou senha incorretos');
    } else if (data.user) {
      await onLoginSuccess(data.user.email ?? '');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#e9ecef]">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#242329] flex items-center justify-center text-white font-bold text-2xl mb-3">M</div>
          <h1 className="font-display text-2xl font-bold">Marcô.</h1>
          <p className="text-xs text-[#6c757d] mt-1">Acesse o seu painel administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#495057] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-[#adb5bd]" size={16} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@comercio.com"
                className="w-full rounded-xl border border-[#e9ecef] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#242329]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#495057] mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-[#adb5bd]" size={16} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#e9ecef] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#242329]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#242329] py-3 text-xs font-bold text-white shadow-md hover:bg-[#343a40] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- VISÃO 1: SUPER ADMIN (GERENCIAMENTO DE SENHAS) ---
function SuperAdminView({ openPublicPage, openTenantDashboard, onLogout, notify, userEmail }: { openPublicPage: (slug: string) => void; openTenantDashboard: (tenant: Tenant) => void; onLogout: () => void; notify: (msg: string) => void; userEmail?: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Barbearia');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCity, setFormCity] = useState('São Paulo, SP');
  const [formTheme, setFormTheme] = useState('coffee');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    const client = supabase;
    if (client) {
      const { data: tData } = await client.from('marco_tenants').select('*').order('created_at', { ascending: false });
      if (tData) setTenants(tData as Tenant[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTenant(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('Barbearia');
    setFormWhatsapp('');
    setFormCity('São Paulo, SP');
    setFormTheme('coffee');
    setFormOwnerEmail('');
    setFormPassword('');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setFormCategory(t.category);
    setFormWhatsapp(t.whatsapp);
    setFormCity(t.city || 'São Paulo, SP');
    setFormTheme(t.theme || 'coffee');
    setFormOwnerEmail(t.owner_email || '');
    setFormPassword('');
    setShowModal(true);
  };

  const handleSaveTenant = async (e: FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) {
      notify('Conexão com banco de dados indisponível');
      return;
    }

    const payload = {
      name: formName,
      slug: formSlug.toLowerCase().trim().replace(/\s+/g, '-'),
      category: formCategory,
      whatsapp: formWhatsapp.replace(/\D/g, ''),
      city: formCity,
      theme: formTheme,
      owner_email: formOwnerEmail.trim().toLowerCase()
    };

    if (editingTenant) {
      const { error } = await client.from('marco_tenants').update(payload).eq('id', editingTenant.id);
      if (!error) notify('Comércio atualizado com sucesso!');
    } else {
      const { data, error } = await client.from('marco_tenants').insert(payload).select().single();
      if (!error && data) {
        await client.from('marco_subscriptions').insert({ tenant_id: data.id, status: 'paid' });
        notify('Novo comércio cadastrado!');
      }
    }

    // Atualizar/Gerar Senha se preenchida
    if (formOwnerEmail && formPassword) {
      const { error: pwdError } = await client.rpc('admin_set_user_password', {
        user_email: formOwnerEmail.trim().toLowerCase(),
        new_password: formPassword
      });
      if (pwdError) {
        notify('Aviso: Comércio salvo, mas erro ao definir senha. Execute o SQL de suporte.');
      } else {
        notify('E-mail e Senha de acesso configurados!');
      }
    }

    setShowModal(false);
    void loadAdminData();
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o comércio "${name}"?`)) return;
    const client = supabase;
    if (client) {
      await client.from('marco_tenants').delete().eq('id', id);
      notify('Comércio excluído!');
      void loadAdminData();
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    (t.city && t.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-[#e9ecef] bg-white p-6 hidden md:block">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#242329] flex items-center justify-center text-white font-bold text-lg">M</div>
          <span className="font-display font-bold text-xl tracking-tight">Marcô.</span>
        </div>
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-[#242329] px-4 py-3 text-sm font-semibold text-white">
            <Store size={18} /> Todos os Comércios
          </button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#d94e70] hover:bg-[#fde8ed]">
            <LogOut size={18} /> Sair
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold">Super Admin</h1>
              <button onClick={onLogout} className="md:hidden text-[#d94e70] p-2"><LogOut size={18} /></button>
            </div>
            <p className="text-xs md:text-sm text-[#6c757d]">Sessão iniciada como: {userEmail}</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#242329] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#343a40] w-full md:w-auto"
          >
            <Plus size={18} /> Novo Comércio
          </button>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-4 md:p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#6c757d]">Comércios</span>
            <p className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{tenants.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-4 md:p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#6c757d]">Mensalidades</span>
            <p className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-[#2e7d32]">100%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e9ecef] bg-white p-4 md:p-6 shadow-sm">
          <div className="mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 text-[#adb5bd]" size={18} />
              <input
                type="text"
                placeholder="Buscar comércio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#e9ecef] bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#242329]"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-[#6c757d]">Carregando comércios...</p>
          ) : filteredTenants.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6c757d]">Nenhum comércio encontrado.</p>
          ) : (
            <>
              {/* CARDS MÓVEIS */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredTenants.map((t) => (
                  <div key={t.id} className="rounded-xl border border-[#e9ecef] p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-[#212529]">{t.name}</h3>
                        <span className="text-xs text-[#6c757d]">{t.category} · {t.city || 'São Paulo, SP'}</span>
                        {t.owner_email && <p className="text-[10px] text-[#805d4e]">✉ {t.owner_email}</p>}
                      </div>
                      <span className="text-xs bg-[#f8f9fa] border border-[#e9ecef] px-2 py-1 rounded-md font-mono">{t.whatsapp}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f8f9fa]">
                      <button onClick={() => openPublicPage(t.slug)} className="flex items-center gap-1 text-xs font-bold text-[#805d4e]">
                        <Link2 size={14} /> /{t.slug}
                      </button>

                      <div className="flex items-center gap-2">
                        <button onClick={() => openTenantDashboard(t)} className="rounded-lg bg-[#242329] px-3 py-1.5 text-xs font-bold text-white">
                          Entrar
                        </button>
                        <button onClick={() => handleOpenEditModal(t)} className="rounded-lg p-1.5 text-[#6c757d] bg-[#f8f9fa]">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteTenant(t.id, t.name)} className="rounded-lg p-1.5 text-[#d94e70] bg-[#fde8ed]">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* TABELA DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e9ecef] text-xs font-semibold text-[#6c757d]">
                      <th className="pb-3">COMÉRCIO</th>
                      <th className="pb-3">E-MAIL DO PROPRIETÁRIO</th>
                      <th className="pb-3">WHATSAPP</th>
                      <th className="pb-3">LINK PÚBLICO</th>
                      <th className="pb-3 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9ecef]">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-[#f8f9fa]">
                        <td className="py-4 font-semibold">
                          <button onClick={() => openTenantDashboard(t)} className="text-left hover:underline">
                            <p className="text-sm font-bold text-[#212529]">{t.name}</p>
                            <span className="text-xs font-normal text-[#6c757d]">{t.category}</span>
                          </button>
                        </td>
                        <td className="py-4 text-[#495057] text-xs font-mono">{t.owner_email || 'Não definido'}</td>
                        <td className="py-4 text-[#495057]">{t.whatsapp}</td>
                        <td className="py-4">
                          <button onClick={() => openPublicPage(t.slug)} className="flex items-center gap-1 text-xs font-semibold text-[#805d4e] hover:underline">
                            <Link2 size={14} /> /{t.slug}
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openTenantDashboard(t)} className="rounded-lg bg-[#f8f9fa] border border-[#e9ecef] px-2.5 py-1 text-xs font-semibold text-[#212529] hover:bg-[#e9ecef]">
                              Entrar
                            </button>
                            <button onClick={() => handleOpenEditModal(t)} className="rounded-lg p-2 text-[#6c757d] hover:bg-[#e9ecef]" title="Editar / Resetar Senha">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDeleteTenant(t.id, t.name)} className="rounded-lg p-2 text-[#d94e70] hover:bg-[#fde8ed]" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* MODAL COM CAMPO DE E-MAIL E SENHA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl my-auto">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <h2 className="font-display text-base font-bold">{editingTenant ? 'Editar Comércio' : 'Novo Comércio'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#495057]">Nome do Estabelecimento</label>
                <input required type="text" value={formName} onChange={(e) => { setFormName(e.target.value); if (!editingTenant) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Ex: Studio Elena Nails" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
              </div>

              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef] space-y-2">
                <p className="font-bold text-[#212529] flex items-center gap-1"><KeyRound size={14} /> Credenciais de Acesso do Cliente</p>
                <div>
                  <label className="block font-semibold text-[#495057]">E-mail de Acesso</label>
                  <input required type="email" value={formOwnerEmail} onChange={(e) => setFormOwnerEmail(e.target.value)} placeholder="proprietario@comercio.com" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none bg-white" />
                </div>
                <div>
                  <label className="block font-semibold text-[#495057]">
                    {editingTenant ? 'Nova Senha (deixe em branco se não quiser alterar)' : 'Definir Senha Inicial'}
                  </label>
                  <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#495057]">Link (Slug)</label>
                  <input required type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="studio-elena" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-[#495057]">Categoria</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none">
                    <option value="Barbearia">Barbearia</option>
                    <option value="Esmalteria / Nails">Esmalteria / Nails</option>
                    <option value="Estética">Estética</option>
                    <option value="Salão de Beleza">Salão de Beleza</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef]">
                <label className="block font-bold text-[#212529] mb-2 flex items-center gap-1">
                  <Palette size={14} className="text-[#805d4e]" /> Cor da Página do Cliente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormTheme('coffee')} className={`rounded-xl p-2.5 text-left border text-xs font-semibold flex items-center justify-between ${formTheme === 'coffee' ? 'border-2 border-[#242329] bg-white shadow-sm' : 'border-[#e9ecef] bg-[#f4f1eb]'}`}>
                    <span>🟤 Café</span>
                    {formTheme === 'coffee' && <CheckCircle2 size={14} className="text-[#242329]" />}
                  </button>
                  <button type="button" onClick={() => setFormTheme('dark')} className={`rounded-xl p-2.5 text-left border text-xs font-semibold flex items-center justify-between ${formTheme === 'dark' ? 'border-2 border-[#242329] bg-[#27272a] text-white shadow-sm' : 'border-[#e9ecef] bg-[#18181b] text-white'}`}>
                    <span>⬛ Dark</span>
                    {formTheme === 'dark' && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                  <button type="button" onClick={() => setFormTheme('blue')} className={`rounded-xl p-2.5 text-left border text-xs font-semibold flex items-center justify-between ${formTheme === 'blue' ? 'border-2 border-[#242329] bg-white shadow-sm' : 'border-[#e9ecef] bg-[#f0f4f8]'}`}>
                    <span>🔵 Azul</span>
                    {formTheme === 'blue' && <CheckCircle2 size={14} className="text-[#242329]" />}
                  </button>
                  <button type="button" onClick={() => setFormTheme('emerald')} className={`rounded-xl p-2.5 text-left border text-xs font-semibold flex items-center justify-between ${formTheme === 'emerald' ? 'border-2 border-[#242329] bg-white shadow-sm' : 'border-[#e9ecef] bg-[#f0fdf4]'}`}>
                    <span>🟢 Verde</span>
                    {formTheme === 'emerald' && <CheckCircle2 size={14} className="text-[#242329]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#495057]">WhatsApp (Com DDD)</label>
                <input required type="text" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="11999999999" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
              </div>

              <div>
                <label className="block font-semibold text-[#495057]">Bairro e Cidade</label>
                <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="São Paulo, SP - Jardins" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
              </div>

              <button type="submit" className="mt-4 w-full rounded-xl bg-[#242329] py-3 text-xs font-bold text-white shadow-md hover:bg-[#343a40]">
                {editingTenant ? 'Salvar Alterações' : 'Cadastrar Comércio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISÃO 2: DASHBOARD DO ESTABELECIMENTO ---
function TenantAdminView({ tenant, onBack, onLogout, notify, openPublicPage, isSuperAdmin }: { tenant: Tenant; onBack: () => void; onLogout: () => void; notify: (msg: string) => void; openPublicPage: (slug: string) => void; isSuperAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'professionals' | 'appointments'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('45');
  const [servicePrice, setServicePrice] = useState('80');

  const [showProfModal, setShowProfModal] = useState(false);
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState('Especialista');
  const [profPix, setProfPix] = useState('');

  const loadTenantDetails = async () => {
    const client = supabase;
    if (!client) return;
    const [{ data: s }, { data: p }, { data: a }] = await Promise.all([
      client.from('marco_services').select('*').eq('tenant_id', tenant.id),
      client.from('marco_professionals').select('*').eq('tenant_id', tenant.id),
      client.from('marco_appointments').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
    ]);
    if (s) setServices(s as Service[]);
    if (p) setProfessionals(p as Professional[]);
    if (a) setAppointments(a as Appointment[]);
  };

  useEffect(() => {
    void loadTenantDetails();
  }, [tenant]);

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const { error } = await client.from('marco_services').insert({
      tenant_id: tenant.id,
      name: serviceName,
      duration_minutes: parseInt(serviceDuration) || 30,
      price: parseFloat(servicePrice) || 0,
      active: true
    });

    if (!error) {
      notify('Serviço cadastrado com sucesso!');
      setShowServiceModal(false);
      setServiceName('');
      void loadTenantDetails();
    }
  };

  const handleSaveProf = async (e: FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const { error } = await client.from('marco_professionals').insert({
      tenant_id: tenant.id,
      name: profName,
      role: profRole,
      pix_key: profPix,
      active: true
    });

    if (!error) {
      notify('Profissional cadastrado com sucesso!');
      setShowProfModal(false);
      setProfName('');
      setProfPix('');
      void loadTenantDetails();
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Deseja excluir este serviço?')) return;
    const client = supabase;
    if (client) {
      await client.from('marco_services').delete().eq('id', id);
      notify('Serviço removido!');
      void loadTenantDetails();
    }
  };

  const handleDeleteProf = async (id: string) => {
    if (!confirm('Deseja excluir este profissional?')) return;
    const client = supabase;
    if (client) {
      await client.from('marco_professionals').delete().eq('id', id);
      notify('Profissional removido!');
      void loadTenantDetails();
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8f9fa]">
      <aside className="w-64 border-r border-[#e9ecef] bg-white p-6 hidden md:block">
        {isSuperAdmin && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#6c757d] hover:text-[#212529]">
            <ArrowLeft size={16} /> Voltar ao Super Admin
          </button>
        )}
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-[#212529]">{tenant.name}</h2>
          <span className="text-xs text-[#6c757d]">{tenant.category} · {tenant.city}</span>
        </div>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}>
            <BarChart3 size={18} /> Visão Geral
          </button>
          <button onClick={() => setActiveTab('appointments')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'appointments' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}>
            <CalendarDays size={18} /> Agendamentos
          </button>
          <button onClick={() => setActiveTab('services')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'services' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}>
            <WalletCards size={18} /> Serviços
          </button>
          <button onClick={() => setActiveTab('professionals')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'professionals' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}>
            <Users size={18} /> Profissionais
          </button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#d94e70] hover:bg-[#fde8ed] mt-6">
            <LogOut size={18} /> Sair
          </button>
        </nav>
      </aside>

      <div className="md:hidden border-b border-[#e9ecef] bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          {isSuperAdmin ? (
            <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-[#6c757d]">
              <ArrowLeft size={14} /> Voltar ao Super Admin
            </button>
          ) : <span className="font-bold text-sm">{tenant.name}</span>}
          <button onClick={onLogout} className="text-xs font-bold text-[#d94e70] flex items-center gap-1"><LogOut size={14} /> Sair</button>
        </div>
        <div className="grid grid-cols-4 gap-1 bg-[#f8f9fa] p-1 rounded-xl text-xs font-bold text-center">
          <button onClick={() => setActiveTab('dashboard')} className={`py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-[#242329] text-white' : 'text-[#666]'}`}>Geral</button>
          <button onClick={() => setActiveTab('appointments')} className={`py-2 rounded-lg ${activeTab === 'appointments' ? 'bg-[#242329] text-white' : 'text-[#666]'}`}>Agenda</button>
          <button onClick={() => setActiveTab('services')} className={`py-2 rounded-lg ${activeTab === 'services' ? 'bg-[#242329] text-white' : 'text-[#666]'}`}>Serviços</button>
          <button onClick={() => setActiveTab('professionals')} className={`py-2 rounded-lg ${activeTab === 'professionals' ? 'bg-[#242329] text-white' : 'text-[#666]'}`}>Equipe</button>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#805d4e]">PAINEL DO ESTABELECIMENTO</span>
            <h1 className="font-display text-xl md:text-2xl font-bold">{tenant.name}</h1>
          </div>
          <button onClick={() => openPublicPage(tenant.slug)} className="flex items-center gap-2 rounded-xl border border-[#e9ecef] bg-white px-3 py-2 text-xs font-bold text-[#212529] shadow-sm hover:bg-[#f8f9fa]">
            <ExternalLink size={14} /> Ver Página Pública
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#6c757d]">Total Agendamentos</span>
                <p className="mt-2 text-2xl font-bold">{appointments.length}</p>
              </div>
              <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#6c757d]">Serviços Ativos</span>
                <p className="mt-2 text-2xl font-bold">{services.length}</p>
              </div>
              <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
                <span className="text-xs font-semibold text-[#6c757d]">Profissionais</span>
                <p className="mt-2 text-2xl font-bold">{professionals.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold">Agendamentos Recebidos</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum agendamento realizado ainda.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-3 text-xs md:text-sm">
                    <div>
                      <p className="font-bold">{a.customer_name} ({a.customer_phone})</p>
                      <p className="text-[#6c757d]">Data: {a.appointment_date} às {a.appointment_time}</p>
                    </div>
                    <span className="rounded-lg bg-[#2e7d32]/10 px-2.5 py-1 text-xs font-bold text-[#2e7d32]">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Serviços Cadastrados</h2>
              <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#343a40]">
                <Plus size={16} /> Novo Serviço
              </button>
            </div>

            {services.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-3 text-xs md:text-sm">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-[#6c757d]">{s.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-[#805d4e]">R$ {s.price.toFixed(2)}</p>
                      <button onClick={() => handleDeleteService(s.id)} className="text-[#d94e70]"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Equipe de Profissionais</h2>
              <button onClick={() => setShowProfModal(true)} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#343a40]">
                <Plus size={16} /> Novo Profissional
              </button>
            </div>

            {professionals.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum profissional cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {professionals.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-3 text-xs md:text-sm">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-[#6c757d]">{p.role} {p.pix_key ? `· Pix: ${p.pix_key}` : ''}</p>
                    </div>
                    <button onClick={() => handleDeleteProf(p.id)} className="text-[#d94e70]"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Novo Serviço</h2>
              <button onClick={() => setShowServiceModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Nome do Serviço</label>
                <input required type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex: Esmaltação em Gel" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Duração (Minutos)</label>
                <input required type="number" value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} placeholder="45" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Preço (R$)</label>
                <input required type="number" step="0.01" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="90.00" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white">Cadastrar Serviço</button>
            </form>
          </div>
        </div>
      )}

      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Novo Profissional</h2>
              <button onClick={() => setShowProfModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Nome Completo</label>
                <input required type="text" value={profName} onChange={(e) => setProfName(e.target.value)} placeholder="Ex: Elena Rostova" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Cargo / Especialidade</label>
                <input required type="text" value={profRole} onChange={(e) => setProfRole(e.target.value)} placeholder="Ex: Designer de Unhas" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Chave Pix (Opcional)</label>
                <input type="text" value={profPix} onChange={(e) => setProfPix(e.target.value)} placeholder="CPF, Telefone ou E-mail" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" />
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white">Cadastrar Profissional</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISÃO 3: PÁGINA PÚBLICA DE AGENDAMENTO ---
function BookingPage({ slug, onBack, notify }: { slug: string; onBack: () => void; notify: (msg: string) => void }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [date, setDate] = useState('28');
  const [time, setTime] = useState('10:30');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'local'>('local');
  const [pixCopied, setPixCopied] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<string[]>([]);

  const dates = [
    { day: 'Hoje', date: '28', fullDate: '2026-10-28', weekday: 'QUA' },
    { day: 'Amanhã', date: '29', fullDate: '2026-10-29', weekday: 'QUI' },
    { day: 'Sexta', date: '30', fullDate: '2026-10-30', weekday: 'SEX' },
  ];
  
  const allTimes = ['09:00', '09:45', '10:30', '11:15', '13:30', '14:15', '15:00', '16:30'];

  useEffect(() => {
    const loadTenantData = async () => {
      const client = supabase;
      if (!client) { setLoading(false); return; }

      const { data: t } = await client.from('marco_tenants').select('*').eq('slug', slug).single();
      if (t) {
        setTenant(t as Tenant);
        const [{ data: s }, { data: p }] = await Promise.all([
          client.from('marco_services').select('*').eq('tenant_id', t.id).eq('active', true),
          client.from('marco_professionals').select('*').eq('tenant_id', t.id).eq('active', true),
        ]);
        if (s) setServices(s as Service[]);
        if (p) {
          setProfessionals(p as Professional[]);
          if (p.length > 0) setSelectedProfessional(p[0]);
        }
      }
      setLoading(false);
    };
    void loadTenantData();
  }, [slug]);

  useEffect(() => {
    if (!tenant || !selectedProfessional) return;
    const selectedDateObj = dates.find(d => d.date === date);
    const fullDateStr = selectedDateObj ? selectedDateObj.fullDate : `2026-10-${date}`;

    const loadOccupiedTimes = async () => {
      const client = supabase;
      if (!client) return;
      const { data } = await client
        .from('marco_appointments')
        .select('appointment_time')
        .eq('tenant_id', tenant.id)
        .eq('professional_id', selectedProfessional.id)
        .eq('appointment_date', fullDateStr)
        .neq('status', 'cancelled');

      if (data) {
        setBookedAppointments(data.map((a: any) => a.appointment_time));
      }
    };
    void loadOccupiedTimes();
  }, [tenant, selectedProfessional, date]);

  const times = allTimes.filter(t => !bookedAppointments.includes(t));

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-[#888]">Carregando agendamento...</div>;
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 text-center">
        <h1 className="font-display text-4xl font-bold text-[#212529]">404</h1>
        <p className="mt-2 text-sm text-[#6c757d]">O comércio <span className="font-bold">/{slug}</span> não foi encontrado.</p>
        <button onClick={onBack} className="mt-6 rounded-xl bg-[#242329] px-6 py-3 text-sm font-bold text-white">
          Voltar para a página inicial
        </button>
      </div>
    );
  }

  const themeStyle = THEME_STYLES[tenant.theme || 'coffee'] || THEME_STYLES.coffee;
  const pixKey = selectedProfessional?.pix_key || tenant.pix_key || '';
  const servicePrice = selectedService?.price ?? 0;

  const copyPix = () => {
    if (!pixKey) { notify('Este comércio ainda não cadastrou uma chave Pix'); return; }
    navigator.clipboard?.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2200);
  };

  const downloadIcsFile = () => {
    if (!selectedService) return;
    const [startH, startM] = time.split(':').map(Number);
    const duration = selectedService.duration_minutes || 45;
    const endMins = startH * 60 + startM + duration;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const gStart = `202610${date}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const gEnd = `202610${date}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Marco Agendamentos//PT
BEGIN:VEVENT
SUMMARY:${selectedService.name} - ${tenant.name}
DESCRIPTION:Cliente: ${name}\\nProfissional: ${selectedProfessional?.name}\\nContato: ${phone}
LOCATION:${tenant.city || 'São Paulo, SP'}
DTSTART:${gStart}
DTEND:${gEnd}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agendamento-${date}-outubro.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openGoogleCalendar = () => {
    if (!selectedService) return;
    const [startH, startM] = time.split(':').map(Number);
    const duration = selectedService.duration_minutes || 45;
    const endMins = startH * 60 + startM + duration;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const gStart = `202610${date}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const gEnd = `202610${date}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    const title = encodeURIComponent(`${selectedService.name} - ${tenant.name}`);
    const details = encodeURIComponent(`Cliente: ${name}\nProfissional: ${selectedProfessional?.name}`);
    
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gStart}/${gEnd}&details=${details}`, '_blank');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !phone || !selectedService) return;
    const client = supabase;
    
    const selectedDateObj = dates.find(d => d.date === date);
    const fullDateStr = selectedDateObj ? selectedDateObj.fullDate : `2026-10-${date}`;

    if (client && tenant.id !== fallbackTenant.id) {
      const { error } = await client.from('marco_appointments').insert({
        tenant_id: tenant.id,
        service_id: selectedService.id,
        professional_id: selectedProfessional?.id ?? null,
        customer_name: name,
        customer_phone: phone,
        appointment_date: fullDateStr,
        appointment_time: time,
        status: 'confirmed',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'pix' ? 'pending' : 'local'
      });
      if (error) notify('Não foi possível salvar agora, mas você ainda pode enviar a mensagem');
    }

    const pixLine = paymentMethod === 'pix' && pixKey ? `\n*Pagamento:* Pix (chave: ${pixKey})` : '\n*Pagamento:* No local';
    
    const message = `Olá, ${tenant.name}! Gostaria de confirmar meu agendamento.\n\n` +
      `*Cliente:* ${name}\n` +
      `*Serviço:* ${selectedService.name}\n` +
      `*Profissional:* ${selectedProfessional?.name ?? 'Não especificado'}\n` +
      `*Data:* ${date} de outubro às ${time}\n` +
      `*Valor:* R$ ${servicePrice.toFixed(2)}${pixLine}`;

    window.open(`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setStep(4);
  };

  return (
    <div className="min-h-screen pb-12 transition-colors" style={{ backgroundColor: themeStyle.bg, color: themeStyle.textPrimary }}>
      <header className="flex items-center justify-between border-b border-black/10 px-5 py-4" style={{ backgroundColor: themeStyle.cardBg }}>
        <button onClick={onBack} className="text-xs font-semibold opacity-70 hover:opacity-100">← Voltar</button>
        <span className="font-display font-bold">{tenant.name}</span>
        <span className="text-xs opacity-60">{tenant.category}</span>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-6">
        {step < 4 && (
          <div className="mb-6 flex justify-between border-b border-black/10 pb-3 text-xs">
            <span className={step === 1 ? 'font-bold' : 'opacity-50'} style={{ color: step === 1 ? themeStyle.accent : undefined }}>1. Serviço</span>
            <span className={step === 2 ? 'font-bold' : 'opacity-50'} style={{ color: step === 2 ? themeStyle.accent : undefined }}>2. Data e Profissional</span>
            <span className={step === 3 ? 'font-bold' : 'opacity-50'} style={{ color: step === 3 ? themeStyle.accent : undefined }}>3. Pagamento e Dados</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Escolha o serviço</h2>
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => { setSelectedService(s); setStep(2); }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-black/10 p-4 transition-all hover:scale-[1.01]"
                style={{ backgroundColor: themeStyle.cardBg }}
              >
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs opacity-60">{s.duration_minutes} min</p>
                </div>
                <p className="font-bold" style={{ color: themeStyle.accent }}>R$ {s.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase opacity-60">Profissional</h3>
              <div className="grid grid-cols-2 gap-2">
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProfessional(p)}
                    className="rounded-xl border p-3 text-left text-xs transition-all"
                    style={{
                      backgroundColor: selectedProfessional?.id === p.id ? themeStyle.buttonBg : themeStyle.cardBg,
                      color: selectedProfessional?.id === p.id ? '#ffffff' : themeStyle.textPrimary,
                      borderColor: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <p className="font-bold">{p.name}</p>
                    <p className="opacity-80">{p.role}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase opacity-60">Data</h3>
              <div className="grid grid-cols-3 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setDate(d.date)}
                    className="rounded-xl border p-3 text-center text-xs transition-all"
                    style={{
                      backgroundColor: date === d.date ? themeStyle.buttonBg : themeStyle.cardBg,
                      color: date === d.date ? '#ffffff' : themeStyle.textPrimary,
                      borderColor: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    <p className="font-bold">{d.day}</p>
                    <p className="opacity-80">{d.date} Out ({d.weekday})</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase opacity-60">Horários Disponíveis</h3>
              {times.length === 0 ? (
                <p className="text-xs text-[#d94e70] p-2 rounded-xl border border-black/10" style={{ backgroundColor: themeStyle.cardBg }}>Nenhum horário disponível para este profissional nesta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className="rounded-xl border p-2 text-center text-xs transition-all"
                      style={{
                        backgroundColor: time === t ? themeStyle.buttonBg : themeStyle.cardBg,
                        color: time === t ? '#ffffff' : themeStyle.textPrimary,
                        borderColor: 'rgba(0,0,0,0.1)'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(3)}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeStyle.buttonBg }}
            >
              Avançar para confirmação →
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-2xl border border-black/10 p-4 text-xs space-y-1" style={{ backgroundColor: themeStyle.cardBg }}>
              <p className="font-bold text-sm">{selectedService?.name}</p>
              <p className="opacity-70">Com {selectedProfessional?.name} em {date} de outubro às {time}</p>
              <p className="font-bold text-sm pt-1" style={{ color: themeStyle.accent }}>R$ {servicePrice.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold opacity-80">
                Forma de Pagamento
                <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 p-3 text-xs outline-none text-[#212529]">
                  <option value="local">Pagar no local</option>
                  <option value="pix">Pagar agora via Pix</option>
                </select>
              </label>

              {paymentMethod === 'pix' && (
                <div className="rounded-xl border border-black/10 p-3 text-xs space-y-2" style={{ backgroundColor: themeStyle.cardBg }}>
                  <p className="font-bold">Chave Pix para pagamento:</p>
                  <p className="bg-black/5 p-2 rounded-lg font-mono text-center select-all">{pixKey || 'Chave não cadastrada'}</p>
                  <button type="button" onClick={copyPix} className="w-full rounded-lg bg-[#242329] py-2 text-white font-semibold">
                    {pixCopied ? 'Chave copiada! ✓' : 'Copiar chave Pix'}
                  </button>
                </div>
              )}

              <label className="block text-xs font-bold opacity-80">
                Seu Nome Completo
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite seu nome" className="mt-1 w-full rounded-xl border border-black/10 p-3 text-xs outline-none text-[#212529]" />
              </label>

              <label className="block text-xs font-bold opacity-80">
                Seu WhatsApp
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1 w-full rounded-xl border border-black/10 p-3 text-xs outline-none text-[#212529]" />
              </label>
            </div>

            <button type="submit" className="w-full rounded-xl bg-[#2e7d32] py-3.5 text-sm font-bold text-white shadow-lg">
              Confirmar pelo WhatsApp →
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-black/10 p-6 text-center space-y-4" style={{ backgroundColor: themeStyle.cardBg }}>
            <div className="text-4xl">🎉</div>
            <h2 className="font-display text-xl font-bold">Agendamento Solicitado!</h2>
            <p className="text-xs opacity-70">Você foi redirecionado para o WhatsApp da {tenant.name}.</p>
            
            <div className="pt-2 space-y-2 border-t border-black/10">
              <p className="text-xs font-bold opacity-80 pt-2">Adicione este compromisso à sua agenda:</p>

              <button
                type="button"
                onClick={downloadIcsFile}
                className="w-full rounded-xl bg-[#007aff] py-3 text-xs font-bold text-white shadow-sm hover:opacity-90 flex items-center justify-center gap-2"
              >
                 Adicionar ao iPhone / Apple Calendar
              </button>

              <button
                type="button"
                onClick={openGoogleCalendar}
                className="w-full rounded-xl bg-[#4285f4] py-3 text-xs font-bold text-white shadow-sm hover:opacity-90 flex items-center justify-center gap-2"
              >
                🤖 Adicionar ao Google Agenda / Android
              </button>
            </div>

            <button onClick={() => setStep(1)} className="text-xs underline font-semibold pt-2 block mx-auto opacity-80" style={{ color: themeStyle.accent }}>
              Fazer novo agendamento
            </button>
          </div>
        )}
      </main>
    </div>
  );
}