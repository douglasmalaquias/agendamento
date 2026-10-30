import React, { useState, useEffect, FormEvent } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { 
  Store, WalletCards, BarChart3, CalendarDays, Search, Link2, Copy, Check,
  Pencil, Trash2, Plus, ArrowLeft, X, Users, CheckCircle2, ExternalLink,
  Palette, LogOut, Lock, Mail, KeyRound, Star, Camera, DollarSign, AlertCircle,
  MapPin, Phone, StarHalf
} from 'lucide-react';

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
      
      const urlParams = new URLSearchParams(window.location.search);
      const adminTenantTarget = urlParams.get('admin_tenant');

      if (session?.user) {
        setUser(session.user);
        const email = session.user.email ?? '';
        
        if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          if (adminTenantTarget) {
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

// --- TELA DE LOGIN ---
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

// --- VISÃO SUPER ADMIN ---
function SuperAdminView({ onLogout, notify, userEmail }: { onLogout: () => void; notify: (msg: string) => void; userEmail?: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  
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
      notify("Erro ao copiar. Copie manualmente.");
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
    setPhoto1(null); setPhoto2(null); setPhoto3(null);
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
      categories: formCategories, category: formCategories[0] || 'Barbearia',
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

    if (formPassword) {
      const { error } = await supabase.rpc('admin_set_user_password', { user_email: cleanEmail, new_password: formPassword });
      if (error) {
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
                      onClick={() => copyToClipboard(`${window.location.origin}/?admin_tenant=${t.slug}`, `painel-${t.slug}`)} 
                      className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#212529] bg-[#f8f9fa] py-2 rounded-lg border border-[#e9ecef]"
                    >
                      {copiedSlug === `painel-${t.slug}` ? <Check size={14} /> : <Copy size={14} />} Copiar Link Painel
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl my-auto">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-lg font-bold">{editingTenant ? 'Editar Informações da Loja' : 'Cadastrar Nova Loja'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
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
                <label className="block text-xs font-semibold text-[#495057] mb-2">Ramos de Atuação</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_CATEGORIES.map(cat => (
                    <button type="button" key={cat} onClick={() => handleCategoryToggle(cat)} className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${formCategories.includes(cat) ? 'bg-[#242329] text-white border-[#242329]' : 'bg-white text-[#6c757d] border-[#e9ecef]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

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
                  <label className="block text-[10px] font-semibold text-[#495057]">Link do Google Meu Negócio</label>
                  <input type="text" value={formGoogleLink} onChange={(e) => setFormGoogleLink(e.target.value)} placeholder="https://g.page/r/..." className="mt-1 w-full rounded-xl border border-[#e9ecef] p-2 text-xs outline-none" />
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef] space-y-2">
                <p className="font-bold text-[#212529] flex items-center gap-1 text-sm"><KeyRound size={16} /> Credenciais do Lojista</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#495057]">E-mail</label>
                    <input required type="email" value={formOwnerEmail} onChange={(e) => setFormOwnerEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#495057]">Senha</label>
                    <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e9ecef] p-2 text-xs outline-none bg-white" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSavingStore} className="w-full rounded-xl bg-[#242329] py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#343a40] disabled:opacity-50">
                {isSavingStore ? 'Salvando...' : (editingTenant ? 'Salvar Alterações' : 'Cadastrar Loja')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- DASHBOARD DO ESTABELECIMENTO ---
function TenantAdminView({ tenant, onBack, onLogout, notify, isSuperAdmin }: { tenant: Tenant; onBack: () => void; onLogout: () => void; notify: (msg: string) => void; isSuperAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'professionals'>('dashboard');
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
  const [profPhoto, setProfPhoto] = useState<File | null>(null);
  const [isSavingProf, setIsSavingProf] = useState(false);

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
  useEffect(() => { void loadTenantDetails(); }, [tenant]);

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('marco_services').insert({ tenant_id: tenant.id, name: serviceName, duration_minutes: parseInt(serviceDuration) || 30, price: parseFloat(servicePrice) || 0, active: true });
    if (!error) { notify('Serviço cadastrado!'); setShowServiceModal(false); setServiceName(''); void loadTenantDetails(); }
  };

  const handleSaveProf = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSavingProf(true);
    let photo_url = null;

    if (profPhoto) {
      const fileExt = profPhoto.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData } = await supabase.storage.from('avatars').upload(fileName, profPhoto);
      if (uploadData) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        photo_url = data.publicUrl;
      }
    }

    const { error } = await supabase.from('marco_professionals').insert({
      tenant_id: tenant.id, name: profName, role: profRole, pix_key: profPix.trim(), photo_url, active: true
    });

    if (!error) { notify('Profissional cadastrado!'); setShowProfModal(false); setProfName(''); setProfPix(''); setProfPhoto(null); void loadTenantDetails(); }
    setIsSavingProf(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8f9fa]">
      <aside className="w-64 border-r border-[#e9ecef] bg-white p-6 hidden md:block">
        {isSuperAdmin && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#6c757d]"><ArrowLeft size={16} /> Voltar Super Admin</button>}
        <div className="mb-6"><h2 className="font-display text-lg font-bold text-[#212529]">{tenant.name}</h2><span className="text-xs text-[#6c757d]">Painel Lojista</span></div>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-[#242329] text-white' : 'text-[#495057]'}`}><BarChart3 size={18} /> Visão Geral</button>
          <button onClick={() => setActiveTab('services')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'services' ? 'bg-[#242329] text-white' : 'text-[#495057]'}`}><WalletCards size={18} /> Serviços</button>
          <button onClick={() => setActiveTab('professionals')} className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'professionals' ? 'bg-[#242329] text-white' : 'text-[#495057]'}`}><Users size={18} /> Equipe</button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#d94e70] hover:bg-[#fde8ed] mt-6"><LogOut size={18} /> Sair</button>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10">
        <header className="mb-6 flex items-center justify-between">
          <div><h1 className="font-display text-xl md:text-2xl font-bold">Meu Negócio</h1></div>
          <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-white border border-[#e9ecef] px-3 py-2 text-xs font-bold text-[#212529] shadow-sm">
            <ExternalLink size={14} /> Ver Minha Página Pública
          </a>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e9ecef] bg-white p-5"><span className="text-xs font-semibold text-[#6c757d]">Agendamentos</span><p className="mt-2 text-2xl font-bold">{appointments.length}</p></div>
            <div className="rounded-2xl border border-[#e9ecef] bg-white p-5"><span className="text-xs font-semibold text-[#6c757d]">Serviços Oferecidos</span><p className="mt-2 text-2xl font-bold">{services.length}</p></div>
            <div className="rounded-2xl border border-[#e9ecef] bg-white p-5"><span className="text-xs font-semibold text-[#6c757d]">Profissionais</span><p className="mt-2 text-2xl font-bold">{professionals.length}</p></div>
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Minha Equipe</h2>
              <button onClick={() => setShowProfModal(true)} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white"><Plus size={16} /> Adicionar Membro</button>
            </div>
            <div className="space-y-3">
              {professionals.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-3">
                  <div className="flex items-center gap-3">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="h-10 w-10 rounded-full object-cover border border-[#e9ecef]" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#f4f1eb] text-[#805d4e] flex items-center justify-center font-bold text-sm">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs text-[#6c757d]">{p.role} {p.pix_key ? '· Pix Cadastrado' : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Meus Serviços</h2>
              <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white"><Plus size={16} /> Novo Serviço</button>
            </div>
            <div className="space-y-2">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-3 text-sm">
                  <div><p className="font-bold">{s.name}</p><p className="text-xs text-[#6c757d]">{s.duration_minutes} min</p></div>
                  <p className="font-bold text-[#805d4e]">R$ {s.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Adicionar à Equipe</h2>
              <button onClick={() => setShowProfModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProf} className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#e9ecef] rounded-xl p-4 bg-[#f8f9fa] relative hover:bg-[#e9ecef] transition-colors cursor-pointer">
                {profPhoto ? (
                  <div className="text-center">
                    <img src={URL.createObjectURL(profPhoto)} alt="Preview" className="h-16 w-16 mx-auto rounded-full object-cover mb-2 border shadow-sm" />
                    <span className="text-[10px] font-bold text-[#2e7d32]">Foto selecionada!</span>
                  </div>
                ) : (
                  <div className="text-center text-[#6c757d]">
                    <Camera size={24} className="mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-semibold">Toque para adicionar foto</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setProfPhoto(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <div><label className="block text-xs font-semibold text-[#495057]">Nome</label><input required type="text" value={profName} onChange={(e) => setProfName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <div><label className="block text-xs font-semibold text-[#495057]">Cargo / Especialidade</label><input required type="text" value={profRole} onChange={(e) => setProfRole(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <div><label className="block text-xs font-semibold text-[#495057]">Chave Pix Própria (Opcional)</label><input type="text" value={profPix} onChange={(e) => setProfPix(e.target.value)} placeholder="Celular, CPF ou E-mail" className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <button type="submit" disabled={isSavingProf} className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white disabled:opacity-50">{isSavingProf ? 'Salvando...' : 'Salvar Membro'}</button>
            </form>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Novo Serviço</h2>
              <button onClick={() => setShowServiceModal(false)} className="text-[#6c757d]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div><label className="block text-xs font-semibold text-[#495057]">Nome</label><input required type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <div><label className="block text-xs font-semibold text-[#495057]">Duração (Min)</label><input required type="number" value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <div><label className="block text-xs font-semibold text-[#495057]">Preço (R$)</label><input required type="number" step="0.01" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none" /></div>
              <button type="submit" className="w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white">Salvar Serviço</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PÁGINA PÚBLICA DE AGENDAMENTO COMPLETA E NAVEGÁVEL ---
function BookingPage({ slug, onBack, notify, isStandalone }: { slug: string; onBack: () => void; notify: (msg: string) => void; isStandalone?: boolean }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [date, setDate] = useState('31');
  const [time, setTime] = useState('16:00');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'local' | 'pix'>('local');
  const [pixCopied, setPixCopied] = useState(false);
  
  const dates = [
    { day: 'Sáb', date: '31', fullDate: '2026-10-31', weekday: 'OUT' },
    { day: 'Dom', date: '1', fullDate: '2026-11-01', weekday: 'NOV' },
    { day: 'Seg', date: '2', fullDate: '2026-11-02', weekday: 'NOV' },
    { day: 'Ter', date: '3', fullDate: '2026-11-03', weekday: 'NOV' }
  ];
  const times = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:00'];

  useEffect(() => {
    const loadTenantData = async () => {
      if (!supabase) return;
      const { data: t } = await supabase.from('marco_tenants').select('*').eq('slug', slug).single();
      if (t) {
        setTenant(t as Tenant);
        const [{ data: s }, { data: p }] = await Promise.all([
          supabase.from('marco_services').select('*').eq('tenant_id', t.id).eq('active', true),
          supabase.from('marco_professionals').select('*').eq('tenant_id', t.id).eq('active', true),
        ]);
        if (s) setServices(s as Service[]);
        if (p) setProfessionals(p as Professional[]);
      }
      setLoading(false);
    };
    void loadTenantData();
  }, [slug]);

  if (loading) return <div className="flex h-screen items-center justify-center text-sm font-bold text-[#888]">Carregando agendamento...</div>;
  if (!tenant) return <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-center"><div><h1 className="text-4xl font-bold">404</h1><p>Comércio não encontrado.</p></div></div>;

  const themeStyle = THEME_STYLES[tenant.theme || 'coffee'] || THEME_STYLES.coffee;
  const pixKey = selectedProfessional?.pix_key || tenant.pix_key || '';

  const copyPix = () => {
    if (!pixKey) return;
    navigator.clipboard?.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const downloadIcsFile = () => {
    if (!selectedService) return;
    const [startH, startM] = time.split(':').map(Number);
    const duration = selectedService.duration_minutes || 45;
    const endMins = startH * 60 + startM + duration;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    const gStart = `202610${date.padStart(2, '0')}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const gEnd = `202610${date.padStart(2, '0')}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Marco Agendamentos//PT
BEGIN:VEVENT
SUMMARY:${selectedService.name} - ${tenant.name}
DESCRIPTION:Cliente: ${name}\\nProfissional: ${selectedProfessional?.name || 'Sem preferência'}
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

    const gStart = `202610${date.padStart(2, '0')}T${String(startH).padStart(2, '0')}${String(startM).padStart(2, '0')}00`;
    const gEnd = `202610${date.padStart(2, '0')}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    const title = encodeURIComponent(`${selectedService.name} - ${tenant.name}`);
    const details = encodeURIComponent(`Cliente: ${name}\nProfissional: ${selectedProfessional?.name || 'Sem preferência'}`);
    
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gStart}/${gEnd}&details=${details}`, '_blank');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const pixLine = paymentMethod === 'pix' && pixKey ? `\n*Pagamento:* Pix (${pixKey})` : '\n*Pagamento:* Pagar no local';
    const notesLine = notes ? `\n*Obs:* ${notes}` : '';
    const message = `Olá, *${tenant.name}*! Gostaria de confirmar meu agendamento.\n\n` +
      `*Serviço:* ${selectedService?.name}\n` +
      `*Profissional:* ${selectedProfessional?.name ?? 'Sem preferência'}\n` +
      `*Data:* Sábado, ${date} de Outubro às ${time}\n` +
      `*Cliente:* ${name} (${phone})${pixLine}${notesLine}`;
    
    window.open(`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    setStep(4);
  };

  return (
    <div className="min-h-screen pb-24 transition-colors" style={{ backgroundColor: themeStyle.bg, color: themeStyle.textPrimary }}>
      {/* HEADER DA VITRINE */}
      <div className="relative w-full h-48 md:h-64 bg-black/10 overflow-hidden">
        {tenant.photo1_url ? (
          <img src={tenant.photo1_url} alt={tenant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#e9ecef] flex items-center justify-center"><Store size={48} className="opacity-20"/></div>
        )}
        
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep(step - 1)} className="text-xs font-bold text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">← Voltar</button>
          ) : (!isStandalone && step < 4 ? (
            <button onClick={onBack} className="text-xs font-bold text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">← Painel</button>
          ) : <div className="w-10"></div>)}
        </header>
      </div>

      <main className="mx-auto max-w-xl px-4 -mt-10 relative z-10">
        {/* CARD DA EMPRESA */}
        <div className="rounded-3xl border border-black/5 p-5 shadow-sm mb-6" style={{ backgroundColor: themeStyle.cardBg }}>
          <h1 className="font-display font-bold text-2xl tracking-tight">{tenant.name}</h1>
          <div className="flex items-center gap-1 mt-1 font-semibold text-xs opacity-70">
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <Star size={12} className="text-amber-500" fill="currentColor" />
            <StarHalf size={12} className="text-amber-500" fill="currentColor" />
            <span className="ml-1">(5.0)</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tenant.categories?.map(c => (
              <span key={c} className="text-[10px] px-2 py-1 rounded border border-black/10 font-bold opacity-80 uppercase tracking-wider">{c}</span>
            )) || <span className="text-[10px] px-2 py-1 rounded border border-black/10 font-bold opacity-80 uppercase tracking-wider">{tenant.category}</span>}
          </div>

          <div className="mt-4 space-y-2 pt-3 border-t border-black/5 text-xs">
            {tenant.address && (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="opacity-50 shrink-0 mt-0.5" />
                <span>{tenant.address} · {tenant.city} - {tenant.state}</span>
              </div>
            )}
            {tenant.google_review_link && (
              <a href={tenant.google_review_link} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-black/10 text-xs font-bold hover:bg-black/5">
                <Star size={14} /> Ver avaliações no Google
              </a>
            )}
          </div>
        </div>

        {/* PASSO 1: SERVIÇOS */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight">Selecione o serviço</h2>
            <div className="space-y-2.5">
              {services.length === 0 ? (
                <div className="rounded-2xl border border-black/5 p-6 bg-white text-center opacity-60 text-xs" style={{ backgroundColor: themeStyle.cardBg }}>
                  Nenhum serviço cadastrado para esta loja ainda.
                </div>
              ) : (
                services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-black/5 p-4 shadow-sm" style={{ backgroundColor: themeStyle.cardBg }}>
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{s.duration_minutes} min</p>
                      <p className="font-bold text-sm mt-1" style={{ color: themeStyle.accent }}>R$ {s.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => { setSelectedService(s); setStep(2); }} className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm" style={{ backgroundColor: themeStyle.buttonBg }}>
                      Reservar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PASSO 2: PROFISSIONAL E HORÁRIO */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider opacity-60">Equipe disponível</h3>
              <div className="grid grid-cols-3 gap-3">
                <div onClick={() => setSelectedProfessional(null)} className={`flex flex-col items-center cursor-pointer rounded-2xl border p-3 text-center transition-all bg-white shadow-sm ${!selectedProfessional ? 'ring-2 ring-black font-bold' : 'opacity-70'}`} style={{ backgroundColor: themeStyle.cardBg }}>
                  <div className="relative mb-2"><div className="h-14 w-14 rounded-full bg-black/5 flex items-center justify-center"><Users size={24} className="opacity-60" /></div></div>
                  <span className="text-xs font-bold line-clamp-1">Sem preferência</span>
                </div>

                {professionals.map((p) => {
                  const isSelected = selectedProfessional?.id === p.id;
                  const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <div key={p.id} onClick={() => setSelectedProfessional(p)} className={`flex flex-col items-center cursor-pointer rounded-2xl border p-3 text-center transition-all bg-white shadow-sm ${isSelected ? 'ring-2 ring-black font-bold' : 'opacity-80'}`} style={{ backgroundColor: themeStyle.cardBg }}>
                      <div className="relative mb-2">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} className="h-14 w-14 rounded-full object-cover border border-black/10 shadow-inner" />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-[#242329] text-white flex items-center justify-center text-sm font-bold shadow-inner">{initials}</div>
                        )}
                      </div>
                      <span className="text-xs font-bold line-clamp-1">{p.name}</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold mt-0.5"><Star size={10} fill="currentColor" /> 5.0</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider opacity-60">Data e Hora</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {dates.map((d) => (
                  <button key={d.date} onClick={() => setDate(d.date)} className="rounded-xl border p-3 text-center text-xs font-bold" style={{ backgroundColor: date === d.date ? themeStyle.buttonBg : themeStyle.cardBg, color: date === d.date ? '#fff' : themeStyle.textPrimary }}>{d.day} {d.date}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {times.map((t) => (
                  <button key={t} onClick={() => setTime(t)} className="rounded-xl border p-2 text-center text-xs font-bold" style={{ backgroundColor: time === t ? themeStyle.buttonBg : themeStyle.cardBg, color: time === t ? '#fff' : themeStyle.textPrimary }}>{t}</button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: themeStyle.buttonBg }}>Continuar</button>
          </div>
        )}

        {/* PASSO 3: DATOS E PAGAMENTO */}
        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-xl font-bold">Confirmação e Pagamento</h2>
            
            <div className="rounded-2xl border border-black/5 p-4 bg-white space-y-2 text-xs shadow-sm" style={{ backgroundColor: themeStyle.cardBg }}>
              <div className="flex justify-between font-bold text-sm">
                <span>{selectedService?.name}</span>
                <span style={{ color: themeStyle.accent }}>R$ {selectedService?.price.toFixed(2)}</span>
              </div>
              <p className="opacity-70">Sábado, {date} de Outubro às {time}</p>
              <p className="opacity-70">Profissional: {selectedProfessional?.name || 'Sem preferência (Qualquer disponível)'}</p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold opacity-80">
                Forma de Pagamento
                <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 p-3 text-xs outline-none text-[#212529] bg-white">
                  <option value="local">Pagar no local (Após o serviço)</option>
                  {pixKey && <option value="pix">Pagar agora via Pix</option>}
                </select>
              </label>
            {paymentMethod === 'pix' && pixKey && (
  <div className="rounded-xl border border-black/10 p-4 text-xs space-y-2.5 bg-white text-[#212529]">
    <p className="font-bold flex items-center gap-1.5 text-xs text-[#212529]">
      <DollarSign size={16} className="text-[#2e7d32]" /> Chave Pix para pagamento:
    </p>
    <p className="bg-[#f8f9fa] p-2.5 rounded-lg font-mono text-center text-sm font-semibold select-all text-[#212529] border border-[#e9ecef]">
      {pixKey}
    </p>
    <button 
      type="button" 
      onClick={copyPix} 
      className="w-full rounded-xl bg-[#242329] py-2.5 text-white font-bold hover:bg-[#343a40] transition-colors"
    >
      {pixCopied ? 'Chave copiada! ✓' : 'Copiar chave Pix'}
    </button>
    <p className="text-[11px] text-[#6c757d] text-center font-medium pt-1">
      💡 Ao concluir o pagamento no Pix, favor encaminhar o comprovante pelo WhatsApp.
    </p>
  </div>
)}
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu Nome Completo" className="w-full rounded-xl border border-black/10 p-3 text-xs outline-none bg-white" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Seu WhatsApp" className="w-full rounded-xl border border-black/10 p-3 text-xs outline-none bg-white" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)..." rows={2} className="w-full rounded-xl border border-black/10 p-3 text-xs outline-none bg-white" />
            </div>

            <button type="submit" className="w-full rounded-2xl bg-[#0e7490] py-4 text-sm font-bold text-white shadow-lg">Confirmar e Agendar</button>
          </form>
        )}

        {/* PASSO 4: CONFIRMAÇÃO FINAL */}
        {step === 4 && (
          <div className="rounded-3xl border border-black/5 p-6 text-center space-y-5 bg-white shadow-sm my-6" style={{ backgroundColor: themeStyle.cardBg }}>
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Agendamento confirmado</h2>
              <p className="text-base font-semibold mt-1">Sábado, {date} Outubro 2026, {time}</p>
              <p className="text-xs opacity-60 mt-2">Concluído! Enviamos a confirmação para o WhatsApp da loja.</p>
            </div>

            <div className="pt-4 space-y-3 border-t border-black/5">
              <p className="text-xs font-bold opacity-80">Adicionar este evento à sua agenda:</p>
              <button type="button" onClick={downloadIcsFile} className="w-full rounded-2xl bg-[#007aff] py-3 text-xs font-bold text-white shadow-sm hover:opacity-90">
                 Adicionar ao Apple Calendar / iPhone
              </button>
              <button type="button" onClick={openGoogleCalendar} className="w-full rounded-2xl bg-[#4285f4] py-3 text-xs font-bold text-white shadow-sm hover:opacity-90">
                🤖 Adicionar ao Google Agenda / Android
              </button>
            </div>

            <button onClick={() => setStep(1)} className="text-xs underline font-semibold pt-2 block mx-auto opacity-80" style={{ color: themeStyle.accent }}>
              Fazer outro agendamento
            </button>
          </div>
        )}
      </main>
    </div>
  );
}