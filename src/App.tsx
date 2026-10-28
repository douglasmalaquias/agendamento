import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Home,
  Link2,
  Menu,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Scissors,
  Search,
  Sparkles,
  Store,
  Trash2,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfessionalsView, { type Professional } from '@/components/ProfessionalsView';

type View = 'dashboard' | 'calendar' | 'services' | 'professionals' | 'settings' | 'admin' | 'booking' | 'notfound';
type ThemeName = 'dark' | 'light' | 'gold' | 'pink' | 'green';

type Service = { id: string; name: string; duration_minutes: number; price: number; active: boolean };
type Appointment = { id: string; customer_name: string; customer_phone: string; appointment_time: string; appointment_date: string; service_name: string; status: string };

type Tenant = { id: string; name: string; slug: string; category: string; phone: string; whatsapp: string; city: string; theme: ThemeName; pix_key: string; pix_key_type: string };
type Subscription = { tenant_id: string; status: string; renewal_date: string };

const fallbackTenant: Tenant = {
  id: 'demo-tenant', name: 'Barbearia Aurora', slug: 'barbearia-aurora', category: 'Barbearia',
  phone: '(11) 98888-2244', whatsapp: '5511988882244', city: 'São Paulo, SP', theme: 'dark',
  pix_key: '5511988882244', pix_key_type: 'telefone',
};

const fallbackProfessionals: Professional[] = [
  { id: 'professional-1', name: 'Ana Martins', role: 'Especialista', specialty: 'Cortes e visagismo', active: true, pix_key: '5511988882244', pix_key_type: 'telefone' },
  { id: 'professional-2', name: 'Rafael Costa', role: 'Barbeiro', specialty: 'Barba e acabamento', active: true, pix_key: '5511988882244', pix_key_type: 'telefone' },
  { id: 'professional-3', name: 'Lucas Ferreira', role: 'Barbeiro', specialty: 'Corte clássico', active: true, pix_key: '5511988882244', pix_key_type: 'telefone' },
];

const fallbackServices: Service[] = [
  { id: 'service-1', name: 'Corte clássico', duration_minutes: 45, price: 45, active: true },
  { id: 'service-2', name: 'Barba desenhada', duration_minutes: 30, price: 35, active: true },
  { id: 'service-3', name: 'Corte + barba', duration_minutes: 75, price: 70, active: true },
  { id: 'service-4', name: 'Sobrancelha', duration_minutes: 15, price: 20, active: true },
];

const fallbackAppointments: Appointment[] = [
  { id: 'a1', customer_name: 'Lucas Martins', customer_phone: '11991234567', appointment_time: '09:00', appointment_date: '2026-10-25', service_name: 'Corte + barba', status: 'confirmed' },
  { id: 'a2', customer_name: 'Rafael Costa', customer_phone: '11987654321', appointment_time: '10:30', appointment_date: '2026-10-25', service_name: 'Corte clássico', status: 'confirmed' },
  { id: 'a3', customer_name: 'Pedro Henrique', customer_phone: '11999887766', appointment_time: '13:30', appointment_date: '2026-10-25', service_name: 'Barba desenhada', status: 'confirmed' },
  { id: 'a4', customer_name: 'André Lima', customer_phone: '11994443322', appointment_time: '15:00', appointment_date: '2026-10-25', service_name: 'Corte clássico', status: 'confirmed' },
  { id: 'a5', customer_name: 'Bruno Souza', customer_phone: '11991112233', appointment_time: '16:30', appointment_date: '2026-10-25', service_name: 'Sobrancelha', status: 'pending' },
];

const themeOptions: { id: ThemeName; label: string; color: string; description: string }[] = [
  { id: 'dark', label: 'Noturno', color: '#202127', description: 'Elegante e moderno' },
  { id: 'light', label: 'Claro', color: '#f5f5f2', description: 'Leve e minimalista' },
  { id: 'gold', label: 'Dourado', color: '#c49a55', description: 'Luxo e sofisticação' },
  { id: 'pink', label: 'Rosa Manicure', color: '#e7a1b3', description: 'Delicado e acolhedor' },
  { id: 'green', label: 'Verde', color: '#7e9983', description: 'Natural e orgânico' },
];

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const RESERVED_PATHS = ['/', '/admin', '/dashboard', '/calendar', '/services', '/professionals', '/settings', '/booking'];

function getSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path || path === '/' || RESERVED_PATHS.includes(path)) return null;
  const slug = path.slice(1).split('/')[0];
  return slug || null;
}

