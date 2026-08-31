import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Send, Users, Bell, MessageCircle, Plus, Image as ImageIcon, 
  CheckCircle2, Clock, AlertTriangle, Tag, RefreshCw, Sparkles, Filter, 
  Check, X, Play, Pause, ShieldAlert, Sliders, Calendar, Download, Search, CheckSquare, Square
} from 'lucide-react';
import { WhatsAppCampaign, Customer, ReminderConfig } from '../../shared/types';

interface WhatsAppContact {
  id: string;
  name?: string;
  pushName?: string;
  phone: string;
}

export default function CampaignsManager() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'crm' | 'reminders'>('campaigns');
  
  // Campaigns State
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    messageTemplate: `👋 Hola {{nombre}}, tenemos una promoción especial para ti en {{negocio}}:

🎉 ¡Aprovecha hoy un 15% de descuento en todos nuestros productos y servicios!

Puedes ver nuestro catálogo completo aquí.`,
    mediaUrl: '',
    targetSegment: 'all' as 'all' | 'orders' | 'bookings' | 'tag' | 'custom_contacts',
    targetTag: '',
    isScheduled: false,
    scheduledFor: '',
    targetContacts: [] as Array<{ phone: string; name?: string }>
  });
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // WhatsApp Contacts Import Modal
  const [showContactImportModal, setShowContactImportModal] = useState(false);
  const [loadingWaContacts, setLoadingWaContacts] = useState(false);
  const [waContactsList, setWaContactsList] = useState<WhatsAppContact[]>([]);
  const [selectedWaPhones, setSelectedWaPhones] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState('');

  // CRM State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [editingCustomerTags, setEditingCustomerTags] = useState<Customer | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Reminders State
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>({
    enabled: true,
    firstReminderEnabled: true,
    firstReminderHoursBefore: 24,
    firstReminderTemplate: '👋 Hola *{{nombre}}*, te recordamos tu cita para *{{servicio}}* agendada para el día *{{fecha}}* a las *{{hora}}* en *{{negocio}}*. ¡Te esperamos!',
    secondReminderEnabled: true,
    secondReminderHoursBefore: 2,
    secondReminderTemplate: '⏰ Hola *{{nombre}}*, tu cita para *{{servicio}}* en *{{negocio}}* es hoy a las *{{hora}}* (en unas {{horas}} horas). Si necesitas reagendar, avísanos con tiempo.'
  });
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  const api = useApi();

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const data = await api.get('/api/campaigns');
      if (Array.isArray(data)) setCampaigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const data = await api.get('/api/campaigns/customers');
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadReminders = async () => {
    try {
      setLoadingReminders(true);
      const data = await api.get('/api/campaigns/reminder-settings');
      if (data && data.firstReminderTemplate) setReminderConfig(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') loadCampaigns();
    if (activeTab === 'crm') loadCustomers();
    if (activeTab === 'reminders') loadReminders();
  }, [activeTab]);

  // Fetch WhatsApp contacts from active instance
  const handleOpenContactImporter = async () => {
    setShowContactImportModal(true);
    setLoadingWaContacts(true);
    try {
      const res = await api.get('/api/campaigns/whatsapp-contacts');
      if (res && Array.isArray(res.contacts)) {
        setWaContactsList(res.contacts);
        // default select all
        const set = new Set<string>();
        res.contacts.forEach((c: WhatsAppContact) => set.add(c.phone));
        setSelectedWaPhones(set);
      }
    } catch (e) {
      alert('No se pudieron obtener contactos de WhatsApp. Verifique que la instancia esté conectada.');
    } finally {
      setLoadingWaContacts(false);
    }
  };

  const toggleSelectAllContacts = () => {
    if (selectedWaPhones.size === filteredWaContacts.length) {
      setSelectedWaPhones(new Set());
    } else {
      const set = new Set<string>();
      filteredWaContacts.forEach(c => set.add(c.phone));
      setSelectedWaPhones(set);
    }
  };

  const toggleContactPhone = (phone: string) => {
    const next = new Set(selectedWaPhones);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    setSelectedWaPhones(next);
  };

  const applySelectedContacts = () => {
    const selected = waContactsList
      .filter(c => selectedWaPhones.has(c.phone))
      .map(c => ({ phone: c.phone, name: c.name || c.pushName || '' }));
    
    setNewCampaign({
      ...newCampaign,
      targetSegment: 'custom_contacts',
      targetContacts: selected
    });
    setShowContactImportModal(false);
  };

  const filteredWaContacts = waContactsList.filter(c => {
    const q = contactSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.pushName || '').toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.messageTemplate) return;
    setSavingCampaign(true);
    try {
      await api.post('/api/campaigns', {
        name: newCampaign.name,
        messageTemplate: newCampaign.messageTemplate,
        mediaUrl: newCampaign.mediaUrl,
        targetSegment: newCampaign.targetSegment,
        targetTag: newCampaign.targetTag,
        scheduledFor: newCampaign.isScheduled && newCampaign.scheduledFor ? new Date(newCampaign.scheduledFor).toISOString() : null,
        targetContacts: newCampaign.targetContacts.length > 0 ? newCampaign.targetContacts : null
      });
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        messageTemplate: `👋 Hola {{nombre}}, tenemos una promoción especial para ti en {{negocio}}:

🎉 ¡Aprovecha hoy un 15% de descuento en todos nuestros productos y servicios!

Puedes ver nuestro catálogo completo aquí.`,
        mediaUrl: '',
        targetSegment: 'all',
        targetTag: '',
        isScheduled: false,
        scheduledFor: '',
        targetContacts: []
      });
      loadCampaigns();
    } catch (err: any) {
      alert('Error creando campaña: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm('¿Deseas iniciar el envío de esta campaña ahora? Se enviará a los destinatarios con intervalo seguro anti-bloqueo.')) return;
    setSendingId(id);
    try {
      await api.post(`/api/campaigns/${id}/send`, {});
      loadCampaigns();
    } catch (e: any) {
      alert('Error al iniciar campaña: ' + (e.message || 'Intente de nuevo'));
    } finally {
      setSendingId(null);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await api.post(`/api/campaigns/${id}/pause`, {});
      loadCampaigns();
    } catch (e) {
      alert('Error al pausar');
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await api.post(`/api/campaigns/${id}/resume`, {});
      loadCampaigns();
    } catch (e) {
      alert('Error al reanudar');
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar definitivamente esta campaña?')) return;
    try {
      await api.post(`/api/campaigns/${id}/cancel`, {});
      loadCampaigns();
    } catch (e) {
      alert('Error al cancelar');
    }
  };

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReminders(true);
    try {
      await api.post('/api/campaigns/reminder-settings', reminderConfig);
      setSavedSuccessToast(true);
      setTimeout(() => setSavedSuccessToast(false), 3000);
    } catch (e) {
      alert('Error al guardar configuración');
    } finally {
      setSavingReminders(false);
    }
  };

  const handleAddTag = async () => {
    if (!editingCustomerTags || !tagInput.trim()) return;
    const newTags = Array.from(new Set([...(editingCustomerTags.tags || []), tagInput.trim()]));
    try {
      await api.post(`/api/campaigns/customers/${editingCustomerTags.id}/tags`, { tags: newTags });
      setCustomers(prev => prev.map(c => c.id === editingCustomerTags.id ? { ...c, tags: newTags } : c));
      setEditingCustomerTags(prev => prev ? { ...prev, tags: newTags } : null);
      setTagInput('');
    } catch (e) {
      alert('Error al agregar etiqueta');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!editingCustomerTags) return;
    const newTags = (editingCustomerTags.tags || []).filter(t => t !== tagToRemove);
    try {
      await api.post(`/api/campaigns/customers/${editingCustomerTags.id}/tags`, { tags: newTags });
      setCustomers(prev => prev.map(c => c.id === editingCustomerTags.id ? { ...c, tags: newTags } : c));
      setEditingCustomerTags(prev => prev ? { ...prev, tags: newTags } : null);
    } catch (e) {
      alert('Error al remover etiqueta');
    }
  };

  const allAvailableTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(crmSearch.toLowerCase()) || c.phone.includes(crmSearch);
    const matchesTag = selectedTagFilter === 'all' || (c.tags || []).includes(selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={26} color="var(--primary)" />
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>Marketing & Automatizaciones WhatsApp</h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Campañas masivas programadas, directorio CRM de clientes y recordatorios automáticos de citas
          </p>
        </div>

        {activeTab === 'campaigns' && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Plus size={16} /> Nueva Campaña Masiva
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'campaigns' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Send size={18} /> Difusión & Campañas
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'crm' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'crm' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Users size={18} /> Directorio CRM ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'reminders' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'reminders' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Bell size={18} /> Recordatorios de Citas
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Anti-Ban Policy Notice */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={22} color="#166534" />
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>Protección Anti-Bloqueo Activa:</strong> Los mensajes masivos se despachan automáticamente con una cadencia segura de 3.5 segundos entre contactos para proteger tu número de WhatsApp.
            </div>
          </div>

          {loadingCampaigns ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando campañas...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Send size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No tienes campañas creadas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 18px auto' }}>
                Crea campañas masivas para anunciar promociones, menús especiales o recordatorios a tus clientes de WhatsApp.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Crear Mi Primera Campaña
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {campaigns.map(c => {
                const total = c.totalRecipients || 0;
                const sent = c.sentCount || 0;
                const failed = c.failedCount || 0;
                const pct = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
                const isScheduled = c.status === 'scheduled';

                return (
                  <div key={c.id} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{c.name}</h3>
                          <span style={{
                            padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                            backgroundColor: isScheduled ? '#eff6ff' : c.status === 'sending' ? '#fef3c7' : c.status === 'completed' ? '#dcfce7' : c.status === 'paused' ? '#fee2e2' : '#f1f5f9',
                            color: isScheduled ? '#1d4ed8' : c.status === 'sending' ? '#b45309' : c.status === 'completed' ? '#15803d' : c.status === 'paused' ? '#b91c1c' : '#475569'
                          }}>
                            {isScheduled ? '📅 Programada' : c.status === 'sending' ? '⚡ Enviando...' : c.status === 'completed' ? '✓ Completada' : c.status === 'paused' ? '⏸ Pausada' : c.status === 'cancelled' ? '🚫 Cancelada' : '📝 Borrador'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Audiencia: <strong>{c.targetSegment === 'tag' ? `Etiqueta: ${c.targetTag}` : c.targetSegment === 'custom_contacts' ? 'Contactos Seleccionados de WhatsApp' : 'Todos los clientes'}</strong> • Creada: {new Date(c.createdAt).toLocaleDateString('es-CR')}
                          {(c as any).scheduledFor && (
                            <span style={{ marginLeft: '10px', color: '#2563eb', fontWeight: 'bold' }}>
                              📅 Envío: {new Date((c as any).scheduledFor).toLocaleString('es-CR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {c.status === 'draft' && (
                          <button
                            onClick={() => handleSendCampaign(c.id)}
                            disabled={sendingId === c.id}
                            style={{ padding: '7px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Play size={14} /> Iniciar Envío
                          </button>
                        )}
                        {c.status === 'sending' && (
                          <>
                            <button
                              onClick={() => handlePauseCampaign(c.id)}
                              style={{ padding: '7px 14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Pause size={14} /> Pausar
                            </button>
                            <button
                              onClick={() => handleCancelCampaign(c.id)}
                              style={{ padding: '7px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <X size={14} /> Cancelar
                            </button>
                          </>
                        )}
                        {c.status === 'paused' && (
                          <button
                            onClick={() => handleResumeCampaign(c.id)}
                            style={{ padding: '7px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Play size={14} /> Reanudar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                        <span>Progreso de despacho ({sent} de {total} enviados)</span>
                        <span style={{ fontWeight: 'bold' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: c.status === 'completed' ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                      </div>
                    </div>

                    {/* Template preview */}
                    <div style={{ backgroundColor: 'var(--background)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                      {c.messageTemplate}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRM DIRECTORY */}
      {activeTab === 'crm' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem' }}
              >
                <option value="all">Todas las etiquetas</option>
                {allAvailableTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={loadCustomers}
                style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface)', cursor: 'pointer' }}
                title="Actualizar clientes"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.02)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Cliente</th>
                  <th style={{ padding: '12px 16px' }}>Teléfono / WhatsApp</th>
                  <th style={{ padding: '12px 16px' }}>Etiquetas</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Pedidos / Citas</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Consumo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron clientes registrados en este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{c.name}</td>
                      <td style={{ padding: '12px 16px' }}>{c.phone}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(c.tags || []).length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                          ) : (
                            c.tags.map(t => (
                              <span key={t} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{c.totalOrders}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        ₡{Number(c.totalSpent || 0).toLocaleString('es-CR')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setEditingCustomerTags(c)}
                          style={{ padding: '5px 10px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Tag size={12} /> Etiquetas
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REMINDERS */}
      {activeTab === 'reminders' && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Bell size={24} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Recordatorios Automáticos de Citas</h3>
          </div>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Envía recordatorios automáticos por WhatsApp a tus clientes antes de su cita para reducir las inasistencias en más de un 80%.
          </p>

          {savedSuccessToast && (
            <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}>
              <CheckCircle2 size={18} /> ¡Configuración de recordatorios guardada con éxito!
            </div>
          )}

          <form onSubmit={handleSaveReminders} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Reminder 1: 24h Before */}
            <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Primer Recordatorio (Día Anterior)</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminderConfig.firstReminderEnabled}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderEnabled: e.target.checked })}
                  />
                  Habilitar
                </label>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Horas de anticipación:</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={reminderConfig.firstReminderHoursBefore}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderHoursBefore: Number(e.target.value) })}
                  style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Plantilla del Mensaje:</label>
                <textarea
                  rows={3}
                  value={reminderConfig.firstReminderTemplate}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderTemplate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Variables: <code>&#123;&#123;nombre&#125;&#125;</code>, <code>&#123;&#123;servicio&#125;&#125;</code>, <code>&#123;&#123;fecha&#125;&#125;</code>, <code>&#123;&#123;hora&#125;&#125;</code>, <code>&#123;&#123;negocio&#125;&#125;</code></span>
              </div>
            </div>

            {/* Reminder 2: 2h Before */}
            <div style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Segundo Recordatorio (Mismo Día / Pre-Cita)</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminderConfig.secondReminderEnabled}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderEnabled: e.target.checked })}
                  />
                  Habilitar
                </label>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Horas de anticipación:</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={reminderConfig.secondReminderHoursBefore}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderHoursBefore: Number(e.target.value) })}
                  style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Plantilla del Mensaje:</label>
                <textarea
                  rows={3}
                  value={reminderConfig.secondReminderTemplate}
                  onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderTemplate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingReminders}
                style={{ padding: '10px 22px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {savingReminders ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '600px', width: '100%', padding: '26px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Crear Nueva Campaña de Difusión</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre de la Campaña *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Promo Fin de Semana / Ofertas"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              {/* Audience selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Audiencia Objetivo</label>
                  <button
                    type="button"
                    onClick={handleOpenContactImporter}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Download size={14} /> 📥 Importar Contactos de WhatsApp
                  </button>
                </div>

                {newCampaign.targetContacts.length > 0 ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold' }}>
                      🎯 {newCampaign.targetContacts.length} contactos de WhatsApp seleccionados
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewCampaign({ ...newCampaign, targetContacts: [], targetSegment: 'all' })}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Limpiar
                    </button>
                  </div>
                ) : (
                  <select
                    value={newCampaign.targetSegment}
                    onChange={(e) => setNewCampaign({ ...newCampaign, targetSegment: e.target.value as any })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                  >
                    <option value="all">Todos los clientes registrados en el CRM ({customers.length})</option>
                    <option value="tag">Clientes con Etiqueta específica</option>
                  </select>
                )}
              </div>

              {newCampaign.targetSegment === 'tag' && newCampaign.targetContacts.length === 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Etiqueta a filtrar</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VIP, Frecuente, Mayorista"
                    value={newCampaign.targetTag}
                    onChange={(e) => setNewCampaign({ ...newCampaign, targetTag: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                  />
                </div>
              )}

              {/* Schedule Feature */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={newCampaign.isScheduled}
                    onChange={(e) => setNewCampaign({ ...newCampaign, isScheduled: e.target.checked })}
                  />
                  📅 Programar envío para fecha y hora específica
                </label>

                {newCampaign.isScheduled && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="datetime-local"
                      required={newCampaign.isScheduled}
                      value={newCampaign.scheduledFor}
                      onChange={(e) => setNewCampaign({ ...newCampaign, scheduledFor: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      La campaña se guardará y el servidor la iniciará automáticamente en la fecha indicada.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Mensaje a Enviar *</label>
                <textarea
                  rows={4}
                  required
                  value={newCampaign.messageTemplate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, messageTemplate: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Variables automáticas: <code>&#123;&#123;nombre&#125;&#125;</code>, <code>&#123;&#123;negocio&#125;&#125;</code></span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>URL de Imagen / Banner Adjunto (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://.../imagen.jpg"
                  value={newCampaign.mediaUrl}
                  onChange={(e) => setNewCampaign({ ...newCampaign, mediaUrl: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '9px 16px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {savingCampaign ? 'Guardando...' : newCampaign.isScheduled ? 'Programar Campaña' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP CONTACT IMPORT MODAL */}
      {showContactImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '650px', width: '100%', padding: '24px', border: '1px solid var(--border)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Importar Contactos de WhatsApp</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Selecciona los contactos de tu libreta/chats para esta difusión ({selectedWaPhones.size} seleccionados)
                </span>
              </div>
              <button onClick={() => setShowContactImportModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Search & Select All */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o número..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="button"
                onClick={toggleSelectAllContacts}
                style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {selectedWaPhones.size === filteredWaContacts.length ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectedWaPhones.size === filteredWaContacts.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>
            </div>

            {/* Contacts list */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '220px' }}>
              {loadingWaContacts ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Obteniendo contactos de WhatsApp...</div>
              ) : filteredWaContacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron contactos en la instancia.</div>
              ) : (
                filteredWaContacts.map(c => {
                  const isSelected = selectedWaPhones.has(c.phone);
                  return (
                    <div
                      key={c.phone}
                      onClick={() => toggleContactPhone(c.phone)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.name || c.pushName || 'Contacto'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{c.phone}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowContactImportModal(false)}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applySelectedContacts}
                disabled={selectedWaPhones.size === 0}
                style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Usar {selectedWaPhones.size} Contactos
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Customer Tags Modal */}
      {editingCustomerTags && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '440px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Etiquetas de {editingCustomerTags.name}</h3>
              <button onClick={() => setEditingCustomerTags(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', minHeight: '36px', padding: '10px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {(editingCustomerTags.tags || []).length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin etiquetas asignadas.</span>
              ) : (
                editingCustomerTags.tags.map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {t}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                  </span>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nueva etiqueta (ej: VIP, Frecuente)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Agregar
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '18px' }}>
              <button
                onClick={() => setEditingCustomerTags(null)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
