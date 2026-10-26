import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { Camera, Check, Pencil, Plus, X, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type Professional = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  active: boolean;
  photo_url?: string;
  pix_key?: string;
  pix_key_type?: string;
};

type Tenant = { id: string };

type ProfessionalsViewProps = {
  professionals: Professional[];
  setProfessionals: (professionals: Professional[]) => void;
  tenant: Tenant;
  notify: (message: string) => void;
};

const PIX_TYPES = [
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'cpf', label: 'CPF/CNPJ' },
  { value: 'aleatoria', label: 'Chave aleatória' },
];

const ROLES = ['Profissional', 'Especialista', 'Barbeiro', 'Manicure', 'Cabeleireira', 'Esteticista', 'Maquiadora', 'Tatuador', 'Massoterapeuta', 'Depiladora'];

const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const BUCKET = 'marco-professional-photos';

export default function ProfessionalsView({ professionals, setProfessionals, tenant, notify }: ProfessionalsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Profissional');
  const [specialty, setSpecialty] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('telefone');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setRole('Profissional');
    setSpecialty('');
    setPixKey('');
    setPixKeyType('telefone');
    setPhotoUrl('');
    setPhotoPreview('');
    setShowForm(true);
  };

  const openEdit = (professional: Professional) => {
    setEditingId(professional.id);
    setName(professional.name);
    setRole(professional.role);
    setSpecialty(professional.specialty);
    setPixKey(professional.pix_key ?? '');
    setPixKeyType(professional.pix_key_type ?? 'telefone');
    setPhotoUrl(professional.photo_url ?? '');
    setPhotoPreview(professional.photo_url ?? '');
    setShowForm(true);
  };

  const uploadPhoto = async (file: File, targetId: string): Promise<string | null> => {
    const client = supabase;
    if (!client || tenant.id === 'demo-tenant') {
      return URL.createObjectURL(file);
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${targetId}/${Date.now()}.${ext}`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) {
      notify('Não foi possível enviar a foto');
      return null;
    }
    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      notify('A foto precisa ter no máximo 4 MB');
      return;
    }
    setUploadingPhoto(true);
    setPhotoPreview(URL.createObjectURL(file));
    const targetId = editingId ?? `temp-${Date.now()}`;
    const url = await uploadPhoto(file, targetId);
    setUploadingPhoto(false);
    if (url) setPhotoUrl(url);
    else setPhotoPreview('');
  };

  const removePhoto = () => {
    setPhotoUrl('');
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      role,
      specialty: specialty.trim(),
      pix_key: pixKey.trim(),
      pix_key_type: pixKeyType,
      photo_url: photoUrl,
    };
    const client = supabase;
    if (client && tenant.id !== 'demo-tenant') {
      if (editingId) {
        const { data, error } = await client
          .from('marco_professionals')
          .update(payload)
          .eq('id', editingId)
          .select()
          .maybeSingle();
        if (!error && data) {
          setProfessionals(professionals.map((p) => (p.id === editingId ? { ...(data as Professional) } : p)));
        } else {
          setProfessionals(professionals.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
        }
        notify('Profissional atualizado com sucesso');
      } else {
        const { data, error } = await client
          .from('marco_professionals')
          .insert({ ...payload, active: true, tenant_id: tenant.id })
          .select()
          .maybeSingle();
        if (!error && data) setProfessionals([...professionals, data as Professional]);
        else setProfessionals([...professionals, { ...payload, active: true, id: `professional-${Date.now()}` }]);
        notify('Profissional cadastrado com sucesso');
      }
    } else {
      if (editingId) {
        setProfessionals(professionals.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
        notify('Profissional atualizado com sucesso');
      } else {
        setProfessionals([...professionals, { ...payload, active: true, id: `professional-${Date.now()}` }]);
        notify('Profissional cadastrado com sucesso');
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
  };

  const toggleActive = async (professional: Professional) => {
    const next = !professional.active;
    setProfessionals(professionals.map((p) => (p.id === professional.id ? { ...p, active: next } : p)));
    const client = supabase;
    if (client && tenant.id !== 'demo-tenant') {
      const { error } = await client.from('marco_professionals').update({ active: next }).eq('id', professional.id);
      if (error) {
        setProfessionals(professionals.map((p) => (p.id === professional.id ? { ...p, active: !next } : p)));
        notify('Não foi possível atualizar o status');
        return;
      }
    }
    notify(next ? 'Profissional liberado para agendamento' : 'Profissional pausado');
  };

  const pixTypeLabel = (type?: string) => PIX_TYPES.find((t) => t.value === type)?.label ?? 'Telefone';

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-semibold text-[#a2a19b]">Equipe do comércio</p><h1 className="font-display text-[30px] font-semibold tracking-tight">Profissionais<span className="text-[#e24768]">.</span></h1><p className="mt-1 text-sm text-[#95948e]">Cadastre quem atende, defina a chave Pix de cada um e mostre a equipe na página de agendamento.</p></div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-[#242329] px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15} />Cadastrar profissional</button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#e7e6e0] bg-white p-5"><p className="text-xs text-[#999892]">Total da equipe</p><p className="mt-2 font-display text-3xl font-semibold">{professionals.length}</p></div><div className="rounded-2xl border border-[#e7e6e0] bg-white p-5"><p className="text-xs text-[#999892]">Ativos para agendamento</p><p className="mt-2 font-display text-3xl font-semibold text-[#65916d]">{professionals.filter((item) => item.active).length}</p></div><div className="rounded-2xl border border-[#e7e6e0] bg-white p-5"><p className="text-xs text-[#999892]">Com chave Pix própria</p><p className="mt-2 font-display text-3xl font-semibold text-[#a06945]">{professionals.filter((item) => item.pix_key).length}</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((professional, index) => (
          <div key={professional.id} className="group rounded-2xl border border-[#e7e6e0] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#242329]/5">
            <div className="flex items-start justify-between">
              <span className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold ${index % 2 ? 'bg-[#f8e9ed] text-[#b75e77]' : 'bg-[#f3e6dc] text-[#86624d]'}`}>{professional.photo_url ? <img src={professional.photo_url} alt={professional.name} className="h-full w-full object-cover" /> : initialsOf(professional.name)}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(professional)} className="rounded-lg p-2 text-[#b1b0a9] transition hover:bg-[#f7f7f5] hover:text-[#242329]" title="Editar profissional"><Pencil size={15} /></button>
                <button onClick={() => toggleActive(professional)} className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${professional.active ? 'bg-[#e7f2e8] text-[#65916d] hover:bg-[#dceedd]' : 'bg-[#f3eee6] text-[#9e9d97] hover:bg-[#ece0d0]'}`} title={professional.active ? 'Pausar' : 'Reativar'}>{professional.active ? 'Ativo' : 'Pausado'}</button>
              </div>
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{professional.name}</h3>
            <p className="mt-1 text-xs font-semibold text-[#a06945]">{professional.role}</p>
            <p className="mt-2 text-xs text-[#9e9d97]">{professional.specialty || 'Especialista do seu time'}</p>
            <div className="mt-4 rounded-xl border border-[#f0efeb] bg-[#fafaf8] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#aaa9a3]">Chave Pix</span>
                {professional.pix_key && <button onClick={() => { navigator.clipboard?.writeText(professional.pix_key!); notify('Chave Pix copiada'); }} className="text-[#b1b0a9] hover:text-[#242329]"><Copy size={13} /></button>}
              </div>
              {professional.pix_key ? (
                <>
                  <p className="mt-1.5 break-all text-[13px] font-semibold text-[#37332d]">{professional.pix_key}</p>
                  <p className="mt-0.5 text-[10px] text-[#aaa9a3]">{pixTypeLabel(professional.pix_key_type)}</p>
                </>
              ) : (
                <p className="mt-1.5 text-[11px] text-[#b1b0a9]">Usa a chave Pix do comércio</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#202127]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">{editingId ? 'Editar profissional' : 'Cadastrar profissional'}</h2>
                <p className="mt-1 text-xs text-[#a2a19b]">{editingId ? 'Atualize a foto, os dados e a chave Pix.' : 'Adicione alguém à sua equipe.'}</p>
              </div>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl p-2 text-[#aaa9a3] hover:bg-[#f7f7f5]"><X size={18} /></button>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="relative">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#f3e6dc] text-xl font-bold text-[#86624d]">
                  {photoPreview ? <img src={photoPreview} alt="Prévia" className="h-full w-full object-cover" /> : initialsOf(name || '?')}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#37332d]">Foto de perfil</p>
                <p className="mt-0.5 text-[11px] text-[#aaa9a3]">JPG, PNG ou WebP. Máx 4 MB.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="flex items-center gap-1.5 rounded-xl bg-[#242329] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"><Camera size={13} />{uploadingPhoto ? 'Enviando...' : photoUrl || photoPreview ? 'Trocar foto' : 'Enviar foto'}</button>
                  {(photoUrl || photoPreview) && <button type="button" onClick={removePhoto} className="rounded-xl border border-[#e5e4de] bg-white px-3 py-2 text-[11px] font-semibold text-[#9e9d97] hover:bg-[#f7f7f5]">Remover</button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} className="hidden" />
              </div>
            </div>
            <label className="mt-6 block text-xs font-semibold">Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#242329]" placeholder="Ex: Marina Oliveira" /></label>
            <label className="mt-4 block text-xs font-semibold">Cargo<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#242329]">{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
            <label className="mt-4 block text-xs font-semibold">Especialidade<input value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#242329]" placeholder="Ex: Cortes e coloração" /></label>
            <div className="mt-5 rounded-2xl border border-[#f0efeb] bg-[#fafaf8] p-4">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3e9d9] text-[#a06945]"><Copy size={13} /></span><p className="text-xs font-semibold text-[#37332d]">Chave Pix individual</p></div>
              <p className="mt-1 text-[11px] text-[#aaa9a3]">Se preenchida, o cliente paga este profissional direto. Se deixar em branco, usa a chave do comércio.</p>
              <label className="mt-3 block text-xs font-semibold">Tipo de chave<select value={pixKeyType} onChange={(event) => setPixKeyType(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-white px-3 py-3 text-sm outline-none focus:border-[#242329]">{PIX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label className="mt-3 block text-xs font-semibold">Chave Pix<input value={pixKey} onChange={(event) => setPixKey(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e5e4de] bg-white px-3 py-3 text-sm outline-none focus:border-[#242329]" placeholder={pixKeyType === 'email' ? 'email@exemplo.com' : pixKeyType === 'telefone' ? '5511999999999' : pixKeyType === 'cpf' ? '123.456.789-00' : 'chave-aleatoria-123'} /></label>
            </div>
            <button disabled={saving || uploadingPhoto} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#242329] py-3 text-sm font-semibold text-white disabled:opacity-60"><Check size={15} />{editingId ? 'Salvar alterações' : 'Cadastrar profissional'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
