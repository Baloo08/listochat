import React, { useState, useEffect } from 'react';
import {
  FileText, User, Phone, Mail, MapPin, Calendar, Plus, Search, Filter,
  CheckCircle, AlertCircle, Edit, Trash2, Heart, Activity, Pill, ShieldAlert,
  Clock, MessageCircle, ExternalLink, X, Save, AlertTriangle, Eye, ChevronRight,
  Stethoscope, Thermometer, Scale, ArrowUpRight, Receipt, Check, Copy
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { CustomerRecord, RecordEntry, VitalSigns, ClientRecordType } from '../../shared/types';
import { formatShortDate, formatShortTime, formatShortDateTime } from '../../shared/formatters';

export default function RecordsManager({ initialRecordId }: { initialRecordId?: string }) {
  const api = useApi();

  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'general' | 'paciente'>('all');
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Active State
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialRecordId || null);
  const [recordDetail, setRecordDetail] = useState<{ record: CustomerRecord; appointments: any[]; entries: RecordEntry[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'timeline' | 'appointments' | 'medical'>('timeline');

  // Form Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);

  // Create / Edit Form State
  const [formData, setFormData] = useState({
    clientType: 'general' as ClientRecordType,
    fullName: '',
    phone: '',
    email: '',
    identification: '',
    address: '',
    dateOfBirth: '',
    gender: 'no_especificado',
    bloodType: '',
    allergies: '',
    pathologicalBackground: '',
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
    billingInfo: {
      requiresInvoice: false,
      idType: '01',
      idNumber: '',
      legalName: '',
      email: ''
    }
  });
  const [savingRecord, setSavingRecord] = useState(false);

  // Facturación Electrónica Modal State (Almendro / Hacienda)
  const [showFacturarModal, setShowFacturarModal] = useState(false);
  const [facturarData, setFacturarData] = useState({
    serviceName: '',
    amount: '',
    docType: '01',
    taxRateCode: '04', // 4% salud o 13% general
    cabysCode: '8311100000000',
    notes: '',
    idType: '01',
    idNumber: '',
    legalName: '',
    email: ''
  });
  const [emittingInvoice, setEmittingInvoice] = useState(false);
  const [emittingAptId, setEmittingAptId] = useState<string | null>(null);
  const [invoiceResult, setInvoiceResult] = useState<{
    success: boolean;
    numericKey?: string;
    pdfUrl?: string;
    message?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // New Clinical Entry State
  const [entryData, setEntryData] = useState({
    entryType: 'consultation' as 'consultation' | 'vital_signs' | 'prescription' | 'note' | 'treatment',
    specialistId: '',
    diagnosis: '',
    treatmentPlan: '',
    prescription: '',
    notes: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weightKg: '',
      heightCm: '',
      oxygenSaturation: '',
      glucoseMgDl: ''
    }
  });
  const [savingEntry, setSavingEntry] = useState(false);

  // Load Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (filterType !== 'all') params.append('type', filterType);
      
      const res = await api.get(`/api/records?${params.toString()}`);
      if (res && res.records) {
        setRecords(res.records);
        setTotalCount(res.total || 0);
      }
    } catch (e) {
      console.error('Error fetching customer records:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load Specialists for assignment
  const fetchSpecialists = async () => {
    try {
      const res = await api.get('/api/specialists');
      if (Array.isArray(res)) setSpecialists(res);
    } catch (e) {}
  };

  useEffect(() => {
    fetchRecords();
    fetchSpecialists();
  }, [search, filterType]);

  // Load Record Details
  const fetchRecordDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/records/${id}`);
      if (res && res.record) {
        setRecordDetail(res);
      }
    } catch (e) {
      console.error('Error fetching record details:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedRecordId) {
      fetchRecordDetails(selectedRecordId);
    } else {
      setRecordDetail(null);
    }
  }, [selectedRecordId]);

  // Open Create Modal
  const handleOpenCreate = (type: ClientRecordType = 'general') => {
    setEditingRecord(null);
    setFormData({
      clientType: type,
      fullName: '',
      phone: '',
      email: '',
      identification: '',
      address: '',
      dateOfBirth: '',
      gender: 'no_especificado',
      bloodType: '',
      allergies: '',
      pathologicalBackground: '',
      currentMedications: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
      billingInfo: {
        requiresInvoice: false,
        idType: '01',
        idNumber: '',
        legalName: '',
        email: ''
      }
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: CustomerRecord) => {
    setEditingRecord(rec);
    setFormData({
      clientType: rec.clientType || 'general',
      fullName: rec.fullName || '',
      phone: rec.phone || '',
      email: rec.email || '',
      identification: rec.identification || '',
      address: rec.address || '',
      dateOfBirth: rec.dateOfBirth || '',
      gender: rec.gender || 'no_especificado',
      bloodType: rec.bloodType || '',
      allergies: rec.allergies || '',
      pathologicalBackground: rec.pathologicalBackground || '',
      currentMedications: rec.currentMedications || '',
      emergencyContactName: rec.emergencyContactName || '',
      emergencyContactPhone: rec.emergencyContactPhone || '',
      notes: rec.notes || '',
      billingInfo: rec.billingInfo || {
        requiresInvoice: false,
        idType: '01',
        idNumber: rec.identification || '',
        legalName: rec.fullName || '',
        email: rec.email || ''
      }
    });
    setShowCreateModal(true);
  };

  // Submit Record Form
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Por favor ingresa el nombre completo del cliente/paciente.');
      return;
    }

    setSavingRecord(true);
    try {
      if (editingRecord) {
        await api.put(`/api/records/${editingRecord.id}`, formData);
      } else {
        await api.post('/api/records', formData);
      }
      setShowCreateModal(false);
      await fetchRecords();
      if (selectedRecordId) {
        await fetchRecordDetails(selectedRecordId);
      }
    } catch (err: any) {
      alert('Error guardando expediente: ' + (err.message || err));
    } finally {
      setSavingRecord(false);
    }
  };

  // Invoicing Handlers (Almendro / Costa Rica DGT)
  const handleOpenFacturarModal = (rec: CustomerRecord) => {
    const pBilling = rec.billingInfo;
    const idNum = pBilling?.idNumber || rec.identification || '';
    setFacturarData({
      serviceName: rec.clientType === 'paciente' ? 'Consulta Médica / Atención Clínica' : 'Servicio Profesional',
      amount: '',
      docType: idNum ? '01' : '04',
      taxRateCode: rec.clientType === 'paciente' ? '04' : '08',
      cabysCode: '8311100000000',
      notes: '',
      idType: pBilling?.idType || '01',
      idNumber: idNum,
      legalName: pBilling?.legalName || rec.fullName || '',
      email: pBilling?.email || rec.email || ''
    });
    setShowFacturarModal(true);
  };

  const handleEmitRecordInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    if (!facturarData.amount || Number(facturarData.amount) <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }
    if (facturarData.docType === '01' && !facturarData.idNumber.trim()) {
      alert('Para emitir Factura Electrónica (01) se requiere el número de cédula del cliente. Si no tiene cédula, use Tiquete Electrónico (04).');
      return;
    }

    setEmittingInvoice(true);
    try {
      const res = await api.post(`/api/almendro/emit-record-invoice/${selectedRecordId}`, {
        serviceName: facturarData.serviceName,
        amount: Number(facturarData.amount),
        docType: facturarData.docType,
        taxRateCode: facturarData.taxRateCode,
        cabysCode: facturarData.cabysCode,
        notes: facturarData.notes,
        receiver: facturarData.idNumber.trim() ? {
          idType: facturarData.idType,
          idNumber: facturarData.idNumber.trim(),
          name: facturarData.legalName.trim() || recordDetail?.record.fullName,
          email: facturarData.email.trim() || undefined
        } : undefined
      });

      if (res && res.success) {
        setShowFacturarModal(false);
        setInvoiceResult({
          success: true,
          numericKey: res.numericKey,
          pdfUrl: res.pdfUrl,
          message: res.message || 'Factura electrónica emitida exitosamente ante el Ministerio de Hacienda.'
        });
      } else {
        alert(res?.message || 'Error emitiendo factura electrónica');
      }
    } catch (err: any) {
      alert('Error emitiendo factura: ' + (err.message || err));
    } finally {
      setEmittingInvoice(false);
    }
  };

  const handleEmitAppointmentInvoice = async (apt: any) => {
    if (!confirm(`¿Deseas emitir la factura electrónica por la cita de "${apt.service}" (₡${Number(apt.amount || 0).toLocaleString('es-CR')})?`)) {
      return;
    }

    setEmittingAptId(apt.id);
    try {
      const res = await api.post(`/api/almendro/emit-appointment-invoice/${apt.id}`, {});
      if (res && res.success) {
        setInvoiceResult({
          success: true,
          numericKey: res.numericKey,
          pdfUrl: res.pdfUrl,
          message: res.message || 'Factura de cita emitida con éxito ante el Ministerio de Hacienda.'
        });
        if (selectedRecordId) {
          fetchRecordDetails(selectedRecordId);
        }
      } else {
        alert(res?.message || 'Error al emitir factura de la cita');
      }
    } catch (err: any) {
      alert('Error emitiendo factura de cita: ' + (err.message || err));
    } finally {
      setEmittingAptId(null);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el expediente de ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.del(`/api/records/${id}`);
      if (selectedRecordId === id) setSelectedRecordId(null);
      await fetchRecords();
    } catch (e) {
      alert('Error eliminando expediente');
    }
  };

  // Submit Clinical Entry
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    setSavingEntry(true);
    try {
      const vs: any = {};
      const { bloodPressure, heartRate, temperature, weightKg, heightCm, oxygenSaturation, glucoseMgDl } = entryData.vitalSigns;
      if (bloodPressure) vs.bloodPressure = bloodPressure.trim();
      if (heartRate) vs.heartRate = parseFloat(heartRate);
      if (temperature) vs.temperature = parseFloat(temperature);
      if (weightKg) vs.weightKg = parseFloat(weightKg);
      if (heightCm) vs.heightCm = parseFloat(heightCm);
      if (oxygenSaturation) vs.oxygenSaturation = parseFloat(oxygenSaturation);
      if (glucoseMgDl) vs.glucoseMgDl = parseFloat(glucoseMgDl);

      // BMI calculation
      if (vs.weightKg && vs.heightCm) {
        const heightM = vs.heightCm / 100;
        vs.bmi = parseFloat((vs.weightKg / (heightM * heightM)).toFixed(1));
      }

      await api.post(`/api/records/${selectedRecordId}/entries`, {
        entryType: entryData.entryType,
        specialistId: entryData.specialistId || undefined,
        diagnosis: entryData.diagnosis || undefined,
        treatmentPlan: entryData.treatmentPlan || undefined,
        prescription: entryData.prescription || undefined,
        notes: entryData.notes || undefined,
        vitalSigns: Object.keys(vs).length > 0 ? vs : undefined
      });

      setShowEntryModal(false);
      setEntryData({
        entryType: 'consultation',
        specialistId: '',
        diagnosis: '',
        treatmentPlan: '',
        prescription: '',
        notes: '',
        vitalSigns: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weightKg: '',
          heightCm: '',
          oxygenSaturation: '',
          glucoseMgDl: ''
        }
      });
      await fetchRecordDetails(selectedRecordId);
    } catch (err: any) {
      alert('Error guardando nota de atención: ' + (err.message || err));
    } finally {
      setSavingEntry(false);
    }
  };

  // Helper calculation of age
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '14px', backgroundColor: 'var(--surface)',
        padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border)'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="var(--primary)" /> Expedientes & Historial de Clientes
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Registro individualizado de clientes y pacientes médicos con historial de citas, notas clínicas y signos vitales.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleOpenCreate('general')}
            style={{
              padding: '9px 16px', backgroundColor: '#f1f5f9', color: '#334155',
              border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <User size={16} /> + Cliente General
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('paciente')}
            style={{
              padding: '9px 16px', backgroundColor: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Heart size={16} /> + Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap'
      }}>
        {/* Type Toggle Pills */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: filterType === 'all' ? 'var(--primary)' : 'transparent',
              color: filterType === 'all' ? 'white' : 'var(--text-muted)'
            }}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFilterType('general')}
            style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: filterType === 'general' ? 'var(--primary)' : 'transparent',
              color: filterType === 'general' ? 'white' : 'var(--text-muted)'
            }}
          >
            👤 Clientes Generales
          </button>
          <button
            onClick={() => setFilterType('paciente')}
            style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: filterType === 'paciente' ? 'var(--primary)' : 'transparent',
              color: filterType === 'paciente' ? 'white' : 'var(--text-muted)'
            }}
          >
            🩺 Pacientes de Salud
          </button>
        </div>

        {/* Live Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '450px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, cédula o DIMEX..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
              border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: 'var(--surface)'
            }}
          />
        </div>
      </div>

      {/* Records Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Cargando expedientes...</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <FileText size={42} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No se encontraron expedientes</h4>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {search ? 'No hay resultados que coincidan con la búsqueda.' : 'Aún no has registrado clientes ni pacientes en este comercio.'}
          </p>
          <button
            onClick={() => handleOpenCreate('paciente')}
            style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            Crear Primer Expediente
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {records.map(rec => {
            const isPatient = rec.clientType === 'paciente';
            const cleanPhone = (rec.phone || '').replace(/\D/g, '');
            const waPhone = cleanPhone.length === 8 ? '506' + cleanPhone : cleanPhone;
            const age = calculateAge(rec.dateOfBirth);

            return (
              <div
                key={rec.id}
                style={{
                  backgroundColor: 'var(--surface)', borderRadius: '14px',
                  border: '1px solid var(--border)', padding: '18px', display: 'flex',
                  flexDirection: 'column', gap: '12px', transition: 'box-shadow 0.2s',
                  position: 'relative'
                }}
              >
                {/* Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      backgroundColor: isPatient ? '#ecfdf5' : '#f1f5f9',
                      color: isPatient ? '#059669' : '#475569',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '1.1rem'
                    }}>
                      {isPatient ? <Heart size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: '700', padding: '1px 7px', borderRadius: '4px',
                          backgroundColor: isPatient ? '#dcfce7' : '#e2e8f0',
                          color: isPatient ? '#166534' : '#475569'
                        }}>
                          {isPatient ? 'Paciente' : 'Cliente General'}
                        </span>
                        {rec.bloodType && (
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                            {rec.bloodType}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '3px 0 0 0', fontSize: '1.05rem', fontWeight: 'bold' }}>
                        {rec.fullName}
                      </h4>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      style={{ border: 'none', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      title="Editar datos del expediente"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id, rec.fullName)}
                      style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                      title="Eliminar expediente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details List */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {rec.identification && (
                    <div>
                      <strong>Cédula / DIMEX:</strong> {rec.identification}
                    </div>
                  )}
                  {rec.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} /> {rec.phone}
                      {waPhone && (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#16a34a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold', fontSize: '0.75rem', marginLeft: '4px' }}
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                  {rec.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} /> {rec.email}
                    </div>
                  )}
                  {isPatient && age !== null && (
                    <div>
                      <strong>Edad:</strong> {age} años {rec.gender ? `• ${rec.gender}` : ''}
                    </div>
                  )}
                </div>

                {/* Clinical Flags (Alergias) */}
                {isPatient && rec.allergies && (
                  <div style={{ padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.75rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldAlert size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span><strong>Alergias:</strong> {rec.allergies}</span>
                  </div>
                )}

                {/* Vital signs banner if available */}
                {isPatient && rec.latestVitalSigns && (
                  <div style={{ padding: '8px 10px', backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '6px', fontSize: '0.74rem', color: '#0f766e', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {rec.latestVitalSigns.bloodPressure && <span><strong>PA:</strong> {rec.latestVitalSigns.bloodPressure}</span>}
                    {rec.latestVitalSigns.heartRate && <span><strong>FC:</strong> {rec.latestVitalSigns.heartRate} lpm</span>}
                    {rec.latestVitalSigns.temperature && <span><strong>T°:</strong> {rec.latestVitalSigns.temperature}°C</span>}
                    {rec.latestVitalSigns.weightKg && <span><strong>Peso:</strong> {rec.latestVitalSigns.weightKg} kg</span>}
                  </div>
                )}

                {/* Footer KPI & Actions */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{rec.totalAppointments || 0} citas registradas</span>
                  </div>

                  <button
                    onClick={() => setSelectedRecordId(rec.id)}
                    style={{
                      padding: '7px 12px', backgroundColor: '#0f172a', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
                      fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <FileText size={13} /> Ver Expediente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 360° EXPEDIENTE DETAIL MODAL / DRAWER */}
      {/* ======================================================== */}
      {selectedRecordId && recordDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '850px',
            width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  backgroundColor: recordDetail.record.clientType === 'paciente' ? '#ecfdf5' : '#f1f5f9',
                  color: recordDetail.record.clientType === 'paciente' ? '#059669' : '#475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {recordDetail.record.clientType === 'paciente' ? <Heart size={24} /> : <User size={24} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: recordDetail.record.clientType === 'paciente' ? '#dcfce7' : '#e2e8f0', color: recordDetail.record.clientType === 'paciente' ? '#166534' : '#475569' }}>
                      {recordDetail.record.clientType === 'paciente' ? 'Paciente' : 'Cliente General'}
                    </span>
                    {recordDetail.record.identification && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: <strong>{recordDetail.record.identification}</strong>
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', color: '#0f172a' }}>
                    {recordDetail.record.fullName}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleOpenFacturarModal(recordDetail.record)}
                  style={{ padding: '7px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Receipt size={14} /> Facturar Consulta
                </button>
                <button
                  onClick={() => handleOpenEdit(recordDetail.record)}
                  style={{ padding: '7px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit size={14} /> Editar Datos
                </button>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', color: '#64748b' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Quick Contact & Medical Alert Ribbon */}
            <div style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#334155' }}>
              {recordDetail.record.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} /> {recordDetail.record.phone}
                  <a
                    href={`https://wa.me/${recordDetail.record.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', marginLeft: '4px' }}
                  >
                    WhatsApp
                  </a>
                </div>
              )}
              {recordDetail.record.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} /> {recordDetail.record.email}
                </div>
              )}
              {recordDetail.record.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} /> {recordDetail.record.address}
                </div>
              )}
            </div>

            {/* Tabs Bar inside Modal */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#ffffff' }}>
              <button
                onClick={() => setDetailTab('timeline')}
                style={{
                  padding: '12px 18px', border: 'none', borderBottom: detailTab === 'timeline' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent', color: detailTab === 'timeline' ? '#0f172a' : '#64748b',
                  fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                📝 Evoluciones & Notas ({recordDetail.entries.length})
              </button>
              <button
                onClick={() => setDetailTab('appointments')}
                style={{
                  padding: '12px 18px', border: 'none', borderBottom: detailTab === 'appointments' ? '2px solid #0f172a' : '2px solid transparent',
                  backgroundColor: 'transparent', color: detailTab === 'appointments' ? '#0f172a' : '#64748b',
                  fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                📅 Citas Agendadas ({recordDetail.appointments.length})
              </button>
              {recordDetail.record.clientType === 'paciente' && (
                <button
                  onClick={() => setDetailTab('medical')}
                  style={{
                    padding: '12px 18px', border: 'none', borderBottom: detailTab === 'medical' ? '2px solid #0f172a' : '2px solid transparent',
                    backgroundColor: 'transparent', color: detailTab === 'medical' ? '#0f172a' : '#64748b',
                    fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  🩺 Ficha Médica
                </button>
              )}
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
              
              {/* TAB 1: CLINICAL NOTES & EVOLUTIONS */}
              {detailTab === 'timeline' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
                      Línea de Tiempo del Expediente
                    </h4>
                    <button
                      onClick={() => setShowEntryModal(true)}
                      style={{
                        padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Plus size={15} /> + Nueva Nota / Evolución
                    </button>
                  </div>

                  {recordDetail.entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      No hay notas de evolución registradas aún en este expediente.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {recordDetail.entries.map(ent => (
                        <div key={ent.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                                {ent.entryType === 'consultation' ? 'Consulta Clínica' : ent.entryType === 'vital_signs' ? 'Toma de Signos' : ent.entryType === 'prescription' ? 'Receta Médica' : 'Nota'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
                                {formatShortDateTime(ent.createdAt)}
                              </span>
                            </div>

                            {ent.specialistName && (
                              <span style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: '600', backgroundColor: '#f0fdfa', padding: '2px 8px', borderRadius: '10px' }}>
                                Atendido por: {ent.specialistName}
                              </span>
                            )}
                          </div>

                          {/* Vital signs banner inside entry */}
                          {ent.vitalSigns && (
                            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#166534' }}>
                              {ent.vitalSigns.bloodPressure && <span><strong>Presión:</strong> {ent.vitalSigns.bloodPressure}</span>}
                              {ent.vitalSigns.heartRate && <span><strong>Pulso:</strong> {ent.vitalSigns.heartRate} lpm</span>}
                              {ent.vitalSigns.temperature && <span><strong>Temp:</strong> {ent.vitalSigns.temperature}°C</span>}
                              {ent.vitalSigns.weightKg && <span><strong>Peso:</strong> {ent.vitalSigns.weightKg} kg</span>}
                              {ent.vitalSigns.heightCm && <span><strong>Estatura:</strong> {ent.vitalSigns.heightCm} cm</span>}
                              {ent.vitalSigns.bmi && <span><strong>IMC:</strong> {ent.vitalSigns.bmi}</span>}
                              {ent.vitalSigns.oxygenSaturation && <span><strong>SpO2:</strong> {ent.vitalSigns.oxygenSaturation}%</span>}
                            </div>
                          )}

                          {ent.diagnosis && (
                            <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                              <strong style={{ color: '#0f172a' }}>Diagnóstico / Motivo:</strong> {ent.diagnosis}
                            </div>
                          )}

                          {ent.treatmentPlan && (
                            <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                              <strong style={{ color: '#0f172a' }}>Plan de Tratamiento:</strong> {ent.treatmentPlan}
                            </div>
                          )}

                          {ent.prescription && (
                            <div style={{ fontSize: '0.85rem', backgroundColor: '#eff6ff', padding: '8px', borderRadius: '6px', marginBottom: '6px', color: '#1e40af' }}>
                              <strong>Medicamentos / Receta:</strong> {ent.prescription}
                            </div>
                          )}

                          {ent.notes && (
                            <div style={{ fontSize: '0.83rem', color: '#475569', fontStyle: 'italic', marginTop: '6px' }}>
                              {ent.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: APPOINTMENTS */}
              {detailTab === 'appointments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>
                      Citas Agendadas ({recordDetail.appointments.length})
                    </h4>
                  </div>

                  {recordDetail.appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      No hay citas reservadas registradas para este cliente.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recordDetail.appointments.map(a => {
                        const hasInvoice = a.billingInfo?.numericKey || a.billingInfo?.pdfUrl;
                        return (
                          <div key={a.id} style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{a.service}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span>📅 {formatShortDate(a.date)} • ⏰ {formatShortTime(a.time)}</span>
                                {a.specialistName && <span>👨‍⚕️ {a.specialistName}</span>}
                              </div>
                              {a.billingInfo?.requiresInvoice && (
                                <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '4px', fontWeight: '600' }}>
                                  🏛️ Solicitó Factura: {a.billingInfo.legalName || a.billingInfo.idNumber}
                                </div>
                              )}
                              {hasInvoice && (
                                <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '3px', fontWeight: 'bold' }}>
                                  ✓ Factura Emitida {a.billingInfo?.numericKey ? `(#...${a.billingInfo.numericKey.slice(-10)})` : ''}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>₡{Number(a.amount || 0).toLocaleString('es-CR')}</div>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: a.status === 'completed' ? '#dcfce7' : '#e0f2fe', color: a.status === 'completed' ? '#166534' : '#0369a1', fontWeight: 'bold' }}>
                                  {a.status}
                                </span>
                              </div>

                              {hasInvoice && (a.billingInfo?.pdfUrl || a.billingInfo?.numericKey) ? (
                                <a
                                  href={
                                    a.billingInfo.pdfUrl && !a.billingInfo.pdfUrl.includes('fe.almendro.cr')
                                      ? a.billingInfo.pdfUrl
                                      : `/api/almendro/public/voucher-pdf/${a.billingInfo.numericKey || a.id}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ padding: '6px 10px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <ExternalLink size={12} /> Ver Factura
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleEmitAppointmentInvoice(a)}
                                  disabled={emittingAptId === a.id}
                                  style={{ padding: '6px 10px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  {emittingAptId === a.id ? 'Facturando...' : '⚡ Emitir Factura'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MEDICAL SUMMARY */}
              {detailTab === 'medical' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={16} /> Alergias Conocidas
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                      {recordDetail.record.allergies || 'Ninguna registrada'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={16} /> Antecedentes Patológicos
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                      {recordDetail.record.pathologicalBackground || 'Ninguno registrado'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={16} /> Medicamentos Habituales
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                      {recordDetail.record.currentMedications || 'Ninguno registrado'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={16} /> Contacto de Emergencia
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                      {recordDetail.record.emergencyContactName ? `${recordDetail.record.emergencyContactName} (${recordDetail.record.emergencyContactPhone || 'Sin teléfono'})` : 'No registrado'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT EXPEDIENTE */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                {editingRecord ? 'Editar Expediente' : 'Nuevo Expediente'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRecord} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>Tipo de Cliente / Expediente</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, clientType: 'general' })}
                    style={{
                      padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                      border: formData.clientType === 'general' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                      backgroundColor: formData.clientType === 'general' ? '#f0fdf4' : '#ffffff',
                      color: formData.clientType === 'general' ? '#166534' : '#475569'
                    }}
                  >
                    👤 Cliente General
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, clientType: 'paciente' })}
                    style={{
                      padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
                      border: formData.clientType === 'paciente' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                      backgroundColor: formData.clientType === 'paciente' ? '#f0fdf4' : '#ffffff',
                      color: formData.clientType === 'paciente' ? '#166534' : '#475569'
                    }}
                  >
                    🩺 Paciente de Salud
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ej: Laura Castro Sánchez"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Cédula / DIMEX</label>
                  <input
                    type="text"
                    value={formData.identification}
                    onChange={e => setFormData({ ...formData, identification: e.target.value })}
                    placeholder="Ej: 1-1234-0567 o 1558..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Teléfono WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 8888-8888"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ejemplo@correo.com"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Dirección Personal</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Provincia, Cantón, detalles de domicilio..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Paciente Specialized Fields */}
              {formData.clientType === 'paciente' && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={16} /> Ficha Clínica del Paciente
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Género</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      >
                        <option value="no_especificado">No especificado</option>
                        <option value="femenino">Femenino</option>
                        <option value="masculino">Masculino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Grupo Sanguíneo</label>
                      <input
                        type="text"
                        placeholder="Ej: O+, A+, etc."
                        value={formData.bloodType}
                        onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px', color: '#b91c1c' }}>Alergias o Contraindicaciones</label>
                    <input
                      type="text"
                      placeholder="Ej: Penicilina, AINES, Látex, Mariscos..."
                      value={formData.allergies}
                      onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fff5f5', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Antecedentes Patológicos / Médicos</label>
                    <textarea
                      rows={2}
                      placeholder="Hipertensión, diabetes, cirugías previas, antecedentes familiares..."
                      value={formData.pathologicalBackground}
                      onChange={e => setFormData({ ...formData, pathologicalBackground: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Medicamentos Habituales</label>
                    <input
                      type="text"
                      placeholder="Medicamentos que consume de forma regular..."
                      value={formData.currentMedications}
                      onChange={e => setFormData({ ...formData, currentMedications: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Contacto Emergencia (Nombre)</label>
                      <input
                        type="text"
                        placeholder="Ej: Madre / Cónyuge"
                        value={formData.emergencyContactName}
                        onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '3px' }}>Contacto Emergencia (Teléfono)</label>
                      <input
                        type="tel"
                        placeholder="Ej: 8888-0000"
                        value={formData.emergencyContactPhone}
                        onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Datos de Facturación Electrónica (Hacienda CR - Almendro) */}
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏛️ Datos de Facturación Electrónica (Hacienda CR)
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer', color: '#475569' }}>
                    <input
                      type="checkbox"
                      checked={formData.billingInfo?.requiresInvoice || false}
                      onChange={e => setFormData({
                        ...formData,
                        billingInfo: {
                          ...(formData.billingInfo || { idType: '01', idNumber: '', legalName: '', email: '' }),
                          requiresInvoice: e.target.checked
                        }
                      })}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Requiere factura</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px', color: '#475569' }}>Tipo Cédula</label>
                    <select
                      value={formData.billingInfo?.idType || '01'}
                      onChange={e => setFormData({
                        ...formData,
                        billingInfo: {
                          ...(formData.billingInfo || { requiresInvoice: false, idNumber: '', legalName: '', email: '' }),
                          idType: e.target.value
                        }
                      })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    >
                      <option value="01">Física (01)</option>
                      <option value="02">Jurídica (02)</option>
                      <option value="03">DIMEX (03)</option>
                      <option value="04">NITE (04)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px', color: '#475569' }}>Número de Cédula</label>
                    <input
                      type="text"
                      placeholder="Ej: 101110222"
                      value={formData.billingInfo?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        billingInfo: {
                          ...(formData.billingInfo || { requiresInvoice: false, idType: '01', legalName: '', email: '' }),
                          idNumber: e.target.value
                        }
                      })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px', color: '#475569' }}>Razón Social / Nombre Legal</label>
                    <input
                      type="text"
                      placeholder="Nombre registrado en Hacienda"
                      value={formData.billingInfo?.legalName || ''}
                      onChange={e => setFormData({
                        ...formData,
                        billingInfo: {
                          ...(formData.billingInfo || { requiresInvoice: false, idType: '01', idNumber: '', email: '' }),
                          legalName: e.target.value
                        }
                      })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px', color: '#475569' }}>Correo para Facturas</label>
                    <input
                      type="email"
                      placeholder="factura@cliente.com"
                      value={formData.billingInfo?.email || ''}
                      onChange={e => setFormData({
                        ...formData,
                        billingInfo: {
                          ...(formData.billingInfo || { requiresInvoice: false, idType: '01', idNumber: '', legalName: '' }),
                          email: e.target.value
                        }
                      })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Notas Generales</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones adicionales sobre el cliente o paciente..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  style={{ padding: '9px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  {savingRecord ? 'Guardando...' : editingRecord ? 'Actualizar Expediente' : 'Guardar Expediente'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CLINICAL ENTRY / EVOLUTION */}
      {/* ======================================================== */}
      {showEntryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '650px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>
                + Registrar Nota / Evolución Clínica
              </h3>
              <button onClick={() => setShowEntryModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Tipo de Entrada</label>
                  <select
                    value={entryData.entryType}
                    onChange={e => setEntryData({ ...entryData, entryType: e.target.value as any })}
                    style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="consultation">Consulta Clínica / Atención</option>
                    <option value="vital_signs">Toma de Signos Vitales</option>
                    <option value="prescription">Receta / Prescripción</option>
                    <option value="treatment">Tratamiento / Procedimiento</option>
                    <option value="note">Nota General de Seguimiento</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Especialista / Profesional</label>
                  <select
                    value={entryData.specialistId}
                    onChange={e => setEntryData({ ...entryData, specialistId: e.target.value })}
                    style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="">Seleccionar colaborador...</option>
                    {specialists.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.specialty})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Signos Vitales */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={15} /> Signos Vitales (Opcional)
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>Presión Art. (PA)</label>
                    <input
                      type="text"
                      placeholder="Ej: 120/80"
                      value={entryData.vitalSigns.bloodPressure}
                      onChange={e => setEntryData({ ...entryData, vitalSigns: { ...entryData.vitalSigns, bloodPressure: e.target.value } })}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.78rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>Pulso (lpm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 72"
                      value={entryData.vitalSigns.heartRate}
                      onChange={e => setEntryData({ ...entryData, vitalSigns: { ...entryData.vitalSigns, heartRate: e.target.value } })}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.78rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 36.5"
                      value={entryData.vitalSigns.temperature}
                      onChange={e => setEntryData({ ...entryData, vitalSigns: { ...entryData.vitalSigns, temperature: e.target.value } })}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.78rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 70.5"
                      value={entryData.vitalSigns.weightKg}
                      onChange={e => setEntryData({ ...entryData, vitalSigns: { ...entryData.vitalSigns, weightKg: e.target.value } })}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.78rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#166534' }}>Talla (cm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 175"
                      value={entryData.vitalSigns.heightCm}
                      onChange={e => setEntryData({ ...entryData, vitalSigns: { ...entryData.vitalSigns, heightCm: e.target.value } })}
                      style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Diagnóstico / Impresión Clínica</label>
                <input
                  type="text"
                  placeholder="Ej: Faringitis aguda, Gingivitis leve, Limpieza de rutina..."
                  value={entryData.diagnosis}
                  onChange={e => setEntryData({ ...entryData, diagnosis: e.target.value })}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Plan de Tratamiento / Recomendaciones</label>
                <textarea
                  rows={2}
                  placeholder="Indicaciones para el paciente, cuidados en casa o próximas citas..."
                  value={entryData.treatmentPlan}
                  onChange={e => setEntryData({ ...entryData, treatmentPlan: e.target.value })}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Medicamentos / Receta</label>
                <input
                  type="text"
                  placeholder="Medicamento, dosis, vía y frecuencia..."
                  value={entryData.prescription}
                  onChange={e => setEntryData({ ...entryData, prescription: e.target.value })}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '3px' }}>Notas Clínicas de la Consulta</label>
                <textarea
                  rows={3}
                  placeholder="Detalles de la sesión, procedimientos realizados o comentarios adicionales..."
                  value={entryData.notes}
                  onChange={e => setEntryData({ ...entryData, notes: e.target.value })}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
                >
                  {savingEntry ? 'Guardando...' : 'Guardar en Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FACTURAR CONSULTA / SERVICIO (ALMENDRO / HACIENDA) */}
      {/* ======================================================== */}
      {showFacturarModal && recordDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '600px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#059669' }}>
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 'bold' }}>
                    Facturar Consulta / Servicio
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Emisión electrónica directa ante Hacienda CR (Almendro)
                  </div>
                </div>
              </div>
              <button onClick={() => setShowFacturarModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmitRecordInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Tipo Comprobante</label>
                  <select
                    value={facturarData.docType}
                    onChange={e => setFacturarData({ ...facturarData, docType: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="01">01 - Factura Electrónica</option>
                    <option value="04">04 - Tiquete Electrónico</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Tasa IVA</label>
                  <select
                    value={facturarData.taxRateCode}
                    onChange={e => setFacturarData({ ...facturarData, taxRateCode: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    <option value="04">04 - Servicios de Salud (4% IVA)</option>
                    <option value="08">08 - Tarifa General (13% IVA)</option>
                    <option value="01">01 - Tarifa 0% (Exento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Detalle del Servicio *</label>
                <input
                  type="text"
                  required
                  value={facturarData.serviceName}
                  onChange={e => setFacturarData({ ...facturarData, serviceName: e.target.value })}
                  placeholder="Ej: Consulta Médica General / Procedimiento"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Monto Total (₡) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={facturarData.amount}
                    onChange={e => setFacturarData({ ...facturarData, amount: e.target.value })}
                    placeholder="Ej: 35000"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 'bold', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '3px' }}>Código CABYS</label>
                  <input
                    type="text"
                    value={facturarData.cabysCode}
                    onChange={e => setFacturarData({ ...facturarData, cabysCode: e.target.value })}
                    placeholder="8311100000000"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Receptor Details */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a', marginBottom: '8px' }}>
                  Datos del Cliente / Paciente (Receptor)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Tipo Cédula</label>
                    <select
                      value={facturarData.idType}
                      onChange={e => setFacturarData({ ...facturarData, idType: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    >
                      <option value="01">Física (01)</option>
                      <option value="02">Jurídica (02)</option>
                      <option value="03">DIMEX (03)</option>
                      <option value="04">NITE (04)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Número de Cédula</label>
                    <input
                      type="text"
                      placeholder="Ej: 101110222"
                      value={facturarData.idNumber}
                      onChange={e => setFacturarData({ ...facturarData, idNumber: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Nombre / Razón Social</label>
                    <input
                      type="text"
                      placeholder="Nombre legal"
                      value={facturarData.legalName}
                      onChange={e => setFacturarData({ ...facturarData, legalName: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: '#475569', marginBottom: '2px' }}>Correo de Envío</label>
                    <input
                      type="email"
                      placeholder="cliente@correo.com"
                      value={facturarData.email}
                      onChange={e => setFacturarData({ ...facturarData, email: e.target.value })}
                      style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowFacturarModal(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emittingInvoice}
                  style={{ padding: '8px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {emittingInvoice ? 'Emitiendo ante Hacienda...' : '⚡ Emitir Factura a Hacienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FACTURA ELECTRÓNICA RESULTADO (CLAVE NUMÉRICA + PDF) */}
      {/* ======================================================== */}
      {invoiceResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10002, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '520px',
            width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center'
          }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
              <Check size={32} />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 'bold' }}>
              ¡Factura Electrónica Emitida!
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#475569' }}>
              {invoiceResult.message}
            </p>

            {invoiceResult.numericKey && (
              <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Clave Numérica de Hacienda (50 dígitos):
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0f172a', wordBreak: 'break-all', backgroundColor: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  {invoiceResult.numericKey}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (invoiceResult.numericKey) {
                      navigator.clipboard.writeText(invoiceResult.numericKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }
                  }}
                  style={{ marginTop: '6px', background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy size={12} /> {copiedKey ? '✓ Clave Copiada' : 'Copiar Clave'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {(invoiceResult.pdfUrl || invoiceResult.numericKey) && (
                <a
                  href={
                    invoiceResult.pdfUrl && !invoiceResult.pdfUrl.includes('fe.almendro.cr')
                      ? invoiceResult.pdfUrl
                      : `/api/almendro/public/voucher-pdf/${invoiceResult.numericKey}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '10px 18px', backgroundColor: '#059669', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={16} /> Ver / Descargar PDF
                </a>
              )}
              <button
                type="button"
                onClick={() => setInvoiceResult(null)}
                style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
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
