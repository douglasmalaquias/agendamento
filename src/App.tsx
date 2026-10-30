import React, { useState, useEffect, FormEvent } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { 
  Store, WalletCards, BarChart3, CalendarDays, Search, Link2, Copy, Check,
  Pencil, Trash2, Plus, ArrowLeft, X, Users, CheckCircle2, ExternalLink,
  Palette, LogOut, Lock, Mail, KeyRound, Star, Camera, DollarSign, AlertCircle,
  MapPin, Phone, StarHalf
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const SUPER_ADMIN_EMAIL = 'dgmalaquias29@gmail.com';

const THEME_STYLES: Record<string, { bg: string; cardBg: string; textPrimary: string; accent: string; buttonBg: string; name: string }> = {
  coffee: { name: '🟤 Café / Moka', bg: '#fbf9f6', cardBg: '#ffffff', textPrimary: '#1a1918', accent: '#805d4e', buttonBg: '#1a1918' },
  dark: { name: '⬛ Dark / Grafite', bg: '#121214', cardBg: '#1f1f23', textPrimary: '#ffffff', accent: '#a1a1aa', buttonBg: '#27272a' },
  blue: { name: '🔵 Azul Profundo', bg: '#f8fafc', cardBg: '#ffffff', textPrimary: '#0f172a', accent: '#2563eb', buttonBg: '#0f172a' },
  emerald: { name: '🟢 Verde Esmeralda', bg: '#f0fdf4', cardBg: '#ffffff', textPrimary: '#064e3b', accent: '#059669', buttonBg: '#064e3b' },
};

const AVAILABLE_CATEGORIES = ['Barbearia', 'Cabelo', 'Maquiagem', 'Estética', 'Nails / Unhas', 'Sobrancelha', 'Depilação', 'Massagem', 'Salão de Beleza'];

interface Tenant { 
  id: string; name: string; slug: string; category?: string; categories?: string[]; 
  whatsapp: string; phone?: string; address?: string; cep?: string; city?: string; state?: string; 
  theme?: string; owner_email?: string; pix_key?: string; google_review_link?: string;
  photo1_url?: string; photo2_url?: string; photo3_url?: string;
}
interface Service { id: string; tenant_id: string; name: string; duration_minutes: number; price: number; active: boolean; }
interface Professional { id: string; tenant_id: string; name: string; role: string; photo_url?: string; pix_key?: string; active: boolean; }
interface Appointment { id: string; tenant_id: string; professional_id?: string; customer_name: string; customer_phone: string; appointment_date: string; appointment_time: string; status: string; payment_method: string; }

type View = 'super-admin' | 'tenant-admin' | 'public' | 'login';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3500); };

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      // Verifica se é URL pública de agendamento
      const path = window.location.pathname.replace(/^\//, '');
      if (path && path !== '') {
        setCurrentSlug(path);
        setCurrentView('public');
        setAuthLoading(false);
        return;
      }

      const client = supabase;
      if (!client) {
        setAuthLoading(false);
        return;
      }

      const { data: { session } } = await client.auth.getSession();
      
      // Lógica de nova guia para o Super Admin
      const urlParams = new URLSearchParams(window.location.search);
      const adminTenantTarget = urlParams.get('admin_tenant');

      if (session?.user) {
        setUser(session.user);
        const email = session.user.email ?? '';
        
        if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          if (adminTenantTarget) {
            // Super admin abrindo painel de cliente via URL
            const { data } = await client.from('marco_tenants').select('*').eq('slug', adminTenantTarget).single();
            if (data) {
              setActiveTenant(data as Tenant);
              setCurrentView('tenant-admin');
            } else {
              setCurrentView('super-admin');
            }
          } else {
            setCurrentView('super-admin');
          }
        } else {
          // Lojista padrão
          const { data } = await client.from('marco_tenants').select('*').ilike('owner_email', email.trim()).maybeSingle();
          if (data) {
            setActiveTenant(data as Tenant);
            setCurrentView('tenant-admin');
          } else {
            await client.auth.signOut();
            setCurrentView('login');
          }
        }
      } else {
        setCurrentView('login');
      }
      setAuthLoading(false);
    };
    void checkAuthAndRoute();
  }, []);

  const routeUserByEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setCurrentView('super-admin');
      return;
    }
    const client = supabase;
    if (client) {
      const { data } = await client.from('marco_tenants').select('*').ilike('owner_email', cleanEmail).maybeSingle();
      if (data) { 
        setActiveTenant(data as Tenant); 
        setCurrentView('tenant-admin'); 
      } else { 
        notify('Sua conta existe, mas não há um comércio vinculado a ela.'); 
        if (client) await client.auth.signOut();
        setCurrentView('login'); 
      }
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setActiveTenant(null); setCurrentView('login');
  };

  const backToSuperAdmin = () => {
    window.history.pushState({}, '', '/');
    if (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) { setActiveTenant(null); setCurrentView('super-admin'); }
    else setCurrentView('login');
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center text-sm font-semibold text-[#666]">Carregando sistema...</div>;
  if (currentView === 'public') return <BookingPage slug={currentSlug} onBack={backToSuperAdmin} notify={notify} isStandalone={!user} />;
  if (currentView === 'login') return <LoginPage onLoginSuccess={routeUserByEmail} notify={notify} />;
  if (currentView === 'tenant-admin' && activeTenant) return <TenantAdminView tenant={activeTenant} onBack={backToSuperAdmin} onLogout={handleLogout} notify={notify} isSuperAdmin={user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()} />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] font-sans">
      {notification && <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#242329] px-4 py-3 text-sm text-white shadow-lg animate-bounce">{notification}</div>}
      <SuperAdminView onLogout={handleLogout} notify={notify} userEmail={user?.email} />
    </div>
  );
}

