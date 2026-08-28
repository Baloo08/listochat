import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Send, Users, Bell, MessageCircle, Plus, Image as ImageIcon, 
  CheckCircle2, Clock, AlertTriangle, Tag, RefreshCw, Sparkles, Filter, 
  Check, X, Play, ShieldAlert, Sliders, Calendar
} from 'lucide-react';
import { WhatsAppCampaign, Customer, ReminderConfig } from '../../shared/types';

export default function CampaignsManager() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'crm' | 'reminders'>('campaigns');
  
  // Campaigns State
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    messageTemplate: '👋 Hola {{nombre}}, tenemos una promoción especial para ti en {{negocio}}:\n\n🎉 ¡Aprovecha hoy un 15% de descuento en todos nuestros productos y servicios!\n\nPuedes ver nuestro catálogo completo aquí.',
    mediaUrl: '',
    targetSegment: 'all' as 'all' | 'orders' | 'bookings' | 'tag',
    targetTag: ''
  });
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

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

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.messageTemplate) return;
    setSavingCampaign(true);
    try {
      await api.post('/api/campaigns', newCampaign);
      setShowCreateModal(false);
      setNewCampaign({
        name: '',
        messageTemplate: '👋 Hola {{nombre}}, tenemos una promoción especial para ti en {{negocio}}!',
        mediaUrl: '',
        targetSegment: 'all',
        targetTag: ''
      });
      loadCampaigns();
    } catch (err: any) {
      alert('Error al crear campaña: ' + err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleStartSend = async (id: string, name: string) => {
    if (confirm(`¿Deseas iniciar el envío masivo de la campaña "${name}"?\n\nLos mensajes se enviarán automáticamente con intervalos de seguridad de 3.5 segundos para proteger tu número de WhatsApp.`)) {
      setSendingId(id);
      try {
        await api.post(`/api/campaigns/${id}/send`, {});
        alert('¡Envío masivo iniciado con éxito en segundo plano!');
        loadCampaigns();
      } catch (err: any) {
        alert('Error al iniciar envío: ' + err.message);
      } finally {
        setSendingId(null);
      }
    }
  };

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReminders(true);
    try {
      await api.post('/api/campaigns/reminder-settings', reminderConfig);
      setSavedSuccessToast(true);
      setTimeout(() => setSavedSuccessToast(false), 3000);
    } catch (err: any) {
      alert('Error al guardar recordatorios: ' + err.message);
    } finally {
      setSavingReminders(false);
    }
  };

  const handleAddTag = async () => {
    if (!editingCustomerTags || !tagInput.trim()) return;
    const currentTags = editingCustomerTags.tags || [];
    if (currentTags.includes(tagInput.trim())) return;
    const newTags = [...currentTags, tagInput.trim()];
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
            Campañas masivas, directorio CRM de clientes y recordatorios automáticos de citas
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

      {/* ==============================================================
          TAB 1: WHATSAPP BROADCAST CAMPAIGNS
      ============================================================== */}
      {activeTab === 'campaigns' && (
        <div>
          {/* Anti-Ban Safety Notice */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <ShieldAlert size={22} color="#16a34a" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: '#166534' }}>
              <strong>Protección Anti-Ban Inteligente:</strong> Las campañas se transmiten progresivamente con pausas de 3.5 segundos entre cada cliente, simulando un envío humano para resguardar la reputación de tu línea de WhatsApp.
            </div>
          </div>

          {loadingCampaigns ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando campañas...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Send size={44} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No tienes campañas de difusión creadas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
                Crea tu primera campaña para enviar promociones, lanzamientos o avisos a tus clientes.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Crear Primera Campaña
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {campaigns.map(camp => (
                <div key={camp.id} style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{camp.name}</h3>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: camp.status === 'completed' ? '#dcfce7' : camp.status === 'sending' ? '#fef3c7' : '#f1f5f9',
                        color: camp.status === 'completed' ? '#166534' : camp.status === 'sending' ? '#92400e' : '#475569'
                      }}>
                        {camp.status === 'completed' ? 'Completada' : camp.status === 'sending' ? 'Enviando...' : 'Borrador'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', backgroundColor: 'var(--background)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {camp.messageTemplate}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>🎯 <strong>Segmento:</strong> {camp.targetSegment === 'all' ? 'Todos los clientes' : `Etiqueta: ${camp.targetTag}`}</span>
                      <span>👥 <strong>Destinatarios:</strong> {camp.totalRecipients}</span>
                      <span>✅ <strong>Enviados:</strong> {camp.sentCount || 0}</span>
                      {camp.failedCount ? <span>❌ <strong>Fallidos:</strong> {camp.failedCount}</span> : null}
                    </div>
                  </div>

                  <div>
                    {camp.status === 'draft' && (
                      <button
                        onClick={() => handleStartSend(camp.id, camp.name)}
                        disabled={sendingId === camp.id}
                        style={{ padding: '10px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Play size={16} /> {sendingId === camp.id ? 'Iniciando...' : 'Iniciar Envío Masivo'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 2: CRM & CUSTOMER DIRECTORY
      ============================================================== */}
      {activeTab === 'crm' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            />

            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              <option value="all">Todas las etiquetas</option>
              {allAvailableTags.map(tag => (
                <option key={tag} value={tag}>Etiqueta: {tag}</option>
              ))}
            </select>
          </div>

          {loadingCustomers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando clientes...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              No se encontraron clientes registrados.
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Cliente</th>
                    <th style={{ padding: '12px 16px' }}>Teléfono WhatsApp</th>
                    <th style={{ padding: '12px 16px' }}>Total Órdenes</th>
                    <th style={{ padding: '12px 16px' }}>Total Gastado</th>
                    <th style={{ padding: '12px 16px' }}>Etiquetas CRM</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{cust.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--primary)', fontWeight: '600' }}>{cust.phone}</td>
                      <td style={{ padding: '12px 16px' }}>{cust.totalOrders || 0}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>₡{Number(cust.totalSpent || 0).toLocaleString('es-CR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(cust.tags || []).length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sin etiquetas</span>
                          ) : (
                            cust.tags.map(t => (
                              <span key={t} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setEditingCustomerTags(cust)}
                          style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          <Tag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Editar Etiquetas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 3: CUSTOMIZABLE APPOINTMENT REMINDERS
      ============================================================== */}
      {activeTab === 'reminders' && (
        <form onSubmit={handleSaveReminders} style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Recordatorios Automáticos de Citas</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Configura los tiempos de anticipación y personaliza los mensajes de WhatsApp para tus clientes.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={reminderConfig.enabled}
                onChange={(e) => setReminderConfig({ ...reminderConfig, enabled: e.target.checked })}
              />
              <span>Módulo Activo</span>
            </label>
          </div>

          {/* 1st Reminder Box */}
          <div style={{ backgroundColor: 'var(--background)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Primer Recordatorio (Previo)</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={reminderConfig.firstReminderEnabled}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderEnabled: e.target.checked })}
                  />
                  <span>Habilitar</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <span>Enviar:</span>
                  <select
                    value={reminderConfig.firstReminderHoursBefore}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderHoursBefore: Number(e.target.value) })}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontWeight: 'bold' }}
                  >
                    <option value={48}>48 horas antes (2 días)</option>
                    <option value={24}>24 horas antes (1 día)</option>
                    <option value={12}>12 horas antes</option>
                  </select>
                </div>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Plantilla del Mensaje de WhatsApp:
            </label>
            <textarea
              rows={3}
              value={reminderConfig.firstReminderTemplate}
              onChange={(e) => setReminderConfig({ ...reminderConfig, firstReminderTemplate: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', marginBottom: '8px' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💡 Variables disponibles: <code>&#123;&#123;nombre&#125;&#125;</code>, <code>&#123;&#123;servicio&#125;&#125;</code>, <code>&#123;&#123;fecha&#125;&#125;</code>, <code>&#123;&#123;hora&#125;&#125;</code>, <code>&#123;&#123;negocio&#125;&#125;</code>, <code>&#123;&#123;monto&#125;&#125;</code>.
            </div>
          </div>

          {/* 2nd Reminder Box */}
          <div style={{ backgroundColor: 'var(--background)', borderRadius: '12px', padding: '18px', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Segundo Recordatorio (Mismo Día / Urgente)</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={reminderConfig.secondReminderEnabled}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderEnabled: e.target.checked })}
                  />
                  <span>Habilitar</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <span>Enviar:</span>
                  <select
                    value={reminderConfig.secondReminderHoursBefore}
                    onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderHoursBefore: Number(e.target.value) })}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontWeight: 'bold' }}
                  >
                    <option value={4}>4 horas antes</option>
                    <option value={3}>3 horas antes</option>
                    <option value={2}>2 horas antes</option>
                    <option value={1}>1 hora antes</option>
                  </select>
                </div>
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-muted)' }}>
              Plantilla del Mensaje de WhatsApp:
            </label>
            <textarea
              rows={3}
              value={reminderConfig.secondReminderTemplate}
              onChange={(e) => setReminderConfig({ ...reminderConfig, secondReminderTemplate: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', marginBottom: '8px' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💡 Variables disponibles: <code>&#123;&#123;nombre&#125;&#125;</code>, <code>&#123;&#123;servicio&#125;&#125;</code>, <code>&#123;&#123;hora&#125;&#125;</code>, <code>&#123;&#123;negocio&#125;&#125;</code>, <code>&#123;&#123;horas&#125;&#125;</code> (horas restantes).
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            {savedSuccessToast && (
              <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> ¡Configuración guardada con éxito!
              </span>
            )}
            <button
              type="submit"
              disabled={savingReminders}
              style={{ padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {savingReminders ? 'Guardando...' : 'Guardar Ajustes de Recordatorios'}
            </button>
          </div>
        </form>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Nueva Campaña de Difusión</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre de la Campaña *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Promo Fin de Semana / Lanzamiento"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Audiencia Objetivo</label>
                <select
                  value={newCampaign.targetSegment}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetSegment: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                >
                  <option value="all">Todos los clientes registrados</option>
                  <option value="tag">Clientes con Etiqueta específica</option>
                </select>
              </div>

              {newCampaign.targetSegment === 'tag' && (
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
                  {savingCampaign ? 'Guardando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
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