function App() {
  const initialSlug = getSlugFromPath();
  const [view, setView] = useState<View>(initialSlug ? 'booking' : 'dashboard');
  const [publicSlug, setPublicSlug] = useState<string | null>(initialSlug);
  const [tenant, setTenant] = useState<Tenant>(fallbackTenant);
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [professionals, setProfessionals] = useState<Professional[]>(fallbackProfessionals);
  const [appointments, setAppointments] = useState<Appointment[]>(fallbackAppointments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewService, setShowNewService] = useState(false);
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false);
  const [toast, setToast] = useState('');

  const loadTenantBySlug = async (slug: string) => {
    const client = supabase;
    if (!client) return;
    const { data: tenantData } = await client.from('marco_tenants').select('*').eq('slug', slug).maybeSingle();
    if (!tenantData) { setView('notfound'); return; }
    setTenant(tenantData as Tenant);
    const [{ data: serviceData }, { data: professionalData }] = await Promise.all([
      client.from('marco_services').select('*').eq('tenant_id', tenantData.id).eq('active', true).order('created_at'),
      client.from('marco_professionals').select('*').eq('tenant_id', tenantData.id).eq('active', true).order('created_at'),
    ]);
    if (serviceData?.length) setServices(serviceData as Service[]);
    if (professionalData?.length) setProfessionals(professionalData as Professional[]);
  };

  useEffect(() => {
    if (publicSlug) { void loadTenantBySlug(publicSlug); return; }
    const client = supabase;
    if (!client) return;
    const load = async () => {
      const { data: tenantData } = await client.from('marco_tenants').select('*').eq('slug', fallbackTenant.slug).maybeSingle();
      if (tenantData) setTenant(tenantData as Tenant);
      if (tenantData) {
        const [{ data: serviceData }, { data: professionalData }, { data: appointmentData }] = await Promise.all([
          client.from('marco_services').select('*').eq('tenant_id', tenantData.id).eq('active', true).order('created_at'),
          client.from('marco_professionals').select('*').eq('tenant_id', tenantData.id).eq('active', true).order('created_at'),
          client.from('marco_appointments').select('*, marco_services(name)').eq('tenant_id', tenantData.id).order('appointment_time'),
        ]);
        if (serviceData?.length) setServices(serviceData as Service[]);
        if (professionalData?.length) setProfessionals(professionalData as Professional[]);
        if (appointmentData?.length) setAppointments(appointmentData.map((item) => ({ ...item, service_name: item.marco_services?.name ?? 'Serviço' })) as Appointment[]);
      }
    };
    void load();
  }, [publicSlug]);

  useEffect(() => {
    const onPop = () => {
      const slug = getSlugFromPath();
      setPublicSlug(slug);
      setView(slug ? 'booking' : 'dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const changeView = (nextView: View) => { setView(nextView); setMenuOpen(false); };
  const openPublicPage = (slug: string) => {
    const origin = window.location.origin;
    window.history.pushState({}, '', `${origin}/${slug}`);
    setPublicSlug(slug);
    setView('booking');
  };
  const backToDashboard = () => {
    const origin = window.location.origin;
    window.history.pushState({}, '', `${origin}/`);
    setPublicSlug(null);
    setView('dashboard');
  };
  const todayAppointments = appointments.filter((appointment) => appointment.appointment_date === '2026-10-25');

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#202127]">
      {view === 'booking' && <BookingPage tenant={tenant} services={services} professionals={professionals} onBack={backToDashboard} notify={notify} />}
      {view === 'notfound' && <NotFoundView onBack={backToDashboard} />}
      {view !== 'booking' && view !== 'notfound' && (
        <div className="flex min-h-screen">
          <Sidebar view={view} changeView={changeView} />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8e8e3] bg-[#f7f7f5]/95 px-5 backdrop-blur md:px-10">
              <div className="flex items-center gap-3 md:hidden"><button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl p-2 hover:bg-white"><Menu size={20} /></button><img src="/logo.png" className="h-9 w-9 rounded-xl object-cover" alt="Marcô" /></div>
              <div className="hidden md:block"><p className="font-display text-[21px] font-semibold tracking-tight">{view === 'admin' ? 'Visão geral' : view === 'settings' ? 'Personalização' : view === 'services' ? 'Serviços' : view === 'professionals' ? 'Profissionais' : view === 'calendar' ? 'Agenda' : 'Bom dia, equipe Aurora'}</p><p className="mt-0.5 text-[13px] text-[#979792]">Domingo, 25 de outubro de 2026</p></div>
              <div className="flex items-center gap-2 md:gap-4"><button className="relative rounded-xl p-2.5 text-[#8b8b86] transition hover:bg-white hover:text-[#202127]"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e24768]" /></button><div className="hidden h-8 w-px bg-[#e8e8e3] md:block" /><button onClick={() => setShowTenantSwitcher(!showTenantSwitcher)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#242329] text-[12px] font-semibold text-white">BA</span><span className="hidden text-left md:block"><span className="block text-[13px] font-semibold">Barbearia Aurora</span><span className="block text-[11px] text-[#aaa9a3]">Plano Pro Ilimitado</span></span><ChevronDown size={15} className="text-[#aaa9a3]" /></button></div>
              {showTenantSwitcher && <div className="absolute right-5 top-[66px] w-64 rounded-2xl border border-[#e7e6e1] bg-white p-2 shadow-xl md:right-10"><button className="flex w-full items-center gap-3 rounded-xl bg-[#f7f7f5] p-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242329] text-xs font-semibold text-white">BA</span><span><strong className="block text-sm">Barbearia Aurora</strong><small className="text-[#a1a09a]">Comércio ativo</small></span><Check size={16} className="ml-auto text-[#5d8068]" /></button><button onClick={() => { changeView('admin'); setShowTenantSwitcher(false); }} className="mt-1 flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm text-[#777771] hover:bg-[#f7f7f5]"><Store size={16} /> Super Admin</button></div>}
            </header>
            {menuOpen && <MobileMenu view={view} changeView={changeView} />}
            <main className="flex-1 px-5 pb-24 pt-7 md:px-10 md:pb-10 md:pt-9">
              {view === 'dashboard' && <Dashboard appointments={todayAppointments} services={services} changeView={changeView} notify={notify} openPublicPage={openPublicPage} tenant={tenant} />}
              {view === 'calendar' && <CalendarView appointments={appointments} notify={notify} />}
              {view === 'services' && <ServicesView services={services} onNew={() => setShowNewService(true)} notify={notify} />}
            {view === 'professionals' && <ProfessionalsView professionals={professionals} setProfessionals={setProfessionals} tenant={tenant} notify={notify} />}
              {view === 'settings' && <SettingsView tenant={tenant} setTenant={setTenant} notify={notify} openPublicPage={openPublicPage} />}
              {view === 'admin' && <AdminView changeView={changeView} openPublicPage={openPublicPage} />}
            </main>
          </div>
        </div>
      )}
      {showNewService && <NewServiceModal onClose={() => setShowNewService(false)} onSave={async (service) => { const client = supabase; if (client && tenant.id !== fallbackTenant.id) { const { data, error } = await client.from('marco_services').insert({ ...service, tenant_id: tenant.id }).select().maybeSingle(); if (!error && data) { setServices([...services, data as Service]); } else { setServices([...services, { ...service, id: `service-${Date.now()}` }]); } } else { setServices([...services, { ...service, id: `service-${Date.now()}` }]); } setShowNewService(false); notify('Serviço adicionado com sucesso'); }} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#242329] px-5 py-3 text-sm font-medium text-white shadow-2xl"><Check size={16} className="text-[#a9cf8f]" />{toast}</div>}
    </div>
  );
}

function Sidebar({ view, changeView }: { view: View; changeView: (view: View) => void }) {
  const items: { id: View; label: string; icon: typeof Home }[] = [{ id: 'dashboard', label: 'Início', icon: Home }, { id: 'calendar', label: 'Agenda', icon: CalendarDays }, { id: 'services', label: 'Serviços', icon: Scissors }, { id: 'professionals', label: 'Profissionais', icon: UsersRound }];
  return <aside className="hidden w-[244px] shrink-0 flex-col border-r border-[#e7e7e2] bg-white px-4 py-6 md:flex"><div className="flex items-center gap-3 px-3"><img src="/logo.png" alt="Marcô" className="h-10 w-10 rounded-xl object-cover" /><div><p className="font-display text-[23px] font-semibold tracking-[-0.04em]">Marcô<span className="text-[#e24768]">.</span></p><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#aaa9a3]">Seu tempo, no seu ritmo</p></div></div><div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b4b3ad]">Menu principal</div><nav className="mt-3 space-y-1">{items.map((item) => <NavItem key={item.id} item={item} active={view === item.id} onClick={() => changeView(item.id)} />)}</nav><div className="mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b4b3ad]">Gestão</div><nav className="mt-3 space-y-1"><NavItem item={{ id: 'settings', label: 'Personalização', icon: Palette }} active={view === 'settings'} onClick={() => changeView('settings')} /><NavItem item={{ id: 'admin', label: 'Super Admin', icon: BarChart3 }} active={view === 'admin'} onClick={() => changeView('admin')} /></nav><div className="mt-auto rounded-2xl bg-[#f7f7f5] p-4"><div className="mb-3 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white"><Zap size={15} className="text-[#c49a55]" /></span><span className="rounded-full bg-[#e4f3e5] px-2 py-1 text-[10px] font-bold text-[#5d8068]">ILIMITADO</span></div><p className="text-xs font-semibold">Plano Pro Ilimitado</p><p className="mt-1 text-[11px] leading-4 text-[#9e9d97]">Todos os recursos, sem limites.</p><div className="mt-3 hidden h-1.5 rounded-full bg-[#e5e5df] md:block"><div className="h-1.5 w-full rounded-full bg-[#c49a55]" /></div></div><div className="mt-5 flex items-center gap-3 border-t border-[#ededE8] px-3 pt-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ead8cf] text-xs font-bold text-[#704b3d]">AM</span><div className="min-w-0"><p className="truncate text-xs font-semibold">Ana Martins</p><p className="text-[11px] text-[#aaa9a3]">Proprietária</p></div><MoreHorizontal size={17} className="ml-auto text-[#aaa9a3]" /></div></aside>;
}

function NavItem({ item, active, onClick }: { item: { id: View; label: string; icon: typeof Home }; active: boolean; onClick: () => void }) { const Icon = item.icon; return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? 'bg-[#242329] text-white shadow-lg shadow-[#242329]/10' : 'text-[#8f8f89] hover:bg-[#f7f7f5] hover:text-[#202127]'}`}><Icon size={17} strokeWidth={active ? 2.3 : 1.8} />{item.label}{item.id === 'calendar' && <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/15 text-white' : 'bg-[#f0f0eb] text-[#9b9a93]'}`}>5</span>}</button>; }
function MobileMenu({ view, changeView }: { view: View; changeView: (view: View) => void }) { return <div className="absolute left-4 top-[68px] z-40 w-56 rounded-2xl border border-[#e7e7e2] bg-white p-2 shadow-xl md:hidden"><NavItem item={{ id: 'dashboard', label: 'Início', icon: Home }} active={view === 'dashboard'} onClick={() => changeView('dashboard')} /><NavItem item={{ id: 'calendar', label: 'Agenda', icon: CalendarDays }} active={view === 'calendar'} onClick={() => changeView('calendar')} /><NavItem item={{ id: 'services', label: 'Serviços', icon: Scissors }} active={view === 'services'} onClick={() => changeView('services')} /><NavItem item={{ id: 'professionals', label: 'Profissionais', icon: UsersRound }} active={view === 'professionals'} onClick={() => changeView('professionals')} /><NavItem item={{ id: 'settings', label: 'Personalização', icon: Palette }} active={view === 'settings'} onClick={() => changeView('settings')} /></div>; }