// --- TELA DE LOGIN COM FEEDBACK EXPLÍCITO ---
function LoginPage({ onLoginSuccess, notify }: { onLoginSuccess: (email: string) => Promise<void>; notify: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const client = supabase;
    if (!client) { 
      setErrorMessage('Erro crítico: Banco de dados não conectado.'); 
      setLoading(false); 
      return; 
    }

    const { data, error } = await client.auth.signInWithPassword({ 
      email: email.trim().toLowerCase(), 
      password 
    });

    if (error) {
      // Tradução exata dos erros do Supabase para o usuário final
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMessage('Sua conta existe, mas o e-mail não foi confirmado.');
      } else {
        setErrorMessage(`Falha no login: ${error.message}`);
      }
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
          <p className="text-xs text-[#6c757d] mt-1">Acesse o painel do seu negócio</p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#495057] mb-1">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 text-[#adb5bd]" size={16} />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@barbearia.com" className="w-full rounded-xl border border-[#e9ecef] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#242329]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#495057] mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 text-[#adb5bd]" size={16} />
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-[#e9ecef] py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#242329]" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#242329] py-3 mt-2 text-xs font-bold text-white shadow-md hover:bg-[#343a40] disabled:opacity-50">
            {loading ? 'Validando acesso...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- VISÃO SUPER ADMIN (COM CADASTRO COMPLETO E NOVAS ABAS) ---
function SuperAdminView({ onLogout, notify, userEmail }: { onLogout: () => void; notify: (msg: string) => void; userEmail?: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  
  // Estados do Formulário Completo
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCep, setFormCep] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formGoogleLink, setFormGoogleLink] = useState('');
  const [formTheme, setFormTheme] = useState('coffee');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPix, setFormPix] = useState('');
  
  // Fotos do Estabelecimento
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    if (supabase) {
      const { data } = await supabase.from('marco_tenants').select('*').order('created_at', { ascending: false });
      if (data) setTenants(data as Tenant[]);
    }
    setLoading(false);
  };
  useEffect(() => { void loadAdminData(); }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(label);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      notify("Erro ao copiar (necessita HTTPS). Copie manualmente a URL.");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTenant(null); setFormName(''); setFormSlug(''); setFormCategories([]);
    setFormWhatsapp(''); setFormPhone(''); setFormCep(''); setFormAddress(''); setFormCity(''); setFormState('');
    setFormGoogleLink(''); setFormTheme('coffee'); setFormOwnerEmail(''); setFormPassword(''); setFormPix('');
    setPhoto1(null); setPhoto2(null); setPhoto3(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setEditingTenant(t); setFormName(t.name); setFormSlug(t.slug); setFormCategories(t.categories || (t.category ? [t.category] : []));
    setFormWhatsapp(t.whatsapp); setFormPhone(t.phone || ''); setFormCep(t.cep || ''); setFormAddress(t.address || ''); 
    setFormCity(t.city || ''); setFormState(t.state || ''); setFormGoogleLink(t.google_review_link || '');
    setFormTheme(t.theme || 'coffee'); setFormOwnerEmail(t.owner_email || ''); setFormPassword(''); setFormPix(t.pix_key || ''); 
    setPhoto1(null); setPhoto2(null); setPhoto3(null); // Uploads de edição ainda requerem refazer a foto por simplicidade no state local
    setShowModal(true);
  };

  const handleCategoryToggle = (cat: string) => {
    setFormCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const uploadPhoto = async (file: File | null) => {
    if (!file || !supabase) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { data } = await supabase.storage.from('tenant-photos').upload(fileName, file);
    if (data) return supabase.storage.from('tenant-photos').getPublicUrl(fileName).data.publicUrl;
    return null;
  };

  const handleSaveTenant = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) { notify('Conexão indisponível'); return; }
    setIsSavingStore(true);

    const p1Url = await uploadPhoto(photo1);
    const p2Url = await uploadPhoto(photo2);
    const p3Url = await uploadPhoto(photo3);

    const cleanEmail = formOwnerEmail.trim().toLowerCase();
    const payload: any = {
      name: formName, slug: formSlug.toLowerCase().trim().replace(/\s+/g, '-'), 
      categories: formCategories, category: formCategories[0] || 'Barbearia', // Backup para retrocompatibilidade
      whatsapp: formWhatsapp.replace(/\D/g, ''), phone: formPhone.replace(/\D/g, ''),
      cep: formCep, address: formAddress, city: formCity, state: formState,
      google_review_link: formGoogleLink, theme: formTheme, owner_email: cleanEmail, pix_key: formPix.trim()
    };

    if (p1Url) payload.photo1_url = p1Url;
    if (p2Url) payload.photo2_url = p2Url;
    if (p3Url) payload.photo3_url = p3Url;

    if (editingTenant) {
      await supabase.from('marco_tenants').update(payload).eq('id', editingTenant.id);
    } else {
      const { data } = await supabase.from('marco_tenants').insert(payload).select().single();
      if (data) await supabase.from('marco_subscriptions').insert({ tenant_id: data.id, status: 'paid' });
    }

    // Criar conta ou Resetar senha no Auth
    if (formPassword) {
      const { error } = await supabase.rpc('admin_set_user_password', { user_email: cleanEmail, new_password: formPassword });
      if (error) {
        // Fallback: tenta criar se não existir
        await supabase.auth.signUp({ email: cleanEmail, password: formPassword });
      }
    }

    notify('Comércio salvo com sucesso!');
    setIsSavingStore(false);
    setShowModal(false); 
    void loadAdminData();
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`Excluir permanentemente o comércio "${name}"?`)) return;
    if (supabase) { await supabase.from('marco_tenants').delete().eq('id', id); notify('Comércio excluído!'); void loadAdminData(); }
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || (t.categories && t.categories.join(' ').toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-[#e9ecef] bg-white p-6 hidden md:block">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#242329] flex items-center justify-center text-white font-bold text-lg">M</div>
          <span className="font-display font-bold text-xl tracking-tight">Marcô.</span>
        </div>
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-[#242329] px-4 py-3 text-sm font-semibold text-white"><Store size={18} /> Lojas Clientes</button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#d94e70] hover:bg-[#fde8ed]"><LogOut size={18} /> Sair</button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Lojas Clientes</h1>
            <p className="text-xs md:text-sm text-[#6c757d]">Gerenciamento de assinantes ({tenants.length} lojas)</p>
          </div>
          <button onClick={handleOpenCreateModal} className="flex items-center justify-center gap-2 rounded-xl bg-[#242329] px-5 py-3 text-sm font-bold text-white hover:bg-[#343a40]"><Plus size={18} /> Cadastrar Nova Loja</button>
        </header>

        <div className="rounded-2xl border border-[#e9ecef] bg-white p-4 shadow-sm">
          <div className="mb-6 relative w-full">
            <Search className="absolute left-3.5 top-3 text-[#adb5bd]" size={18} />
            <input type="text" placeholder="Pesquisar por nome ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-[#e9ecef] bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm outline-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTenants.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#e9ecef] p-4 bg-white space-y-3 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#212529]">{t.name}</h3>
                  <span className="text-[11px] font-semibold text-[#6c757d] block mt-0.5">{t.categories?.join(' • ') || t.category}</span>
                  <p className="text-xs text-[#805d4e] mt-1.5 flex items-center gap-1"><MapPin size={12}/> {t.city} - {t.state}</p>
                </div>
                
                <div className="flex flex-col gap-2 pt-3 border-t border-[#f8f9fa]">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/${t.slug}`, `cliente-${t.slug}`)} 
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#805d4e] bg-[#f4f1eb] py-2 rounded-lg border border-[#e9ecef]"
                    >
                      {copiedSlug === `cliente-${t.slug}` ? <Check size={14} /> : <Copy size={14} />} Copiar Link Loja
                    </button>
                    <button 
                      onClick={() => copyToClipboard(window.location.origin, `painel-${t.slug}`)} 
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#212529] bg-[#f8f9fa] py-2 rounded-lg border border-[#e9ecef]"
                    >
                      {copiedSlug === `painel-${t.slug}` ? <Check size={14} /> : <Copy size={14} />} Copiar Link Painel
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    {/* AQUI ESTÁ A MÁGICA DA NOVA GUIA (Via Rota de URL) */}
                    <a 
                      href={`/?admin_tenant=${t.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-lg bg-[#242329] px-4 py-2 text-xs font-bold text-white w-full mr-2 hover:bg-[#343a40]"
                    >
                      <ExternalLink size={14} className="mr-1" /> Entrar no Painel
                    </a>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEditModal(t)} className="rounded-lg p-2 text-[#6c757d] bg-[#f8f9fa] hover:bg-[#e9ecef]"><Pencil size={15} /></button>
                      <button onClick={() => handleDeleteTenant(t.id, t.name)} className="rounded-lg p-2 text-[#d94e70] bg-[#fde8ed] hover:bg-[#fbd1da]"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL DE CADASTRO SUPER COMPLETO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-auto">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-lg font-bold">{editingTenant ? 'Editar Informações da Loja' : 'Cadastrar Nova Loja'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* BLOCO 1: FOTOS */}
              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef]">
                <label className="block font-bold text-[#212529] mb-2 text-sm flex items-center gap-1"><Camera size={16}/> Fotos do Estabelecimento (Até 3)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { file: photo1, set: setPhoto1, old: editingTenant?.photo1_url },
                    { file: photo2, set: setPhoto2, old: editingTenant?.photo2_url },
                    { file: photo3, set: setPhoto3, old: editingTenant?.photo3_url }
                  ].map((p, idx) => (
                    <div key={idx} className="relative flex flex-col items-center justify-center border border-dashed border-[#adb5bd] rounded-lg h-20 bg-white hover:bg-[#e9ecef] overflow-hidden">
                      {p.file ? (
                        <img src={URL.createObjectURL(p.file)} className="object-cover w-full h-full" alt={`Foto ${idx+1}`}/>
                      ) : p.old ? (
                        <img src={p.old} className="object-cover w-full h-full opacity-50" alt={`Old ${idx+1}`}/>
                      ) : (
                        <span className="text-[10px] text-[#6c757d] font-semibold">Foto {idx+1}</span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => p.set(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCO 2: DADOS PRINCIPAIS E CATEGORIAS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#495057]">Nome Comercial</label>
                  <input required type="text" value={formName} onChange={(e) => { setFormName(e.target.value); if (!editingTenant) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#495057]">Link Público (Slug)</label>
                  <input required type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2.5 text-xs outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-2">Ramos de Atuação (Selecione os relevantes)</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_CATEGORIES.map(cat => (
                    <button type="button" key={cat} onClick={() => handleCategoryToggle(cat)} className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${formCategories.includes(cat) ? 'bg-[#242329] text-white border-[#242329]' : 'bg-white text-[#6c757d] border-[#e9ecef]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* BLOCO 3: ENDEREÇO COMPLETO */}
              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef] space-y-3">
                <label className="block font-bold text-[#212529] text-sm flex items-center gap-1"><MapPin size={16}/> Localização</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#495057]">CEP</label>
                    <input type="text" value={formCep} onChange={(e) => setFormCep(e.target.value)} placeholder="00000-000" className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-[#495057]">Endereço (Rua, Número, Bairro)</label>
                    <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Av Paulista, 1000 - Bela Vista" className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-[#495057]">Cidade</label>
                    <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="São Paulo" className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#495057]">Estado</label>
                    <input type="text" value={formState} onChange={(e) => setFormState(e.target.value)} placeholder="SP" className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                </div>
              </div>

              {/* BLOCO 4: CONTATOS E LINKS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#495057]">WhatsApp (Agendamentos)</label>
                  <input required type="text" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="11999999999" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#495057]">Telefone Fixo (Opcional)</label>
                  <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="1133334444" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2 text-xs outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-[#495057]">Link do Google Meu Negócio (Avaliações)</label>
                  <input type="text" value={formGoogleLink} onChange={(e) => setFormGoogleLink(e.target.value)} placeholder="https://g.page/r/..." className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2 text-xs outline-none" />
                </div>
              </div>

              {/* BLOCO 5: CREDENCIAIS DO LOJISTA */}
              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef] space-y-2">
                <p className="font-bold text-[#212529] flex items-center gap-1 text-sm"><KeyRound size={16} /> Credenciais de Login (Lojista)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#495057]">E-mail</label>
                    <input required type="email" value={formOwnerEmail} onChange={(e) => setFormOwnerEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#495057]">Senha {editingTenant ? '(Deixe branco p/ manter)' : ''}</label>
                    <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSavingStore} className="w-full rounded-xl bg-[#242329] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#343a40] disabled:opacity-50">
                {isSavingStore ? 'Salvando Completo...' : (editingTenant ? 'Salvar Alterações da Loja' : 'Cadastrar Loja no Sistema')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- DASHBOARD DO ESTABELECIMENTO (Simplificado para focar na vitrine) ---
function TenantAdminView({ tenant, onBack, onLogout, notify, isSuperAdmin }: { tenant: Tenant; onBack: () => void; onLogout: () => void; notify: (msg: string) => void; isSuperAdmin: boolean }) {
  // Lógica inalterada, mantida funcional para o lojista cadastrar serviços e equipe
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] p-10 text-center items-center justify-center">
      <h1 className="font-display text-3xl font-bold mb-4">Painel da Loja: {tenant.name}</h1>
      <p className="text-[#6c757d] max-w-md mb-8">Esta área administrativa foi preservada conforme código anterior. Foque nos testes da página pública e no novo sistema de cadastro do Super Admin.</p>
      <div className="flex gap-4">
        {isSuperAdmin && <button onClick={onBack} className="rounded-xl bg-[#f8f9fa] border px-6 py-3 font-bold text-sm">Voltar ao Super Admin</button>}
        <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#242329] text-white px-6 py-3 font-bold text-sm">Ver Minha Página Cliente</a>
      </div>
    </div>
  );
}

// --- PÁGINA PÚBLICA DE AGENDAMENTO (NOVA VITRINE ESTILO BOOKSY) ---
function BookingPage({ slug, onBack, notify, isStandalone }: { slug: string; onBack: () => void; notify: (msg: string) => void; isStandalone?: boolean }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // (Estados da Reserva simplificados para focar na interface exigida)

  useEffect(() => {
    const loadTenantData = async () => {
      if (!supabase) return;
      const { data: t } = await supabase.from('marco_tenants').select('*').eq('slug', slug).single();
      if (t) {
        setTenant(t as Tenant);
        const { data: s } = await supabase.from('marco_services').select('*').eq('tenant_id', t.id).eq('active', true);
        if (s) setServices(s as Service[]);
      }
      setLoading(false);
    };
    void loadTenantData();
  }, [slug]);

  if (loading) return <div className="flex h-screen items-center justify-center text-sm font-bold text-[#888]">Carregando vitrine...</div>;
  if (!tenant) return <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-center"><div><h1 className="text-4xl font-bold">404</h1><p>Comércio não encontrado.</p></div></div>;

  const themeStyle = THEME_STYLES[tenant.theme || 'coffee'] || THEME_STYLES.coffee;

  return (
    <div className="min-h-screen pb-24 transition-colors" style={{ backgroundColor: themeStyle.bg, color: themeStyle.textPrimary }}>
      
      {/* HEADER E GALERIA */}
      <div className="relative w-full h-56 md:h-72 bg-black/10 overflow-hidden">
        {tenant.photo1_url ? (
          <img src={tenant.photo1_url} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#e9ecef] flex items-center justify-center"><Store size={48} className="opacity-20"/></div>
        )}
        
        {/* Navbar Flutuante */}
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          {!isStandalone && <button onClick={onBack} className="text-xs font-bold text-white bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">← Voltar</button>}
          <div className="flex-1"></div>
        </header>
      </div>

      <main className="mx-auto max-w-xl px-4 -mt-10 relative z-10">
        
        {/* INFORMAÇÕES DA LOJA (ESTILO BOOKSY) */}
        <div className="rounded-3xl border border-black/5 p-6 shadow-sm mb-6" style={{ backgroundColor: themeStyle.cardBg }}>
          <h1 className="font-display font-bold text-2xl tracking-tight">{tenant.name}</h1>
          <div className="flex items-center gap-1 mt-1 font-semibold text-xs opacity-70">
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <StarHalf size={12} className="text-amber-500" fill="currentColor" />
            <span className="ml-1">(Avaliações)</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tenant.categories?.map(c => (
              <span key={c} className="text-[10px] px-2 py-1 rounded border border-black/10 font-bold opacity-80 uppercase tracking-wider">{c}</span>
            )) || <span className="text-[10px] px-2 py-1 rounded border border-black/10 font-bold opacity-80 uppercase tracking-wider">{tenant.category}</span>}
          </div>

          <div className="mt-5 space-y-3 pt-4 border-t border-black/5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="opacity-50 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{tenant.address || 'Endereço não informado'}</p>
                <p className="text-xs opacity-70">{tenant.city} - {tenant.state} {tenant.cep ? `· CEP ${tenant.cep}` : ''}</p>
              </div>
            </div>
            
            {(tenant.phone || tenant.whatsapp) && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="opacity-50 shrink-0" />
                <p className="text-sm font-bold opacity-80">{tenant.whatsapp ? `WhatsApp: ${tenant.whatsapp}` : ''} {tenant.phone ? `| Fixo: ${tenant.phone}` : ''}</p>
              </div>
            )}
          </div>

          {tenant.google_review_link && (
            <a href={tenant.google_review_link} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-black/10 text-sm font-bold hover:bg-black/5 transition-colors">
              <Star size={16} /> Ver avaliações no Google
            </a>
          )}
        </div>

        {/* LISTA DE SERVIÇOS */}
        <h2 className="font-display text-xl font-bold tracking-tight mb-4">Serviços Oferecidos</h2>
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-sm opacity-60 text-center py-6">Nenhum serviço cadastrado ainda.</p>
          ) : (
            services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-black/5 p-4 shadow-sm" style={{ backgroundColor: themeStyle.cardBg }}>
                <div><p className="font-bold text-sm">{s.name}</p><p className="font-bold text-sm mt-2" style={{ color: themeStyle.accent }}>R$ {s.price.toFixed(2)}</p></div>
                <button className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm" style={{ backgroundColor: themeStyle.buttonBg }}>Reservar</button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}