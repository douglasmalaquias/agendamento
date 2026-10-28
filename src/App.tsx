import React, { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
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
  ExternalLink
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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
  theme: 'dark',
  pix_key: '11999999999',
  pix_key_type: 'telefone'
};

type View = 'super-admin' | 'tenant-admin' | 'public';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('super-admin');
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path) {
      setCurrentSlug(path);
      setCurrentView('public');
    } else {
      setCurrentView('super-admin');
    }
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
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
    setActiveTenant(null);
    setCurrentView('super-admin');
  };

  if (currentView === 'public') {
    return <BookingPage slug={currentSlug} onBack={backToSuperAdmin} notify={notify} />;
  }

  if (currentView === 'tenant-admin' && activeTenant) {
    return <TenantAdminView tenant={activeTenant} onBack={backToSuperAdmin} notify={notify} openPublicPage={openPublicPage} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#212529] font-sans">
      {notification && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#242329] px-4 py-3 text-sm text-white shadow-lg animate-bounce">
          {notification}
        </div>
      )}
      <SuperAdminView openPublicPage={openPublicPage} openTenantDashboard={openTenantDashboard} notify={notify} />
    </div>
  );
}

// --- VISÃO 1: SUPER ADMIN (GERENCIAR TODOS OS COMÉRCIOS) ---
function SuperAdminView({ openPublicPage, openTenantDashboard, notify }: { openPublicPage: (slug: string) => void; openTenantDashboard: (tenant: Tenant) => void; notify: (msg: string) => void }) {
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
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setFormCategory(t.category);
    setFormWhatsapp(t.whatsapp);
    setFormCity(t.city || 'São Paulo, SP');
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
      city: formCity
    };

    if (editingTenant) {
      const { error } = await client.from('marco_tenants').update(payload).eq('id', editingTenant.id);
      if (!error) notify('Comércio atualizado com sucesso!');
    } else {
      const { data, error } = await client.from('marco_tenants').insert(payload).select().single();
      if (!error && data) {
        await client.from('marco_subscriptions').insert({ tenant_id: data.id, status: 'paid' });
        notify('Novo comércio cadastrado com sucesso!');
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
      notify('Comércio excluído com sucesso!');
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
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Super Admin</h1>
            <p className="text-sm text-[#6c757d]">Gerencie os estabelecimentos da plataforma Marcô.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#242329] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#343a40]"
          >
            <Plus size={18} /> Novo Comércio
          </button>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6c757d]">Comércios Ativos</span>
              <Store size={18} className="text-[#6c757d]" />
            </div>
            <p className="mt-2 text-2xl font-bold">{tenants.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6c757d]">Mensalidades em Dia</span>
              <CheckCircle2 size={18} className="text-[#2e7d32]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#2e7d32]">100%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-[#adb5bd]" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, categoria ou bairro..."
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e9ecef] text-xs font-semibold text-[#6c757d]">
                    <th className="pb-3">COMÉRCIO</th>
                    <th className="pb-3">CIDADE / BAIRRO</th>
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
                      <td className="py-4 text-[#495057]">{t.city || 'São Paulo, SP'}</td>
                      <td className="py-4 text-[#495057]">{t.whatsapp}</td>
                      <td className="py-4">
                        <button
                          onClick={() => openPublicPage(t.slug)}
                          className="flex items-center gap-1 text-xs font-semibold text-[#805d4e] hover:underline"
                        >
                          <Link2 size={14} /> /{t.slug}
                        </button>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTenantDashboard(t)}
                            className="rounded-lg bg-[#f8f9fa] border border-[#e9ecef] px-2.5 py-1 text-xs font-semibold text-[#212529] hover:bg-[#e9ecef]"
                          >
                            Entrar
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(t)}
                            className="rounded-lg p-2 text-[#6c757d] hover:bg-[#e9ecef] hover:text-[#212529]"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(t.id, t.name)}
                            className="rounded-lg p-2 text-[#d94e70] hover:bg-[#fde8ed]"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {editingTenant ? 'Editar Comércio' : 'Novo Comércio'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6c757d] hover:text-[#212529]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Nome do Estabelecimento</label>
                <input
                  required
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingTenant) setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="Ex: Studio Elena Nails"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none focus:border-[#242329]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Link de Acesso (Slug)</label>
                <input
                  required
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="ex: studio-elena-nails"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none focus:border-[#242329]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none focus:border-[#242329]"
                >
                  <option value="Barbearia">Barbearia</option>
                  <option value="Esmalteria / Nails">Esmalteria / Nails</option>
                  <option value="Estética">Estética</option>
                  <option value="Salão de Beleza">Salão de Beleza</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">WhatsApp (Com DDD)</label>
                <input
                  required
                  type="text"
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="11999999999"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none focus:border-[#242329]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Bairro e Cidade</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="São Paulo, SP - Jardins"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none focus:border-[#242329]"
                />
              </div>
              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white hover:bg-[#343a40]"
              >
                {editingTenant ? 'Salvar Alterações' : 'Cadastrar Comércio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISÃO 2: DASHBOARD COM CADASTRO DE SERVIÇOS E PROFISSIONAIS ---
function TenantAdminView({ tenant, onBack, notify, openPublicPage }: { tenant: Tenant; onBack: () => void; notify: (msg: string) => void; openPublicPage: (slug: string) => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'professionals' | 'appointments'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modais de Cadastro
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

  // Salvar Novo Serviço
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
    } else {
      notify('Erro ao cadastrar serviço: ' + error.message);
    }
  };

  // Salvar Novo Profissional
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
    } else {
      notify('Erro ao cadastrar profissional: ' + error.message);
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
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <aside className="w-64 border-r border-[#e9ecef] bg-white p-6 hidden md:block">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#6c757d] hover:text-[#212529]">
          <ArrowLeft size={16} /> Voltar ao Super Admin
        </button>
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-[#212529]">{tenant.name}</h2>
          <span className="text-xs text-[#6c757d]">{tenant.category} · {tenant.city}</span>
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}
          >
            <BarChart3 size={18} /> Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'appointments' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}
          >
            <CalendarDays size={18} /> Agendamentos
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'services' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}
          >
            <WalletCards size={18} /> Serviços
          </button>
          <button
            onClick={() => setActiveTab('professionals')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === 'professionals' ? 'bg-[#242329] text-white' : 'text-[#495057] hover:bg-[#f8f9fa]'}`}
          >
            <Users size={18} /> Profissionais
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#805d4e]">PAINEL DO ESTABELECIMENTO</span>
            <h1 className="font-display text-2xl font-bold">{tenant.name}</h1>
          </div>
          <button
            onClick={() => openPublicPage(tenant.slug)}
            className="flex items-center gap-2 rounded-xl border border-[#e9ecef] bg-white px-4 py-2.5 text-xs font-bold text-[#212529] shadow-sm hover:bg-[#f8f9fa]"
          >
            <ExternalLink size={16} /> Ver Página Pública
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
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
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold">Agendamentos Recebidos</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum agendamento realizado ainda.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-4 text-sm">
                    <div>
                      <p className="font-bold">{a.customer_name} ({a.customer_phone})</p>
                      <p className="text-xs text-[#6c757d]">Data: {a.appointment_date} às {a.appointment_time}</p>
                    </div>
                    <span className="rounded-lg bg-[#2e7d32]/10 px-3 py-1 text-xs font-bold text-[#2e7d32]">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Serviços Cadastrados</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#343a40]"
              >
                <Plus size={16} /> Novo Serviço
              </button>
            </div>

            {services.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-4 text-sm">
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-[#6c757d]">{s.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-[#805d4e]">R$ {s.price.toFixed(2)}</p>
                      <button onClick={() => handleDeleteService(s.id)} className="text-[#d94e70] hover:opacity-80">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'professionals' && (
          <div className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold">Equipe de Profissionais</h2>
              <button
                onClick={() => setShowProfModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#343a40]"
              >
                <Plus size={16} /> Novo Profissional
              </button>
            </div>

            {professionals.length === 0 ? (
              <p className="text-sm text-[#6c757d]">Nenhum profissional cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {professionals.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#e9ecef] p-4 text-sm">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-[#6c757d]">{p.role} {p.pix_key ? `· Pix: ${p.pix_key}` : ''}</p>
                    </div>
                    <button onClick={() => handleDeleteProf(p.id)} className="text-[#d94e70] hover:opacity-80">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DE NOVO SERVIÇO */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Novo Serviço</h2>
              <button onClick={() => setShowServiceModal(false)} className="text-[#6c757d]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Nome do Serviço</label>
                <input
                  required
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Esmaltação em Gel"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Duração (Minutos)</label>
                <input
                  required
                  type="number"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder="45"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Preço (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="90.00"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white">
                Cadastrar Serviço
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO PROFISSIONAL */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Novo Profissional</h2>
              <button onClick={() => setShowProfModal(false)} className="text-[#6c757d]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Ex: Elena Rostova"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Cargo / Especialidade</label>
                <input
                  required
                  type="text"
                  value={profRole}
                  onChange={(e) => setProfRole(e.target.value)}
                  placeholder="Ex: Designer de Unhas"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057]">Chave Pix (Opcional)</label>
                <input
                  type="text"
                  value={profPix}
                  onChange={(e) => setProfPix(e.target.value)}
                  placeholder="CPF, Telefone ou E-mail"
                  className="mt-1 w-full rounded-xl border border-[#e9ecef] p-3 text-sm outline-none"
                />
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-bold text-white">
                Cadastrar Profissional
              </button>
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
  const [date, setDate] = useState('27');
  const [time, setTime] = useState('10:30');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'local'>('local');
  const [pixCopied, setPixCopied] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<string[]>([]);

  const dates = [
    { day: 'Hoje', date: '27', fullDate: '2026-10-27', weekday: 'TER' },
    { day: 'Amanhã', date: '28', fullDate: '2026-10-28', weekday: 'QUA' },
    { day: 'Qui', date: '29', fullDate: '2026-10-29', weekday: 'QUI' },
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
    
    // MENSAGEM DO WHATSAPP 100% LIMPA
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
    <div className="min-h-screen bg-[#f4f1eb] pb-12">
      <header className="flex items-center justify-between border-b border-[#e2ddd3] bg-[#f8f6f1] px-5 py-4">
        <button onClick={onBack} className="text-xs font-semibold text-[#666] hover:underline">← Voltar</button>
        <span className="font-display font-bold text-[#242329]">{tenant.name}</span>
        <span className="text-xs text-[#888]">{tenant.category}</span>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-6">
        {step < 4 && (
          <div className="mb-6 flex justify-between border-b border-[#e2ddd3] pb-3 text-xs">
            <span className={step === 1 ? 'font-bold text-[#805d4e]' : 'text-[#888]'}>1. Serviço</span>
            <span className={step === 2 ? 'font-bold text-[#805d4e]' : 'text-[#888]'}>2. Data e Profissional</span>
            <span className={step === 3 ? 'font-bold text-[#805d4e]' : 'text-[#888]'}>3. Pagamento e Dados</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Escolha o serviço</h2>
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => { setSelectedService(s); setStep(2); }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e2ddd3] bg-white p-4 transition-all hover:border-[#805d4e]"
              >
                <div>
                  <p className="font-bold text-[#242329]">{s.name}</p>
                  <p className="text-xs text-[#777]">{s.duration_minutes} min</p>
                </div>
                <p className="font-bold text-[#805d4e]">R$ {s.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase text-[#777]">Profissional</h3>
              <div className="grid grid-cols-2 gap-2">
                {professionals.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProfessional(p)}
                    className={`rounded-xl border p-3 text-left text-xs ${selectedProfessional?.id === p.id ? 'border-[#805d4e] bg-[#805d4e] text-white' : 'border-[#e2ddd3] bg-white text-[#333]'}`}
                  >
                    <p className="font-bold">{p.name}</p>
                    <p className="opacity-80">{p.role}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase text-[#777]">Data</h3>
              <div className="grid grid-cols-3 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setDate(d.date)}
                    className={`rounded-xl border p-3 text-center text-xs ${date === d.date ? 'border-[#805d4e] bg-[#805d4e] text-white' : 'border-[#e2ddd3] bg-white text-[#333]'}`}
                  >
                    <p className="font-bold">{d.day}</p>
                    <p className="opacity-80">{d.date} Out ({d.weekday})</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase text-[#777]">Horários Disponíveis</h3>
              {times.length === 0 ? (
                <p className="text-xs text-[#d94e70] p-2 bg-white rounded-xl border border-[#e2ddd3]">Nenhum horário disponível para este profissional nesta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={`rounded-xl border p-2 text-center text-xs ${time === t ? 'border-[#242329] bg-[#242329] text-white' : 'border-[#e2ddd3] bg-white text-[#333]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(3)}
              className="mt-4 w-full rounded-xl bg-[#805d4e] py-3 text-sm font-bold text-white shadow-md"
            >
              Avançar para confirmação →
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-2xl border border-[#e2ddd3] bg-white p-4 text-xs space-y-1">
              <p className="font-bold text-sm text-[#242329]">{selectedService?.name}</p>
              <p className="text-[#666]">Com {selectedProfessional?.name} em {date} de outubro às {time}</p>
              <p className="font-bold text-[#805d4e] text-sm pt-1">R$ {servicePrice.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#555]">
                Forma de Pagamento
                <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e2ddd3] p-3 text-xs outline-none">
                  <option value="local">Pagar no local</option>
                  <option value="pix">Pagar agora via Pix</option>
                </select>
              </label>

              {paymentMethod === 'pix' && (
                <div className="rounded-xl border border-[#e2ddd3] bg-white p-3 text-xs space-y-2">
                  <p className="font-bold">Chave Pix para pagamento:</p>
                  <p className="bg-[#f4f1eb] p-2 rounded-lg font-mono text-center select-all">{pixKey || 'Chave não cadastrada'}</p>
                  <button type="button" onClick={copyPix} className="w-full rounded-lg bg-[#242329] py-2 text-white font-semibold">
                    {pixCopied ? 'Chave copiada! ✓' : 'Copiar chave Pix'}
                  </button>
                </div>
              )}

              <label className="block text-xs font-bold text-[#555]">
                Seu Nome Completo
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite seu nome" className="mt-1 w-full rounded-xl border border-[#e2ddd3] p-3 text-xs outline-none" />
              </label>

              <label className="block text-xs font-bold text-[#555]">
                Seu WhatsApp
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1 w-full rounded-xl border border-[#e2ddd3] p-3 text-xs outline-none" />
              </label>
            </div>

            <button type="submit" className="w-full rounded-xl bg-[#2e7d32] py-3.5 text-sm font-bold text-white shadow-lg">
              Confirmar pelo WhatsApp →
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-[#e2ddd3] bg-white p-6 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h2 className="font-display text-xl font-bold text-[#242329]">Agendamento Solicitado!</h2>
            <p className="text-xs text-[#666]">Você foi redirecionado para o WhatsApp da {tenant.name}.</p>
            
            <div className="pt-2 space-y-2 border-t border-[#eee]">
              <p className="text-xs font-bold text-[#444] pt-2">Adicione este compromisso à sua agenda:</p>

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

            <button onClick={() => setStep(1)} className="text-xs text-[#805d4e] underline font-semibold pt-2 block mx-auto">
              Fazer novo agendamento
            </button>
          </div>
        )}
      </main>
    </div>
  );
}