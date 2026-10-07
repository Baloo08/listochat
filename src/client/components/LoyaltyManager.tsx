import React, { useState, useEffect } from 'react';
import { 
  Gift, Users, Tag, Award, Plus, Check, AlertCircle, RefreshCw, 
  Trash2, Search, ArrowRight, ShieldCheck, Clock, DollarSign,
  Ticket, Percent, ExternalLink, Sparkles, Filter, CheckCircle2, XCircle
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { LoyaltyProgram, LoyaltyCard, LoyaltyPromotion, LoyaltyRewardVoucher, LoyaltyTransaction, DiscountCoupon } from '../../shared/types';

interface LoyaltyManagerProps {
  initialTab?: 'ajustes' | 'clientes' | 'promociones';
}

export default function LoyaltyManager({ initialTab = 'ajustes' }: LoyaltyManagerProps) {
  const { fetchWithAuth } = useApi();
  const [activeTab, setActiveTab] = useState<'ajustes' | 'clientes' | 'promociones'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [savingProgram, setSavingProgram] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Program State
  const [program, setProgram] = useState<Partial<LoyaltyProgram>>({
    isActive: true,
    programType: 'both',
    currency: 'CRC',
    pointsSpendRatio: 1000,
    pointsRedeemRatio: 10,
    pointsExpiryMonths: 12,
    stampsTarget: 10,
    stampsPrize: '1 Producto de la casa gratis',
    minSpendPerStamp: 3000
  });

  // Cards y Search State
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingCards, setSearchingCards] = useState(false);

  // Points/Stamps Adjustment Modal State
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [modalMode, setModalMode] = useState<'points' | 'stamp' | 'history' | null>(null);
  const [pointsDelta, setPointsDelta] = useState<number>(100);
  const [pointsActionType, setPointsActionType] = useState<'add' | 'redeem'>('add');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Transactions History State
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // New Customer Register State
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [newCustId, setNewCustId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);

  // Promotions y Vouchers State
  const [promotions, setPromotions] = useState<LoyaltyPromotion[]>([]);
  const [vouchers, setVouchers] = useState<LoyaltyRewardVoucher[]>([]);
  const [showNewPromoModal, setShowNewPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    promoType: 'double_points' as 'double_points' | 'bonus_stamps' | 'discount_rate',
    multiplier: 2,
    minSpend: 5000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Discount Coupons State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [showNewCouponModal, setShowNewCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    validUntil: ''
  });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Voucher / Coupon Quick Redeem
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherRedeemResult, setVoucherRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Program
      const progRes = await fetchWithAuth('/api/loyalty/program');
      if (progRes) {
        setProgram(progRes);
      }

      // 2. Cards
      const cardsRes = await fetchWithAuth('/api/loyalty/cards?limit=25');
      if (cardsRes) {
        setCards(cardsRes.cards || []);
        setCardsTotal(cardsRes.total || 0);
      }

      // 3. Promotions, Vouchers y Cupones
      const [promosRes, vouchersRes, couponsRes] = await Promise.all([
        fetchWithAuth('/api/loyalty/promotions').catch(() => []),
        fetchWithAuth('/api/loyalty/vouchers').catch(() => []),
        fetchWithAuth('/api/coupons').catch(() => [])
      ]);
      setPromotions(promosRes || []);
      setVouchers(vouchersRes || []);
      setCoupons(Array.isArray(couponsRes) ? couponsRes : (couponsRes?.coupons || []));
    } catch (err: any) {
      console.error('Error cargando módulo de fidelización:', err);
      setError(err.message || 'Error al cargar datos de fidelización');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProgram(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await fetchWithAuth('/api/loyalty/program', {
        method: 'PUT',
        body: JSON.stringify(program)
      });
      setProgram(updated);
      setSuccessMsg('¡Ajustes de tarjeta guardados con éxito!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar ajustes del programa');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleSearchCards = async (queryStr: string) => {
    setSearchQuery(queryStr);
    setSearchingCards(true);
    try {
      const res = await fetchWithAuth(`/api/loyalty/cards?search=${encodeURIComponent(queryStr)}&limit=25`);
      setCards(res.cards || []);
      setCardsTotal(res.total || 0);
    } catch (err: any) {
      console.error('Error buscando clientes:', err);
    } finally {
      setSearchingCards(false);
    }
  };

  const handleCreateCustomerCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustId || !newCustName) return;
    setCreatingCard(true);
    try {
      const created = await fetchWithAuth('/api/loyalty/cards', {
        method: 'POST',
        body: JSON.stringify({
          identification: newCustId,
          customerName: newCustName,
          customerPhone: newCustPhone
        })
      });
      setCards(prev => [created, ...prev.filter(c => c.id !== created.id)]);
      setCardsTotal(prev => prev + 1);
      setShowNewCardModal(false);
      setNewCustId('');
      setNewCustName('');
      setNewCustPhone('');
      setSuccessMsg('¡Cliente registrado exitosamente en el Club de Fidelidad!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al registrar cliente');
    } finally {
      setCreatingCard(false);
    }
  };

  const handleOpenPointsModal = (card: LoyaltyCard) => {
    setSelectedCard(card);
    setModalMode('points');
    setPointsDelta(100);
    setPointsActionType('add');
    setActionNotes('');
  };

  const handleOpenStampModal = (card: LoyaltyCard) => {
    setSelectedCard(card);
    setModalMode('stamp');
    setActionNotes('');
  };

  const handleOpenHistoryModal = async (card: LoyaltyCard) => {
    setSelectedCard(card);
    setModalMode('history');
    setLoadingTx(true);
    try {
      const txs = await fetchWithAuth(`/api/loyalty/cards/${card.id}/transactions`);
      setTransactions(txs || []);
    } catch (err: any) {
      console.error('Error al cargar transacciones:', err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSubmitPointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setSubmittingAction(true);
    try {
      const updated = await fetchWithAuth(`/api/loyalty/cards/${selectedCard.id}/points`, {
        method: 'POST',
        body: JSON.stringify({
          points: Number(pointsDelta),
          type: pointsActionType,
          notes: actionNotes || (pointsActionType === 'add' ? 'Ajuste manual de puntos' : 'Canje manual de puntos')
        })
      });
      setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
      setModalMode(null);
      setSelectedCard(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar puntos');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setSubmittingAction(true);
    try {
      const res = await fetchWithAuth(`/api/loyalty/cards/${selectedCard.id}/stamp`, {
        method: 'POST',
        body: JSON.stringify({
          stamps: 1,
          notes: actionNotes || 'Sello manual otorgado en caja'
        })
      });
      setCards(prev => prev.map(c => c.id === res.card.id ? res.card : c));
      if (res.voucher) {
        setVouchers(prev => [res.voucher, ...prev]);
        alert(`🎉 ¡Felicidades! El cliente ha completado su tarjeta. Se generó el cupón de premio: ${res.voucher.voucherCode}`);
      }
      setModalMode(null);
      setSelectedCard(null);
    } catch (err: any) {
      alert(err.message || 'Error al otorgar sello');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromo(true);
    try {
      const created = await fetchWithAuth('/api/loyalty/promotions', {
        method: 'POST',
        body: JSON.stringify(newPromo)
      });
      setPromotions(prev => [created, ...prev]);
      setShowNewPromoModal(false);
      setNewPromo({
        title: '',
        description: '',
        promoType: 'double_points',
        multiplier: 2,
        minSpend: 5000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
      });
    } catch (err: any) {
      alert(err.message || 'Error al crear promoción');
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta promoción?')) return;
    try {
      await fetchWithAuth(`/api/loyalty/promotions/${id}`, { method: 'DELETE' });
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar promoción');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCoupon(true);
    try {
      const payload = {
        code: newCoupon.code.trim().toUpperCase(),
        description: newCoupon.description.trim() || undefined,
        discountType: newCoupon.discountType,
        discountValue: Number(newCoupon.discountValue),
        minOrderAmount: Number(newCoupon.minOrderAmount) > 0 ? Number(newCoupon.minOrderAmount) : undefined,
        maxDiscountAmount: Number(newCoupon.maxDiscountAmount) > 0 ? Number(newCoupon.maxDiscountAmount) : undefined,
        usageLimit: Number(newCoupon.usageLimit) > 0 ? Number(newCoupon.usageLimit) : undefined,
        validUntil: newCoupon.validUntil ? new Date(newCoupon.validUntil).toISOString() : undefined
      };
      const created = await fetchWithAuth('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setCoupons(prev => [created, ...prev]);
      setShowNewCouponModal(false);
      setNewCoupon({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        validUntil: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error al crear cupón');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const updated = await fetchWithAuth(`/api/coupons/${id}/toggle`, { method: 'PATCH' });
      setCoupons(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err: any) {
      alert(err.message || 'Error al actualizar cupón');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cupón de descuento?')) return;
    try {
      await fetchWithAuth(`/api/coupons/${id}`, { method: 'DELETE' });
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cupón');
    }
  };

  const handleRedeemVoucher = async (codeOrId: string) => {
    const cleanCode = codeOrId.trim().toUpperCase();
    if (!cleanCode) return;
    setRedeemingVoucher(true);
    setVoucherRedeemResult(null);
    try {
      const res = await fetchWithAuth('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cashierNotes: 'Canje manual desde panel de fidelización' })
      });
      if (res.voucher) {
        setVouchers(prev => prev.map(v => v.id === res.voucher.id ? res.voucher : v));
      }
      setVoucherRedeemResult({
        success: true,
        message: res.message || `¡Código ${cleanCode} canjeado con éxito!`
      });
      setVoucherCodeInput('');
      fetchWithAuth('/api/coupons').then(cList => {
        if (Array.isArray(cList)) setCoupons(cList);
      }).catch(() => {});
    } catch (err: any) {
      setVoucherRedeemResult({
        success: false,
        message: err.message || 'Código inválido o ya canjeado'
      });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '14px' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--primary)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Cargando módulo de fidelización...</p>
      </div>
    );
  }

  const currSymbol = program.currency === 'USD' ? '$' : '₡';

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main, #1e293b)' }}>Fidelización y Club de Clientes</h1>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted, #64748b)' }}>
                Tarjetas digitales de acumulación de puntos, sellos de recompensa y monedero de clientes
              </p>
            </div>
          </div>
        </div>

        {/* Public Wallet Link Badge */}
        <a 
          href="/fidelidad" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', borderRadius: '24px', 
            backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', 
            color: '#334155', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' 
          }}
        >
          <Ticket size={16} color="var(--primary)" />
          <span>App Monedero: <strong>betico.tech/fidelidad</strong></span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border, #e2e8f0)', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ajustes')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'ajustes' ? '700' : '500',
            color: activeTab === 'ajustes' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'ajustes' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Gift size={18} />
          <span>Ajustes de Tarjeta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'clientes' ? '700' : '500',
            color: activeTab === 'clientes' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'clientes' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Users size={18} />
          <span>Clientes Registrados ({cardsTotal})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promociones')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.92rem',
            fontWeight: activeTab === 'promociones' ? '700' : '500',
            color: activeTab === 'promociones' ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'promociones' ? '3px solid var(--primary, #2563eb)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Tag size={18} />
          <span>Cupones, Promociones y Canjes</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AJUSTES DE TARJETA */}
      {/* ========================================================================= */}
      {activeTab === 'ajustes' && (
        <form onSubmit={handleSaveProgram} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Status Switch */}
          <div style={{ backgroundColor: 'var(--surface, #ffffff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>Estado del Programa de Fidelidad</div>
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Habilita o pausa la acumulación y canje de puntos y sellos en las ventas y bot de WhatsApp.</div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={program.isActive ?? true}
                onChange={(e) => setProgram({ ...program, isActive: e.target.checked })}
                style={{ width: '22px', height: '22px', cursor: 'pointer' }}
              />
              <span style={{ color: program.isActive ? '#16a34a' : '#dc2626' }}>
                {program.isActive ? 'Programa Activo' : 'Programa Pausado'}
              </span>
            </label>
          </div>

          {/* Program Mode Selection */}
          <div style={{ backgroundColor: 'var(--surface, #ffffff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>Modalidad de Fidelización</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              
              {/* Option 1: Points */}
              <div 
                onClick={() => setProgram({ ...program, programType: 'points' })}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${program.programType === 'points' ? 'var(--primary, #2563eb)' : '#e2e8f0'}`,
                  backgroundColor: program.programType === 'points' ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <DollarSign size={20} color="var(--primary, #2563eb)" />
                  <strong style={{ fontSize: '0.95rem' }}>Acumulación de Puntos</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Ganan puntos por cada compra con equivalencia configurable a colones o dólares.
                </p>
              </div>

              {/* Option 2: Stamps */}
              <div 
                onClick={() => setProgram({ ...program, programType: 'stamps' })}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${program.programType === 'stamps' ? 'var(--primary, #2563eb)' : '#e2e8f0'}`,
                  backgroundColor: program.programType === 'stamps' ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Award size={20} color="var(--primary, #2563eb)" />
                  <strong style={{ fontSize: '0.95rem' }}>Tarjeta por Sellos</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Tarjeta de perforación digital (ej. 10 sellos). Al completar la meta genera un cupón de premio para la tienda, WhatsApp o caja.
                </p>
              </div>

              {/* Option 3: Both */}
              <div 
                onClick={() => setProgram({ ...program, programType: 'both' })}
                style={{
                  padding: '16px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${program.programType === 'both' ? 'var(--primary, #2563eb)' : '#e2e8f0'}`,
                  backgroundColor: program.programType === 'both' ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Sparkles size={20} color="var(--primary, #2563eb)" />
                  <strong style={{ fontSize: '0.95rem' }}>Ambos (Puntos + Sellos)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Los clientes acumulan saldo de puntos y a la vez sellos en cada consumo calificado.
                </p>
              </div>

            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Moneda del Programa</label>
              <select
                value={program.currency || 'CRC'}
                onChange={(e) => setProgram({ ...program, currency: e.target.value as 'CRC' | 'USD' })}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '200px' }}
              >
                <option value="CRC">Colones costarricenses (₡ CRC)</option>
                <option value="USD">Dólares estadounidenses ($ USD)</option>
              </select>
            </div>
          </div>

          {/* Points Settings (if points or both) */}
          {(program.programType === 'points' || program.programType === 'both') && (
            <div style={{ backgroundColor: 'var(--surface, #ffffff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <DollarSign size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>Reglas de Acumulación y Canje de Puntos</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Tasa de Acumulación: Gasto por cada 1 Punto ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={program.pointsSpendRatio || 1000}
                    onChange={(e) => setProgram({ ...program, pointsSpendRatio: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="Ej. 1000 (1 punto por cada ₡1,000)"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Por cada {currSymbol}{Number(program.pointsSpendRatio || 1000).toLocaleString('es-CR')} de consumo, el cliente recibe 1 punto.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Valor de Canje: Descuento por cada 1 Punto ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={program.pointsRedeemRatio || 10}
                    onChange={(e) => setProgram({ ...program, pointsRedeemRatio: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="Ej. 10 (Cada punto descuenta ₡10)"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    100 puntos equivaldrán a {currSymbol}{Math.round(100 * Number(program.pointsRedeemRatio || 10)).toLocaleString('es-CR')} de saldo a favor.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Caducidad de los Puntos (Meses)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={program.pointsExpiryMonths ?? 12}
                    onChange={(e) => setProgram({ ...program, pointsExpiryMonths: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="0 para sin caducidad"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {program.pointsExpiryMonths && program.pointsExpiryMonths > 0 ? `Vencen a los ${program.pointsExpiryMonths} meses de inactividad.` : '¡Los puntos nunca vencen!'}
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Stamps Settings (if stamps or both) */}
          {(program.programType === 'stamps' || program.programType === 'both') && (
            <div style={{ backgroundColor: 'var(--surface, #ffffff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Award size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>Reglas de Tarjeta por Sellos</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Meta de Sellos por Tarjeta
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={program.stampsTarget || 10}
                    onChange={(e) => setProgram({ ...program, stampsTarget: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="Ej. 10 sellos"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Número de sellos necesarios para desbloquear el premio digital.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Gasto Mínimo por Sello ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={program.minSpendPerStamp || 0}
                    onChange={(e) => setProgram({ ...program, minSpendPerStamp: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="Ej. 3000"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Monto mínimo de la orden para que otorgue 1 sello.
                  </span>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
                    Premio al Completar la Meta
                  </label>
                  <input
                    type="text"
                    value={program.stampsPrize || ''}
                    onChange={(e) => setProgram({ ...program, stampsPrize: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    placeholder="Ej. 1 Café americano con repostería gratis / 50% de descuento en el próximo servicio"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Este premio se reflejará en el cupón con código alfanumérico generado automáticamente.
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingProgram}
              style={{
                padding: '12px 28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {savingProgram ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
              <span>{savingProgram ? 'Guardando...' : 'Guardar Ajustes de Tarjeta'}</span>
            </button>
          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLIENTES REGISTRADOS */}
      {/* ========================================================================= */}
      {activeTab === 'clientes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Action Bar y Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => handleSearchCards(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button
              type="button"
              onClick={() => setShowNewCardModal(true)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Plus size={18} />
              <span>+ Registrar Cliente Manualmente</span>
            </button>
          </div>

          {/* Cards List / Table */}
          <div style={{ backgroundColor: 'var(--surface, #ffffff)', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Cédula</th>
                    <th style={{ padding: '12px 16px' }}>Cliente</th>
                    <th style={{ padding: '12px 16px' }}>Teléfono</th>
                    <th style={{ padding: '12px 16px' }}>Saldo Puntos</th>
                    <th style={{ padding: '12px 16px' }}>Sellos</th>
                    <th style={{ padding: '12px 16px' }}>Última Actividad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        {searchQuery ? 'No se encontraron clientes con ese criterio de búsqueda' : 'Aún no hay clientes registrados en el Club de Fidelización'}
                      </td>
                    </tr>
                  ) : (
                    cards.map((card) => {
                      const moneyEq = Math.round(Number(card.pointsBalance) * Number(program.pointsRedeemRatio || 10));
                      return (
                        <tr key={card.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>
                            {card.identification}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                            {card.customerName}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>
                            {card.customerPhone || '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--primary, #2563eb)' }}>
                              {Number(card.pointsBalance).toLocaleString()} pts
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              ({currSymbol}{moneyEq.toLocaleString('es-CR')})
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '0.8rem' }}>
                              <Award size={14} color="#f59e0b" />
                              <span>{card.currentStamps} / {program.stampsTarget || 10}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                            {card.lastActivityAt ? new Date(card.lastActivityAt).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                title="Ajustar o Canjear Puntos"
                                onClick={() => handleOpenPointsModal(card)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#1e293b' }}
                              >
                                Puntos
                              </button>
                              <button
                                type="button"
                                title="Dar Sello Manual"
                                onClick={() => handleOpenStampModal(card)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#d97706' }}
                              >
                                + Sello
                              </button>
                              <button
                                type="button"
                                title="Historial de Transacciones"
                                onClick={() => handleOpenHistoryModal(card)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#475569' }}
                              >
                                Historial
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUPONES, PROMOCIONES Y CANJES */}
      {/* ========================================================================= */}
      {activeTab === 'promociones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Voucher / Coupon Scanner and Redeem Box */}
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '2px dashed #93c5fd', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket size={22} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>Canje Rápido de Cupones y Premios en Caja</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
              Ingresa el código alfanumérico que presenta el cliente: cupón promocional (ej. VERANO10) o premio de fidelidad (ej. VOUCH-...):
            </p>

            <div style={{ display: 'flex', gap: '10px', maxWidth: '480px' }}>
              <input
                type="text"
                placeholder="Código de cupón o premio (ej. VERANO10, VOUCH-...)"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (voucherCodeInput.trim() && !redeemingVoucher) {
                      handleRedeemVoucher(voucherCodeInput.trim());
                    }
                  }
                }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontWeight: '700' }}
              />
              <button
                type="button"
                disabled={!voucherCodeInput.trim() || redeemingVoucher}
                onClick={() => handleRedeemVoucher(voucherCodeInput.trim())}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {redeemingVoucher ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Verificar y Canjear</span>
              </button>
            </div>

            {voucherRedeemResult && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                backgroundColor: voucherRedeemResult.success ? '#dcfce7' : '#fee2e2',
                color: voucherRedeemResult.success ? '#166534' : '#991b1b'
              }}>
                {voucherRedeemResult.message}
              </div>
            )}
          </div>

          {/* Section: Cupones de Descuento Promocionales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} color="var(--primary)" />
                  <span>Cupones de Descuento Promocionales</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  Códigos que aplican descuento en el checkout de la tienda online, en el bot de WhatsApp y en caja física.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCouponModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus size={16} />
                <span>+ Nuevo Cupón de Descuento</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {coupons.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  No hay cupones de descuento creados aún. Presiona "+ Nuevo Cupón de Descuento" para crear el primero.
                </div>
              ) : (
                coupons.map((c) => (
                  <div key={c.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: c.active ? '1px solid #bbf7d0' : '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: '800',
                          backgroundColor: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: '#0f172a',
                          letterSpacing: '1px'
                        }}>
                          {c.code}
                        </span>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: c.active ? '#dcfce7' : '#f1f5f9',
                          color: c.active ? '#166534' : '#64748b'
                        }}>
                          {c.active ? 'Activo' : 'Pausado'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.id)}
                          title={c.active ? 'Pausar cupón' : 'Activar cupón'}
                          style={{
                            border: '1px solid #cbd5e1', backgroundColor: '#ffffff', borderRadius: '6px',
                            padding: '4px 8px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer',
                            color: c.active ? '#d97706' : '#16a34a'
                          }}
                        >
                          {c.active ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id)}
                          title="Eliminar cupón"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#16a34a' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% de Descuento` : `₡${Number(c.discountValue).toLocaleString('es-CR')} Descuento Fijo`}
                      </div>
                      {c.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Usos: <strong>{c.usedCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'veces'}</strong></span>
                        {c.minOrderAmount ? <span>Mínimo: ₡{Number(c.minOrderAmount).toLocaleString('es-CR')}</span> : null}
                      </div>
                      {c.validUntil && (
                        <div>
                          Vence: {new Date(c.validUntil).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Promotions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Promociones y Multiplicadores de Temporada</h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Multiplica puntos o regala sellos adicionales en compras especiales</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPromoModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary, #2563eb)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus size={16} />
                <span>+ Nueva Promoción</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {promotions.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  No hay promociones activas registradas en este momento
                </div>
              ) : (
                promotions.map((promo) => (
                  <div key={promo.id} style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700',
                        backgroundColor: promo.promoType === 'double_points' ? '#fef3c7' : '#e0e7ff',
                        color: promo.promoType === 'double_points' ? '#92400e' : '#3730a3'
                      }}>
                        {promo.promoType === 'double_points' ? `Multiplicador x${promo.multiplier} Puntos` : promo.promoType === 'bonus_stamps' ? '+1 Sello Extra' : 'Descuento Especial'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{promo.title}</strong>
                    {promo.description && <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{promo.description}</p>}

                    <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mínimo: {currSymbol}{Number(promo.minSpend).toLocaleString('es-CR')}</span>
                      <span>Vence: {promo.endDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vouchers History Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Registro de Cupones Emitidos</h3>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Código</th>
                      <th style={{ padding: '10px 14px' }}>Premio</th>
                      <th style={{ padding: '10px 14px' }}>Estado</th>
                      <th style={{ padding: '10px 14px' }}>Emitido</th>
                      <th style={{ padding: '10px 14px' }}>Vencimiento</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          Aún no se han emitido cupones de premio por sellos
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((v) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '700', fontFamily: 'monospace' }}>
                            {v.voucherCode}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                            {v.rewardDescription}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: '700',
                              backgroundColor: v.status === 'active' ? '#dcfce7' : v.status === 'redeemed' ? '#f1f5f9' : '#fee2e2',
                              color: v.status === 'active' ? '#166534' : v.status === 'redeemed' ? '#64748b' : '#991b1b'
                            }}>
                              {v.status === 'active' ? 'Disponible' : v.status === 'redeemed' ? 'Canjeado' : 'Vencido'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(v.createdAt).toLocaleDateString('es-CR')}
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b' }}>
                            {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('es-CR') : 'Sin vencimiento'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {v.status === 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleRedeemVoucher(v.voucherCode)}
                                style={{
                                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                                  backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '600',
                                  fontSize: '0.78rem', cursor: 'pointer'
                                }}
                              >
                                Canjear
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                {v.redeemedAt ? `Canjeado el ${new Date(v.redeemedAt).toLocaleDateString('es-CR')}` : 'No disponible'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR CLIENTE MANUALMENTE */}
      {/* ========================================================================= */}
      {showNewCardModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '420px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Registrar Cliente en el Club</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Ingresa la cédula (identificador único universal) y los datos de contacto del cliente.
            </p>

            <form onSubmit={handleCreateCustomerCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Cédula *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1-1234-5678 o 112345678"
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Ej. 8888-8888"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCard}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary, #2563eb)', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {creatingCard ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTAR PUNTOS */}
      {/* ========================================================================= */}
      {modalMode === 'points' && selectedCard && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '420px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Ajustar Puntos</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Cliente: <strong>{selectedCard.customerName}</strong> ({selectedCard.identification})<br />
              Saldo actual: <strong>{Number(selectedCard.pointsBalance).toLocaleString()} puntos</strong>
            </p>

            <form onSubmit={handleSubmitPointsAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPointsActionType('add')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700',
                    backgroundColor: pointsActionType === 'add' ? '#16a34a' : '#f1f5f9',
                    color: pointsActionType === 'add' ? '#ffffff' : '#475569'
                  }}
                >
                  + Sumar Puntos
                </button>
                <button
                  type="button"
                  onClick={() => setPointsActionType('redeem')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700',
                    backgroundColor: pointsActionType === 'redeem' ? '#dc2626' : '#f1f5f9',
                    color: pointsActionType === 'redeem' ? '#ffffff' : '#475569'
                  }}
                >
                  - Canjear / Restar
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Cantidad de Puntos</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Motivo o Nota</label>
                <input
                  type="text"
                  placeholder="Ej. Bonificación por fidelidad / Descuento en factura"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setModalMode(null); setSelectedCard(null); }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary, #2563eb)', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submittingAction ? 'Procesando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DAR SELLO */}
      {/* ========================================================================= */}
      {modalMode === 'stamp' && selectedCard && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '400px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Otorgar Sello</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Cliente: <strong>{selectedCard.customerName}</strong><br />
              Sellos acumulados: <strong>{selectedCard.currentStamps} de {program.stampsTarget || 10}</strong>
            </p>

            <form onSubmit={handleSubmitStamp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Nota (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Consumo en caja #1"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setModalMode(null); setSelectedCard(null); }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submittingAction ? 'Guardando...' : 'Confirmar Sello (+1)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTORIAL DE TRANSACCIONES */}
      {/* ========================================================================= */}
      {modalMode === 'history' && selectedCard && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '560px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Historial de Movimientos</h3>
              <button
                type="button"
                onClick={() => { setModalMode(null); setSelectedCard(null); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Movimientos del cliente <strong>{selectedCard.customerName}</strong> ({selectedCard.identification})
            </p>

            {loadingTx ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Cargando movimientos...</div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No hay movimientos registrados para esta tarjeta</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map((tx) => (
                  <div key={tx.id} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>
                        {tx.type === 'earn_points' ? '➕ Puntos ganados' : tx.type === 'redeem_points' ? '➖ Canje de puntos' : tx.type === 'earn_stamps' ? '🏷️ Sello otorgado' : '🎁 Tarjeta completada'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.76rem' }}>{tx.notes || 'Sin nota'} • {new Date(tx.createdAt).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '700' }}>
                      {tx.pointsDelta !== 0 && (
                        <div style={{ color: tx.pointsDelta > 0 ? '#16a34a' : '#dc2626' }}>
                          {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                        </div>
                      )}
                      {tx.stampsDelta !== 0 && (
                        <div style={{ color: '#d97706' }}>
                          +{tx.stampsDelta} sello
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVA PROMOCIÓN */}
      {/* ========================================================================= */}
      {showNewPromoModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '460px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Crear Promoción de Fidelidad</h3>

            <form onSubmit={handleCreatePromo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Título de la Promoción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Doble puntaje fines de semana"
                  value={newPromo.title}
                  onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Tipo de Recompensa *</label>
                <select
                  value={newPromo.promoType}
                  onChange={(e) => setNewPromo({ ...newPromo, promoType: e.target.value as any })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="double_points">Multiplicador de Puntos (ej. x2, x3)</option>
                  <option value="bonus_stamps">Sello Extra en la compra</option>
                </select>
              </div>

              {newPromo.promoType === 'double_points' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Multiplicador (xN)</label>
                  <input
                    type="number"
                    min="1.5"
                    step="0.5"
                    value={newPromo.multiplier}
                    onChange={(e) => setNewPromo({ ...newPromo, multiplier: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Consumo Mínimo ({currSymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newPromo.minSpend}
                  onChange={(e) => setNewPromo({ ...newPromo, minSpend: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={newPromo.startDate}
                    onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={newPromo.endDate}
                    onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewPromoModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPromo}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary, #2563eb)', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {creatingPromo ? 'Creando...' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO CUPÓN DE DESCUENTO */}
      {/* ========================================================================= */}
      {showNewCouponModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '24px', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={22} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>Crear Cupón de Descuento</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCouponModal(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Este cupón podrá ser utilizado por clientes en la tienda online, dictado al bot en WhatsApp o canjeado en caja física.
            </p>

            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '4px' }}>
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BIENVENIDO10, VERANO20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '800', fontFamily: 'monospace', letterSpacing: '1px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '4px' }}>
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10% de descuento en tu primera compra"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '4px' }}>
                    Tipo de Descuento *
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ({currSymbol})</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '4px' }}>
                    Valor del Descuento *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step={newCoupon.discountType === 'percentage' ? '1' : '100'}
                    placeholder={newCoupon.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 2000'}
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>
                    Compra Mínima ({currSymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Opcional (ej: 5000)"
                    value={newCoupon.minOrderAmount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>
                    Límite de Usos Totales
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ilimitado si es 0"
                    value={newCoupon.usageLimit || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '4px' }}>
                  Fecha de Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={newCoupon.validUntil}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewCouponModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCoupon}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {creatingCoupon ? 'Guardando...' : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