function Dashboard({ appointments, services, changeView, notify, openPublicPage, tenant }: { appointments: Appointment[]; services: Service[]; changeView: (view: View) => void; notify: (message: string) => void; openPublicPage: (slug: string) => void; tenant: Tenant }) {
  const confirmed = appointments.filter((item) => item.status === 'confirmed').length;
  const publicUrl = `${window.location.origin}/${tenant.slug}`;
  return <div className="mx-auto max-w-[1280px]"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#a2a19b]"><span className="h-2 w-2 rounded-full bg-[#7db486]" /> Sua operação está em dia</div><h1 className="font-display text-[30px] font-semibold tracking-[-0.045em] md:text-[36px]">Tudo sob controle<span className="text-[#e24768]">.</span></h1><p className="mt-1.5 text-sm text-[#95948e]">Acompanhe o movimento do seu comércio hoje.</p></div><div className="flex gap-2"><button onClick={() => openPublicPage(tenant.slug)} className="flex items-center justify-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#242329]/10 transition hover:-translate-y-0.5"><ExternalLink size={15} />Ver página do cliente</button><button onClick={() => changeView('calendar')} className="hidden items-center gap-2 rounded-xl border border-[#e3e2dc] bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-[#242329] sm:flex"><Plus size={15} />Novo agendamento</button></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Agendamentos hoje" value={`${appointments.length}`} change="+12,5%" icon={CalendarDays} accent="pink" /><StatCard label="Clientes confirmados" value={`${confirmed}`} change="+8,2%" icon={UsersRound} accent="green" /><StatCard label="Faturamento previsto" value="R$ 520" change="+18,4%" icon={WalletCards} accent="gold" /><StatCard label="Ocupação da agenda" value="78%" change="+4,1%" icon={BarChart3} accent="blue" /></div><div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><section className="rounded-2xl border border-[#e7e6e0] bg-white p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Agenda de hoje</h2><p className="mt-1 text-xs text-[#a2a19b]">25 de outubro · Domingo</p></div><button onClick={() => changeView('calendar')} className="flex items-center gap-1 text-xs font-semibold text-[#a06945] hover:underline">Ver agenda <ArrowRight size={14} /></button></div><div className="mb-4 flex gap-1 overflow-x-auto pb-1">{['Hoje', 'Amanhã', 'Ter 27', 'Qua 28', 'Qui 29'].map((day, index) => <button key={day} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${index === 0 ? 'bg-[#242329] text-white' : 'text-[#aaa9a3] hover:bg-[#f7f7f5]'}`}>{day}</button>)}</div><div className="space-y-2">{appointments.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} notify={notify} />)}</div></section><section className="rounded-2xl border border-[#e7e6e0] bg-white p-5 md:p-6"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-semibold">Seus serviços</h2><p className="mt-1 text-xs text-[#a2a19b]">O que você oferece hoje</p></div><button onClick={() => changeView('services')} className="rounded-lg p-1.5 text-[#aaa9a3] hover:bg-[#f7f7f5] hover:text-[#242329]"><ArrowRight size={17} /></button></div><div className="space-y-1">{services.slice(0, 4).map((service) => <div key={service.id} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#fafaf8]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6eee8] text-[#a06945]"><Scissors size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{service.name}</p><p className="mt-0.5 text-[11px] text-[#aaa9a3]">{service.duration_minutes} min</p></div><span className="text-[13px] font-bold">{formatCurrency(service.price)}</span></div>)}</div><button onClick={() => changeView('services')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d8d1] py-2.5 text-xs font-semibold text-[#989791] hover:border-[#a06945] hover:text-[#a06945]"><Plus size={15} />Adicionar serviço</button></section></div><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.7fr_1.3fr]"><div className="rounded-2xl bg-[#242329] p-6 text-white"><div className="mb-8 flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Sparkles size={17} className="text-[#e3bb7a]" /></span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#d8d7d1]">DICA DO DIA</span></div><p className="font-display text-[22px] font-medium leading-7 tracking-tight">Compartilhe seu link e deixe os clientes marcarem o próprio horário.</p><p className="mt-3 text-xs leading-5 text-[#a7a6a2]">Menos mensagens para responder, mais tempo para cuidar do seu negócio.</p><button onClick={() => { navigator.clipboard?.writeText(publicUrl); notify('Link copiado para a área de transferência'); }} className="mt-6 flex items-center gap-2 rounded-xl bg-[#e3bb7a] px-4 py-2.5 text-xs font-bold text-[#242329] transition hover:bg-[#f0cc91]"><Copy size={14} />Copiar meu link</button></div><div className="rounded-2xl border border-[#e7e6e0] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Desempenho da semana</h2><p className="mt-1 text-xs text-[#a2a19b]">Agendamentos confirmados</p></div><button className="flex items-center gap-1 rounded-lg bg-[#f7f7f5] px-2.5 py-2 text-[11px] font-semibold">Esta semana <ChevronDown size={13} /></button></div><div className="mt-6 flex h-[110px] items-end justify-between gap-3 px-2">{[['Seg', 42], ['Ter', 61], ['Qua', 49], ['Qui', 77], ['Sex', 88], ['Sáb', 100], ['Dom', 63]].map(([label, height]) => <div key={label as string} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-[34px] rounded-t-lg ${label === 'Sáb' ? 'bg-[#242329]' : 'bg-[#e9e5df]'}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-[#aaa9a3]">{label}</span></div>)}</div></div></div></div>;
}

function StatCard({ label, value, change, icon: Icon, accent }: { label: string; value: string; change: string; icon: typeof CalendarDays; accent: string }) { const colors: Record<string, string> = { pink: 'bg-[#fbe8ed] text-[#d94e70]', green: 'bg-[#e5f1e7] text-[#65916d]', gold: 'bg-[#f7eedf] text-[#b88b49]', blue: 'bg-[#e7eef5] text-[#6685a4]' }; return <div className="rounded-2xl border border-[#e7e6e0] bg-white p-4 md:p-5"><div className="flex items-start justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[accent]}`}><Icon size={17} /></span><span className="rounded-md bg-[#eef7ee] px-1.5 py-1 text-[10px] font-bold text-[#6a9970]">{change}</span></div><p className="mt-5 text-[12px] text-[#96958f]">{label}</p><p className="mt-1 font-display text-[25px] font-semibold tracking-tight">{value}</p></div>; }

function AppointmentRow({ appointment, notify }: { appointment: Appointment; notify: (message: string) => void }) { return <div className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-3 transition hover:border-[#eeeDE8] hover:bg-[#fcfcfa]"><div className="w-[43px] text-center"><p className="text-[13px] font-bold">{appointment.appointment_time}</p><div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#d8d7d1]" /></div><div className="h-9 w-px bg-[#e9e8e2]" /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9dfd9] text-xs font-bold text-[#79594e]">{appointment.customer_name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{appointment.customer_name}</p><p className="mt-0.5 truncate text-[11px] text-[#aaa9a3]">{appointment.service_name}</p></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:block ${appointment.status === 'confirmed' ? 'bg-[#e7f2e8] text-[#65916d]' : 'bg-[#fbf0db] text-[#ad813c]'}`}>{appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</span><button onClick={() => notify(`Agendamento de ${appointment.customer_name} selecionado`)} className="rounded-lg p-1.5 text-[#c2c1bb] opacity-0 transition group-hover:opacity-100 hover:bg-[#f0f0eb] hover:text-[#242329]"><MoreHorizontal size={17} /></button></div>; }

function CalendarView({ appointments, notify }: { appointments: Appointment[]; notify: (message: string) => void }) { return <div className="mx-auto max-w-[1100px]"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-semibold text-[#a2a19b]">Agenda do comércio</p><h1 className="font-display text-[30px] font-semibold tracking-tight">Sua agenda<span className="text-[#e24768]">.</span></h1><p className="mt-1 text-sm text-[#95948e]">Organize o dia sem perder nenhum horário.</p></div><button onClick={() => notify('Use a página do cliente para criar um novo horário')} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Novo horário</button></div><div className="mb-5 flex items-center justify-between rounded-2xl border border-[#e7e6e0] bg-white p-4"><button className="rounded-lg p-2 hover:bg-[#f7f7f5]"><ArrowLeft size={17} /></button><div className="text-center"><p className="font-display text-lg font-semibold">Outubro 2026</p><p className="mt-0.5 text-[11px] text-[#9e9d97]">Domingo, 25 de outubro</p></div><button className="rounded-lg p-2 hover:bg-[#f7f7f5]"><ArrowRight size={17} /></button></div><div className="grid gap-2 md:grid-cols-7">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => <div key={day} className={`rounded-xl p-3 text-center text-xs font-semibold ${index === 0 ? 'bg-[#242329] text-white' : 'bg-white text-[#a5a49e]'}`}>{day}<span className="mt-2 block font-display text-xl">{25 + index}</span></div>)}</div><div className="mt-5 rounded-2xl border border-[#e7e6e0] bg-white p-5"><p className="mb-4 text-xs font-semibold text-[#a2a19b]">Horários de domingo, 25 de outubro</p>{appointments.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} notify={notify} />)}</div></div>; }

function ServicesView({ services, onNew, notify }: { services: Service[]; onNew: () => void; notify: (message: string) => void }) { return <div className="mx-auto max-w-[1100px]"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold text-[#a2a19b]">Catálogo do comércio</p><h1 className="font-display text-[30px] font-semibold tracking-tight">Seus serviços<span className="text-[#e24768]">.</span></h1><p className="mt-1 text-sm text-[#95948e]">Mantenha sua vitrine de serviços sempre atualizada.</p></div><button onClick={onNew} className="flex items-center justify-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Adicionar serviço</button></div><div className="grid gap-3 sm:grid-cols-2">{services.map((service, index) => <div key={service.id} className="group rounded-2xl border border-[#e7e6e0] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#242329]/5"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index % 2 ? 'bg-[#f8e9ed] text-[#d56e87]' : 'bg-[#f6eee8] text-[#a06945]'}`}><Scissors size={18} /></span><button onClick={() => notify('Serviço pronto para edição')} className="rounded-lg p-2 text-[#b1b0a9] opacity-0 transition group-hover:opacity-100 hover:bg-[#f7f7f5] hover:text-[#242329]"><Pencil size={15} /></button></div><h3 className="mt-5 font-display text-lg font-semibold">{service.name}</h3><div className="mt-2 flex items-center gap-2 text-xs text-[#9e9d97]"><Clock3 size={14} />{service.duration_minutes} minutos <span className="text-[#d8d7d1]">·</span><span className="font-semibold text-[#242329]">{formatCurrency(service.price)}</span></div><div className="mt-5 border-t border-[#f0efeb] pt-3 text-[11px] font-semibold text-[#6b9770]"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#7db486]" />Disponível para agendamento</div></div>)}</div></div>; }

function SettingsView({ tenant, setTenant, notify, openPublicPage }: { tenant: Tenant; setTenant: (tenant: Tenant) => void; notify: (message: string) => void; openPublicPage: (slug: string) => void }) { const [selected, setSelected] = useState<ThemeName>(tenant.theme); const save = () => { setTenant({ ...tenant, theme: selected }); notify('Personalização salva com sucesso'); }; const publicUrl = `${window.location.origin}/${tenant.slug}`; return <div className="mx-auto max-w-[1000px]"><div className="mb-8"><p className="mb-2 text-xs font-semibold text-[#a2a19b]">Identidade do comércio</p><h1 className="font-display text-[30px] font-semibold tracking-tight">Personalização<span className="text-[#e24768]">.</span></h1><p className="mt-1 text-sm text-[#95948e]">Deixe a página de agendamento com a cara da sua marca.</p></div><div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]"><div className="rounded-2xl border border-[#e7e6e0] bg-white p-5 md:p-7"><div className="flex items-center justify-between border-b border-[#efeee9] pb-5"><div><h2 className="font-display text-lg font-semibold">Tema da página</h2><p className="mt-1 text-xs text-[#a2a19b]">Escolha uma combinação para seus clientes.</p></div><Palette size={20} className="text-[#aaa9a3]" /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{themeOptions.map((theme) => <button key={theme.id} onClick={() => setSelected(theme.id)} className={`rounded-xl border p-2 text-left transition ${selected === theme.id ? 'border-[#242329] ring-2 ring-[#242329]/10' : 'border-[#e8e7e1] hover:border-[#bbb9b1]'}`}><div className="relative h-20 overflow-hidden rounded-lg" style={{ background: theme.color }}><div className="absolute bottom-0 left-2 right-2 h-6 rounded-t-md bg-white/20" />{selected === theme.id && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white"><Check size={12} className="text-[#242329]" /></span>}</div><p className="mt-2 px-1 text-xs font-semibold">{theme.label}</p><p className="mt-0.5 px-1 pb-1 text-[10px] text-[#aaa9a3]">{theme.description}</p></button>)}</div><button onClick={save} className="mt-6 flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white"><Check size={14} />Salvar personalização</button></div><div className="rounded-2xl bg-[#242329] p-6 text-white"><div className="flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Link2 size={17} className="text-[#e3bb7a]" /></span><button onClick={() => { navigator.clipboard?.writeText(publicUrl); notify('Link público copiado'); }} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><Copy size={15} /></button></div><p className="mt-10 text-xs text-white/50">Seu link público</p><p className="mt-2 break-all font-display text-xl font-medium">{publicUrl.replace(/^https?:\/\//, '')}</p><p className="mt-3 text-xs leading-5 text-white/50">É por esse link que seus clientes vão escolher um serviço e marcar um horário.</p><button onClick={() => openPublicPage(tenant.slug)} className="mt-7 flex items-center gap-2 text-xs font-semibold text-[#e3bb7a]">Abrir página pública <ExternalLink size={14} /></button></div></div></div>; }

function AdminView({ changeView, openPublicPage }: { changeView: (view: View) => void; openPublicPage: (slug: string) => void }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subs, setSubs] = useState<Record<string, Subscription>>({});
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  // Estados para modal de criar/editar comércio
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    category: 'Barbearia',
    phone: '',
    whatsapp: '',
    city: 'São Paulo, SP',
    pix_key: '',
    pix_key_type: 'telefone'
  });

  const load = async () => {
    const client = supabase;
    if (!client) { setLoading(false); return; }
    const [{ data: tenantData, error: tenantError }, { data: subData, error: subError }, { count, error: countError }] = await Promise.all([
      client.from('marco_tenants').select('*').order('name'),
      client.from('marco_subscriptions').select('tenant_id, status, renewal_date'),
      client.from('marco_appointments').select('*', { count: 'exact', head: true }),
    ]);
    if (!tenantError && tenantData) setTenants(tenantData as Tenant[]);
    if (!subError && subData) {
      const map: Record<string, Subscription> = {};
      (subData as Subscription[]).forEach((s) => { map[s.tenant_id] = s; });
      setSubs(map);
    }
    if (!countError && count !== null) setAppointmentsCount(count);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openCreateModal = () => {
    setEditingTenant(null);
    setTenantForm({
      name: '',
      slug: '',
      category: 'Barbearia',
      phone: '',
      whatsapp: '',
      city: 'São Paulo, SP',
      pix_key: '',
      pix_key_type: 'telefone'
    });
    setShowTenantModal(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setTenantForm({
      name: t.name,
      slug: t.slug,
      category: t.category,
      phone: t.phone || '',
      whatsapp: t.whatsapp || '',
      city: t.city || 'São Paulo, SP',
      pix_key: t.pix_key || '',
      pix_key_type: t.pix_key_type || 'telefone'
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e: FormEvent) => {
    e.preventDefault();
    const client = supabase;
    if (!client) return;

    const payload = {
      name: tenantForm.name,
      slug: tenantForm.slug || tenantForm.name.toLowerCase().replace(/\s+/g, '-'),
      category: tenantForm.category,
      phone: tenantForm.phone,
      whatsapp: tenantForm.whatsapp,
      city: tenantForm.city,
      pix_key: tenantForm.pix_key,
      pix_key_type: tenantForm.pix_key_type,
      theme: 'dark'
    };

    if (editingTenant) {
      // Editar
      const { error } = await client.from('marco_tenants').update(payload).eq('id', editingTenant.id);
      if (!error) {
        setShowTenantModal(false);
        void load();
      } else {
        alert('Erro ao atualizar comércio: ' + error.message);
      }
    } else {
      // Criar novo
      const { data, error } = await client.from('marco_tenants').insert(payload).select().maybeSingle();
      if (!error && data) {
        // Criar assinatura inicial paga/pendente
        await client.from('marco_subscriptions').insert({ tenant_id: data.id, status: 'paid', renewal_date: new Date().toISOString().slice(0, 10) });
        setShowTenantModal(false);
        void load();
      } else {
        alert('Erro ao cadastrar comércio: ' + (error?.message || 'Verifique se o slug é único'));
      }
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o comércio "${name}"? Essa ação não pode ser desfeita.`)) return;
    const client = supabase;
    if (!client) return;

    const { error } = await client.from('marco_tenants').delete().eq('id', id);
    if (!error) {
      void load();
    } else {
      alert('Erro ao excluir comércio: ' + error.message);
    }
  };

  const markPaid = async (tenantId: string) => {
    const client = supabase;
    if (!client) return;
    const today = new Date();
    const renewal = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setSubs((prev) => ({ ...prev, [tenantId]: { ...prev[tenantId], status: 'paid', renewal_date: renewal } }));
    const { error } = await client.from('marco_subscriptions').update({ status: 'paid', renewal_date: renewal }).eq('tenant_id', tenantId);
    if (error) { void load(); }
  };

  const total = tenants.length;
  const paidCount = Object.values(subs).filter((s) => s.status === 'paid').length;
  const pendingCount = Object.values(subs).filter((s) => s.status === 'pending').length;
  const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const filtered = tenants.filter((t) => {
    const matchesQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase()) || t.city.toLowerCase().includes(query.toLowerCase());
    const sub = subs[t.id];
    const matchesStatus = filterStatus === 'all' || (sub && sub.status === filterStatus);
    return matchesQuery && matchesStatus;
  });

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold text-[#a2a19b]">Gestão Marcô</p>
          <h1 className="font-display text-[30px] font-semibold tracking-tight">Super Admin<span className="text-[#e24768]">.</span></h1>
          <p className="mt-1 text-sm text-[#95948e]">Acompanhe comércios, mensalidades e pagamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreateModal} className="flex items-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#242329]/10">
            <Plus size={15} /> Novo Comércio
          </button>
          <button onClick={() => changeView('dashboard')} className="hidden items-center gap-2 rounded-xl border border-[#e4e3dd] bg-white px-4 py-2.5 text-xs font-semibold sm:flex">
            <ArrowLeft size={15} /> Voltar ao comércio
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Comércios ativos" value={loading ? '—' : `${total}`} change={total > 0 ? 'cadastrados' : 'nenhum'} icon={Store} accent="blue" />
        <StatCard label="Mensalidades pagas" value={loading ? '—' : `${paidCount}`} change={total > 0 ? `${Math.round((paidCount / total) * 100)}%` : '0%'} icon={WalletCards} accent="green" />
        <StatCard label="Pagamentos pendentes" value={loading ? '—' : `${pendingCount}`} change={pendingCount > 0 ? 'atenção' : 'em dia'} icon={BarChart3} accent="pink" />
        <StatCard label="Agendamentos no total" value={loading ? '—' : `${appointmentsCount}`} change="histórico" icon={CalendarDays} accent="gold" />
      </div>

      <div className="mt-6 rounded-2xl border border-[#e7e6e0] bg-white p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Todos os comércios</h2>
            <p className="mt-1 text-xs text-[#a2a19b]">{loading ? 'Carregando...' : `${filtered.length} de ${total} comércios`}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb9b1]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, ramo ou cidade" className="w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#242329] sm:w-64" />
            </div>
            <div className="flex gap-1 rounded-xl bg-[#f7f7f5] p-1">
              <button onClick={() => setFilterStatus('all')} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${filterStatus === 'all' ? 'bg-white text-[#242329] shadow-sm' : 'text-[#9b9a93]'}`}>Todos</button>
              <button onClick={() => setFilterStatus('paid')} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${filterStatus === 'paid' ? 'bg-white text-[#5d8068] shadow-sm' : 'text-[#9b9a93]'}`}>Pagos</button>
              <button onClick={() => setFilterStatus('pending')} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${filterStatus === 'pending' ? 'bg-white text-[#d94e70] shadow-sm' : 'text-[#9b9a93]'}`}>Pendentes</button>
            </div>
          </div>
        </div>

        <div className="max-h-[440px] overflow-y-auto overflow-x-auto rounded-xl border border-[#efeee9]">
          <table className="w-full min-w-[720px] text-left">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-[#efeee9] text-[10px] uppercase tracking-[0.12em] text-[#aaa9a3]">
                <th className="px-4 py-3 font-semibold">Comércio</th>
                <th className="px-4 py-3 font-semibold">Cidade</th>
                <th className="px-4 py-3 font-semibold">Mensalidade</th>
                <th className="px-4 py-3 font-semibold">Renovação</th>
                <th className="px-4 py-3 font-semibold">Link</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#aaa9a3]">Carregando comércios...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#aaa9a3]">Nenhum comércio encontrado.</td></tr>}
              {!loading && filtered.map((item) => {
                const sub = subs[item.id];
                const isPaid = sub?.status === 'paid';
                return (
                  <tr key={item.id} className="border-b border-[#f2f1ec] last:border-0 hover:bg-[#fafaf8]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4e9e3] text-[10px] font-bold text-[#805d4e]">{initialsOf(item.name)}</span>
                        <div>
                          <p className="text-[13px] font-semibold">{item.name}</p>
                          <p className="mt-0.5 text-[11px] text-[#aaa9a3]">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#77766f]">{item.city}</td>
                    <td className="px-4 py-4">
                      {isPaid ? (
                        <span className="rounded-full bg-[#e7f2e8] px-2.5 py-1 text-[10px] font-bold text-[#65916d]">Pago</span>
                      ) : (
                        <button onClick={() => markPaid(item.id)} className="rounded-full bg-[#fbf0db] px-2.5 py-1 text-[10px] font-bold text-[#ad813c] transition hover:bg-[#f5e6c2]">Marcar pago</button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#77766f]">{sub ? formatDate(sub.renewal_date) : '—'}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => openPublicPage(item.slug)} className="flex items-center gap-1 text-[11px] font-semibold text-[#a06945] hover:underline">
                        <Link2 size={12} />/{item.slug}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(item)} title="Editar comércio" className="rounded-lg p-2 text-[#77766f] hover:bg-[#f7f7f5] hover:text-[#242329]">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteTenant(item.id, item.name)} title="Excluir comércio" className="rounded-lg p-2 text-[#d94e70] hover:bg-[#fbe8ed]">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CADASTRAR / EDITAR COMÉRCIO */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202127]/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveTenant} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">{editingTenant ? 'Editar comércio' : 'Novo comércio'}</h2>
                <p className="mt-1 text-xs text-[#a2a19b]">{editingTenant ? 'Altere as informações do estabelecimento' : 'Cadastre um novo estabelecimento na plataforma'}</p>
              </div>
              <button type="button" onClick={() => setShowTenantModal(false)} className="rounded-xl p-2 text-[#aaa9a3] hover:bg-[#f7f7f5]"><X size={18} /></button>
            </div>

            <div className="mt-5 space-y-3 text-xs font-semibold">
              <label className="block">
                Nome do Comércio
                <input
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                  placeholder="Ex: Barbearia Estilo"
                  className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none focus:border-[#242329]"
                />
              </label>

              <label className="block">
                Link Público (Slug)
                <input
                  value={tenantForm.slug}
                  onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value })}
                  required
                  placeholder="barbearia-estilo"
                  className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none focus:border-[#242329]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Categoria
                  <select
                    value={tenantForm.category}
                    onChange={(e) => setTenantForm({ ...tenantForm, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none"
                  >
                    <option value="Barbearia">Barbearia</option>
                    <option value="Salão de Beleza">Salão de Beleza</option>
                    <option value="Esmalteria / Nails">Esmalteria / Nails</option>
                    <option value="Estética">Estética</option>
                  </select>
                </label>

                <label className="block">
                  Cidade
                  <input
                    value={tenantForm.city}
                    onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                    placeholder="São Paulo, SP"
                    className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none focus:border-[#242329]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  WhatsApp (com DDD)
                  <input
                    value={tenantForm.whatsapp}
                    onChange={(e) => setTenantForm({ ...tenantForm, whatsapp: e.target.value })}
                    required
                    placeholder="5511999998888"
                    className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none focus:border-[#242329]"
                  />
                </label>

                <label className="block">
                  Chave Pix
                  <input
                    value={tenantForm.pix_key}
                    onChange={(e) => setTenantForm({ ...tenantForm, pix_key: e.target.value })}
                    placeholder="Chave Pix do comércio"
                    className="mt-1.5 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] p-3 outline-none focus:border-[#242329]"
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-semibold text-white">
              {editingTenant ? 'Salvar alterações' : 'Cadastrar comércio'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function NewServiceModal({ onClose, onSave }: { onClose: () => void; onSave: (service: Omit<Service, 'id'>) => void | Promise<void> }) { const [name, setName] = useState(''); const [duration, setDuration] = useState('45'); const [price, setPrice] = useState(''); const submit = (event: FormEvent) => { event.preventDefault(); if (name && price) onSave({ name, duration_minutes: Number(duration), price: Number(price.replace(',', '.')), active: true }); }; return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#202127]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"><form onSubmit={submit} className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-semibold">Novo serviço</h2><p className="mt-1 text-xs text-[#a2a19b]">Adicione uma opção à sua vitrine.</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-[#aaa9a3] hover:bg-[#f7f7f5]"><X size={18} /></button></div><label className="mt-6 block text-xs font-semibold">Nome do serviço<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#242329]" placeholder="Ex: Corte infantil" /></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="block text-xs font-semibold">Duração<select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none"><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="75">75 minutos</option></select></label><label className="block text-xs font-semibold">Preço<input value={price} onChange={(event) => setPrice(event.target.value)} required type="text" inputMode="decimal" className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#242329]" placeholder="45,00" /></label></div><button className="mt-6 w-full rounded-xl bg-[#242329] py-3 text-sm font-semibold text-white">Adicionar serviço</button></form></div>; }

function BookingPage({ tenant, services, professionals, onBack, notify }: { tenant: Tenant; services: Service[]; professionals: Professional[]; onBack: () => void; notify: (message: string) => void }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(professionals[0] ?? null);
  const [date, setDate] = useState('25');
  const [time, setTime] = useState('10:30');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'local'>('local');
  const [pixCopied, setPixCopied] = useState(false);
  const dates = [{ day: 'Hoje', date: '25', weekday: 'DOM' }, { day: 'Amanhã', date: '26', weekday: 'SEG' }, { day: 'Ter', date: '27', weekday: 'TER' }, { day: 'Qua', date: '28', weekday: 'QUA' }];
  const times = ['09:00', '09:45', '10:30', '11:15', '13:30', '14:15', '15:00', '16:30'];

  const pixKey = selectedProfessional?.pix_key || tenant.pix_key || '';
  const pixKeyTypeLabel: Record<string, string> = { telefone: 'Telefone', email: 'E-mail', cpf: 'CPF', aleatoria: 'Chave aleatória' };
  const servicePrice = selectedService?.price ?? 0;

  const copyPix = () => {
    if (!pixKey) { notify('Este comércio ainda não cadastrou uma chave Pix'); return; }
    navigator.clipboard?.writeText(pixKey);
    setPixCopied(true);
    window.setTimeout(() => setPixCopied(false), 2200);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !phone || !selectedService) return;
    const client = supabase;
    if (client && tenant.id !== fallbackTenant.id) {
      const { error } = await client.from('marco_appointments').insert({ tenant_id: tenant.id, service_id: selectedService.id, professional_id: selectedProfessional?.id ?? null, customer_name: name, customer_phone: phone, appointment_date: `2026-10-${date}`, appointment_time: time, status: 'confirmed', payment_method: paymentMethod, payment_status: paymentMethod === 'pix' ? 'pending' : 'local' });
      if (error) notify('Não foi possível salvar agora, mas você ainda pode enviar a mensagem');
    }
    const paymentLabel = paymentMethod === 'pix' ? 'Pagamento online via Pix' : 'Pagamento no local';
    const pixLine = paymentMethod === 'pix' && pixKey ? `%0A*Pagamento:* Pix (chave: ${pixKey})` : `%0A*Pagamento:* No local`;
    const message = `Olá, ${tenant.name}! Gostaria de confirmar meu agendamento.%0A%0A*Cliente:* ${name}%0A*Serviço:* ${selectedService.name}%0A*Profissional:* ${selectedProfessional?.name ?? 'Equipe'}%0A*Data:* ${date} de outubro%0A*Horário:* ${time}%0A*Telefone:* ${phone}%0A*Valor:* ${formatCurrency(servicePrice)}%0A*Forma de pagamento:* ${paymentLabel}${pixLine}`;
    window.open(`https://wa.me/${tenant.whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
    setStep(4);
  };

  return <div className="min-h-screen bg-[#f4f1eb] pb-12"><header className="flex items-center justify-between border-b border-[#e2ddd3] bg-[#f8f6f1] px-5 py-4 md:px-10"><button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-[#77736c]"><ArrowLeft size={16} />Área do comércio</button><div className="flex items-center gap-2"><img src="/logo.png" alt="Marcô" className="h-8 w-8 rounded-lg object-cover" /><span className="font-display text-lg font-semibold">Marcô<span className="text-[#e24768]">.</span></span></div><span className="w-24 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#a39e94]">Agendamento</span></header><div className="mx-auto max-w-[620px] px-5 pt-10 md:pt-16"><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#242329] text-white shadow-xl shadow-[#242329]/15"><Scissors size={25} /></div><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a06945]">{tenant.category}</p><h1 className="mt-2 font-display text-[30px] font-semibold tracking-[-0.04em] text-[#292722]">{tenant.name}</h1><p className="mt-2 text-sm text-[#969087]">Escolha um serviço e reserve seu momento.</p></div>{step < 4 && <div className="mx-auto mt-9 flex max-w-[390px] items-center justify-center gap-2"><StepNumber number={1} active={step >= 1} label="Serviço" /><div className="h-px w-10 bg-[#d8d1c5]" /><StepNumber number={2} active={step >= 2} label="Horário" /><div className="h-px w-10 bg-[#d8d1c5]" /><StepNumber number={3} active={step >= 3} label="Confirmar" /></div>}{step === 1 && <div className="mt-9 space-y-3">{services.map((service) => <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className="flex w-full items-center gap-4 rounded-2xl border border-[#e3ddd3] bg-[#fcfaf6] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#a06945] hover:shadow-lg hover:shadow-[#a06945]/5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0e4d9] text-[#a06945]"><Scissors size={18} /></span><span className="flex-1"><strong className="block font-display text-base font-semibold text-[#37332d]">{service.name}</strong><small className="mt-1 flex items-center gap-1 text-xs text-[#9a948b]"><Clock3 size={13} />{service.duration_minutes} minutos</small></span><span className="text-sm font-bold text-[#37332d]">{formatCurrency(service.price)}</span><ArrowRight size={17} className="text-[#b4aea4]" /></button>)}</div>}{step === 2 && <div className="mt-9 rounded-2xl border border-[#e3ddd3] bg-[#fcfaf6] p-5"><button onClick={() => setStep(1)} className="mb-6 flex items-center gap-1 text-xs font-semibold text-[#a06945]"><ArrowLeft size={14} /> Trocar serviço</button><div className="rounded-xl bg-[#f3eee6] p-3"><p className="text-xs text-[#9a948b]">Você escolheu</p><p className="mt-1 font-display text-base font-semibold">{selectedService?.name} <span className="font-sans text-sm text-[#a06945]">· {formatCurrency(selectedService?.price ?? 0)}</span></p></div><p className="mt-6 text-sm font-semibold text-[#37332d]">Escolha a profissional</p><div className="mt-3 grid grid-cols-3 gap-2">{professionals.map((professional) => <button key={professional.id} onClick={() => setSelectedProfessional(professional)} className={`rounded-xl border p-2 text-left ${selectedProfessional?.id === professional.id ? 'border-[#a06945] bg-[#f3e4d9]' : 'border-[#e3ddd3] bg-white'}`}><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#242329] text-[10px] font-bold text-white">{professional.photo_url ? <img src={professional.photo_url} alt={professional.name} className="h-full w-full object-cover" /> : professional.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong className="mt-2 block truncate text-xs text-[#37332d]">{professional.name.split(' ')[0]}</strong><small className="mt-0.5 block truncate text-[10px] text-[#9a948b]">{professional.role}</small></button>)}</div><p className="mt-6 text-sm font-semibold text-[#37332d]">Escolha o dia</p><div className="mt-3 grid grid-cols-4 gap-2">{dates.map((item) => <button key={item.date} onClick={() => setDate(item.date)} className={`rounded-xl border py-3 ${date === item.date ? 'border-[#242329] bg-[#242329] text-white' : 'border-[#e3ddd3] bg-white text-[#77736c]'}`}><span className="block text-[10px] font-bold uppercase">{item.weekday}</span><strong className="mt-1 block font-display text-lg">{item.date}</strong><small className="block text-[10px]">{item.day}</small></button>)}</div><p className="mt-6 text-sm font-semibold text-[#37332d]">Escolha o horário</p><div className="mt-3 grid grid-cols-4 gap-2">{times.map((item) => <button key={item} onClick={() => setTime(item)} className={`rounded-lg border py-2.5 text-xs font-semibold ${time === item ? 'border-[#a06945] bg-[#a06945] text-white' : 'border-[#e3ddd3] bg-white text-[#77736c] hover:border-[#a06945]'}`}>{item}</button>)}</div><button onClick={() => setStep(3)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#242329] py-3 text-sm font-semibold text-white">Continuar <ArrowRight size={15} /></button></div>}{step === 3 && <form onSubmit={submit} className="mt-9 rounded-2xl border border-[#e3ddd3] bg-[#fcfaf6] p-5"><button type="button" onClick={() => setStep(2)} className="mb-6 flex items-center gap-1 text-xs font-semibold text-[#a06945]"><ArrowLeft size={14} /> Voltar aos horários</button><div className="flex items-center gap-3 rounded-xl bg-[#f3eee6] p-4"><CalendarDays size={18} className="text-[#a06945]" /><div><p className="text-xs text-[#9a948b]">Seu horário</p><p className="mt-1 text-sm font-semibold">{selectedService?.name} · {date} de outubro às {time}</p></div></div><div className="mt-4 rounded-2xl border border-[#e8dec9] bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e9d9] text-[#a06945]"><WalletCards size={18} /></span><span className="rounded-full bg-[#f7f0e6] px-2.5 py-1 text-[10px] font-bold text-[#a06945]">VALOR DO SERVIÇO</span></div><p className="mt-4 text-xs text-[#9a948b]">{selectedService?.name} · {selectedService?.duration_minutes} min</p><p className="mt-1 font-display text-[34px] font-semibold tracking-tight text-[#37332d]">{formatCurrency(servicePrice)}</p><p className="mt-1 text-[11px] text-[#aaa39a]">{selectedProfessional ? `Atendido por ${selectedProfessional.name}` : 'Atendimento pela equipe'}</p></div><p className="mt-6 text-sm font-semibold text-[#37332d]">Forma de pagamento</p><div className="mt-3 grid gap-2"><button type="button" onClick={() => setPaymentMethod('pix')} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === 'pix' ? 'border-[#a06945] bg-[#f7eee2] ring-1 ring-[#a06945]/20' : 'border-[#e3ddd3] bg-white hover:border-[#c4b39a]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${paymentMethod === 'pix' ? 'bg-[#a06945] text-white' : 'bg-[#f3eee6] text-[#a06945]'}`}><QrCode size={18} /></span><span className="flex-1"><strong className="block text-sm font-semibold text-[#37332d]">Pagar agora via Pix</strong><small className="mt-0.5 block text-[11px] text-[#9a948b]">Use a chave Pix cadastrada para transferir o valor do serviço.</small>{paymentMethod === 'pix' && pixKey && <span className="mt-3 block rounded-lg bg-[#fcfaf6] p-3"><span className="block text-[10px] font-bold uppercase tracking-wide text-[#aaa39a]">Chave Pix ({pixKeyTypeLabel[tenant.pix_key_type] ?? 'Pix'})</span><span className="mt-1 flex items-center gap-2 break-all text-sm font-semibold text-[#37332d]">{pixKey}<button type="button" onClick={copyPix} className="ml-1 flex items-center gap-1 rounded-md bg-[#f3eee6] px-2 py-1 text-[10px] font-bold text-[#a06945] hover:bg-[#ece0d0]">{pixCopied ? <><Check size={11} />Copiada</> : <><Copy size={11} />Copiar</>}</button></span></span>}{paymentMethod === 'pix' && !pixKey && <span className="mt-2 block rounded-lg bg-[#fbf0db] p-2 text-[11px] font-semibold text-[#ad813c]">Este comércio ainda não cadastrou uma chave Pix. Escolha pagar no local.</span>}</span></button><button type="button" onClick={() => setPaymentMethod('local')} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === 'local' ? 'border-[#a06945] bg-[#f7eee2] ring-1 ring-[#a06945]/20' : 'border-[#e3ddd3] bg-white hover:border-[#c4b39a]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${paymentMethod === 'local' ? 'bg-[#a06945] text-white' : 'bg-[#f3eee6] text-[#a06945]'}`}><WalletCards size={18} /></span><span className="flex-1"><strong className="block text-sm font-semibold text-[#37332d]">Pagar no local</strong><small className="mt-0.5 block text-[11px] text-[#9a948b]">Combine o pagamento direto com o comércio no dia do atendimento.</small></span></button></div><p className="mt-7 text-sm font-semibold text-[#37332d]">Seus dados</p><label className="mt-3 block text-xs font-semibold text-[#625d55]">Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-[#e3ddd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#a06945]" placeholder="Como podemos te chamar?" /></label><label className="mt-3 block text-xs font-semibold text-[#625d55]">WhatsApp<input value={phone} onChange={(event) => setPhone(event.target.value)} required className="mt-2 w-full rounded-xl border border-[#e3ddd3] bg-white px-3 py-3 text-sm outline-none focus:border-[#a06945]" placeholder="(11) 99999-9999" /></label><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3c8b54] py-3 text-sm font-semibold text-white shadow-lg shadow-[#3c8b54]/15">Confirmar pelo WhatsApp <ArrowRight size={15} /></button><p className="mt-3 text-center text-[10px] text-[#a39d93]">Você será direcionado para o WhatsApp do comércio.</p></form>}{step === 4 && <div className="mt-10 rounded-3xl border border-[#dfd8ce] bg-[#fcfaf6] p-8 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dceedd] text-[#5d9167]"><Check size={25} /></span><h2 className="mt-5 font-display text-2xl font-semibold text-[#37332d]">Quase tudo pronto!</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#938c82]">Sua mensagem foi preparada com o valor de <strong className="font-semibold text-[#37332d]">{formatCurrency(servicePrice)}</strong> e a forma de pagamento <strong className="font-semibold text-[#37332d]">{paymentMethod === 'pix' ? 'Pix online' : 'no local'}</strong>. Envie pelo WhatsApp para confirmar com {tenant.name}.</p><button onClick={onBack} className="mt-7 rounded-xl bg-[#242329] px-5 py-3 text-xs font-semibold text-white">Voltar para o início</button></div>}<p className="mt-12 text-center text-[11px] text-[#a39e94]">Agendamento fácil com <strong className="font-semibold text-[#77736c]">Marcô</strong></p></div></div>;
}
function StepNumber({ number, active, label }: { number: number; active: boolean; label: string }) { return <div className="flex flex-col items-center gap-1.5"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${active ? 'bg-[#242329] text-white' : 'bg-[#e2ddd4] text-[#989188]'}`}>{number}</span><span className={`text-[10px] font-semibold ${active ? 'text-[#4c4740]' : 'text-[#aaa39a]'}`}>{label}</span></div>; }

function NotFoundView({ onBack }: { onBack: () => void }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-5 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#242329] text-white"><Store size={26} /></span><h1 className="mt-6 font-display text-[30px] font-semibold tracking-tight text-[#292722]">Comércio não encontrado<span className="text-[#e24768]">.</span></h1><p className="mt-2 max-w-sm text-sm text-[#95948e]">O link que você acessou não corresponde a nenhum comércio cadastrado no Marcô. Confira o endereço ou volte para o início.</p><button onClick={onBack} className="mt-7 flex items-center gap-2 rounded-xl bg-[#242329] px-5 py-3 text-xs font-semibold text-white"><ArrowLeft size={15} />Voltar para o início</button></div>;
}

export default App;
