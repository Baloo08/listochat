import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, Check, ArrowRight, MessageCircle, 
  AlertCircle, Trash2, MapPin, Truck, Store, ShieldCheck, Tag, Utensils, 
  Navigation, Package, User, Palette, Sliders, CheckCircle2, Building2 
} from 'lucide-react';
import { Product, StoreSettings, DeliveryConfig, CustomVariable, CustomVariableOption } from '../shared/types';
import { getCRProvincias, getCRCantones, getCRDistritos } from '../shared/costaRicaDivisions';

interface StorefrontProps {
  slug: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedVariables?: Record<string, any>;
  selectedVariablesSummary?: string;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directKm = R * c;
  return Math.round(directKm * 1.25 * 10) / 10;
}

function calculateCorreosCrRate(
  correosConfig: any,
  origin: 'GAM' | 'RESTO',
  dest: 'GAM' | 'RESTO',
  totalGrams: number,
  includeIva: boolean
): { rate: number; bracketLabel: string } {
  const ivaFactor = includeIva ? 1.13 : 1.0;
  const isSameGam = origin === 'GAM' && dest === 'GAM';
  const serviceType = correosConfig?.serviceType || 'pyme';
  const customRates = correosConfig?.rates;

  if (Array.isArray(customRates) && customRates.length > 0) {
    const sorted = [...customRates].sort((a, b) => (Number(a.maxGrams) || 0) - (Number(b.maxGrams) || 0));
    const matching = sorted.find(r => totalGrams <= (Number(r.maxGrams) || 999999));
    if (matching) {
      const price = isSameGam ? matching.gamPrice : matching.restoPrice;
      return {
        rate: Math.round(Number(price || 0) * ivaFactor),
        bracketLabel: matching.label || `${totalGrams} g`
      };
    }
  }

  // Official Fallback Rates
  if (serviceType === 'pyme') {
    if (totalGrams <= 500) {
      const base = isSameGam ? 1100 : 1350;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Pymes Liviano (Hasta 500 g)' };
    } else if (totalGrams <= 2000) {
      const base = isSameGam ? 1769.91 : 2477.88;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Pymes Especial Gold (Hasta 2 kg)' };
    } else if (totalGrams <= 3000) {
      const base = isSameGam ? 2425 : 3360;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Pyme Plus (Hasta 3 kg)' };
    } else if (totalGrams <= 10000) {
      const base = 3982.30;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Carga Liviana (3 a 10 kg)' };
    } else if (totalGrams <= 20000) {
      const base = 9800;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Pymes Pesado Express (10 a 20 kg)' };
    } else if (totalGrams <= 30000) {
      const base = 14000;
      return { rate: Math.round(base * ivaFactor), bracketLabel: 'Pymes Pesado Express (20 a 30 kg)' };
    } else {
      const extraKg = Math.ceil((totalGrams - 30000) / 1000);
      const base = 14000 + (extraKg * 1000);
      return { rate: Math.round(base * ivaFactor), bracketLabel: `Pesado Express (${Math.round(totalGrams/1000)} kg)` };
    }
  } else {
    let firstKg = isSameGam ? 2168.14 : (origin === 'RESTO' && dest === 'RESTO' ? 3761.06 : 2964.60);
    let extraKgRate = isSameGam ? 1238.94 : (origin === 'RESTO' && dest === 'RESTO' ? 1548.67 : 1371.68);
    const weightKg = Math.max(1, totalGrams / 1000);
    const extraCount = Math.max(0, Math.ceil(weightKg - 1));
    const baseTotal = firstKg + (extraCount * extraKgRate);
    return { rate: Math.round(baseTotal * ivaFactor), bracketLabel: `EMS Courier (${Math.ceil(weightKg)} kg)` };
  }
}

function hexIsDark(hex?: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

export default function StorefrontView({ slug }: StorefrontProps) {
  const [store, setStore] = useState<StoreSettings & { whatsappNumber?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Modal State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariables, setSelectedVariables] = useState<Record<string, any>>({});
  const [modalQuantity, setModalQuantity] = useState(1);

  // Checkout Form State
  const [consumptionMode, setConsumptionMode] = useState<'dine_in' | 'pickup' | 'delivery' | 'correos_cr'>('pickup');
  const [dineInSubMode, setDineInSubMode] = useState<'table' | 'name'>('table');
  const [correosDestination, setCorreosDestination] = useState<'GAM' | 'RESTO'>('GAM');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGps, setCustomerGps] = useState<{ lat?: number; lng?: number; mapsUrl?: string }>({});
  const [fetchingGps, setFetchingGps] = useState(false);
  const [calculatedKm, setCalculatedKm] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'cash' | 'transfer'>('sinpe');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('');
  const [selectedDistrito, setSelectedDistrito] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  // Multi-Branch Franchise States
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/storefront/${slug}`);
        if (!res.ok) {
          throw new Error('No se pudo encontrar la tienda');
        }
        const data = await res.json();
        setStore(data);

        // Fetch products
        const prodRes = await fetch(`/api/storefront/${slug}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }

        // Fetch active branches
        try {
          const branchRes = await fetch(`/api/storefront/${slug}/branches`);
          if (branchRes.ok) {
            const bData = await branchRes.json();
            if (Array.isArray(bData)) {
              setBranches(bData);
              if (bData.length > 0) {
                const main = bData.find((b: any) => b.isMain) || bData[0];
                setSelectedBranch(main);
              }
            }
          }
        } catch (bErr) {
          // ignore
        }
      } catch (err: any) {
        setError(err.message || 'Error cargando la tienda');
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [slug]);

  // Load custom Google Font dynamically
  useEffect(() => {
    if (store?.storeTheme?.fontFamily) {
      const font = store.storeTheme.fontFamily;
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [store?.storeTheme?.fontFamily]);

  // When opening product modal, initialize variables defaults
  const handleOpenProductModal = (prod: Product) => {
    setSelectedProduct(prod);
    setModalQuantity(1);
    const initialVars: Record<string, any> = {};
    if (prod.customVariables && Array.isArray(prod.customVariables)) {
      prod.customVariables.forEach(group => {
        if (group.type === 'checkbox') {
          initialVars[group.name] = [];
        } else if (group.options && group.options.length > 0) {
          initialVars[group.name] = group.options[0].name;
        }
      });
    }
    setSelectedVariables(initialVars);
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || (p.category || 'General') === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const calculateModalUnitPrice = (prod: Product, vars: Record<string, any>) => {
    let unit = Number(prod.price || 0);
    if (!prod.customVariables || !Array.isArray(prod.customVariables)) return unit;
    for (const group of prod.customVariables) {
      const val = vars[group.name];
      if (!val) continue;
      if (Array.isArray(val)) {
        for (const item of val) {
          const opt = group.options.find(o => o.name === item);
          if (opt && opt.priceDelta) unit += Number(opt.priceDelta);
        }
      } else {
        const opt = group.options.find(o => o.name === val);
        if (opt && opt.priceDelta) unit += Number(opt.priceDelta);
      }
    }
    return unit;
  };

  const addCustomizedProductToCart = (prod: Product, qty = 1, vars: Record<string, any> = {}) => {
    const unitPrice = calculateModalUnitPrice(prod, vars);
    
    // Build summary string
    const summaryParts: string[] = [];
    for (const [k, v] of Object.entries(vars)) {
      if (!v) continue;
      if (Array.isArray(v) && v.length > 0) {
        summaryParts.push(`${k}: ${v.join(', ')}`);
      } else if (typeof v === 'string' && v) {
        summaryParts.push(`${k}: ${v}`);
      }
    }
    const summary = summaryParts.join(' • ');
    const itemId = `${prod.id}_${summary}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product: prod,
          quantity: qty,
          unitPrice,
          selectedVariables: vars,
          selectedVariablesSummary: summary
        }
      ];
    });
  };

  const handleCardQuickAdd = (prod: Product) => {
    if (prod.customVariables && prod.customVariables.length > 0) {
      handleOpenProductModal(prod);
    } else {
      addCustomizedProductToCart(prod, 1, {});
    }
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  useEffect(() => {
    if (selectedProvincia) {
      const parts = [selectedProvincia];
      if (selectedCanton) parts.push(selectedCanton);
      if (selectedDistrito) parts.push(selectedDistrito);
      if (exactAddress) parts.push(exactAddress);
      setCustomerAddress(parts.join(', '));
    }
  }, [selectedProvincia, selectedCanton, selectedDistrito, exactAddress]);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setCustomerGps({ lat, lng, mapsUrl });

        if (store?.deliveryConfig?.storeLocation?.lat && store?.deliveryConfig?.storeLocation?.lng) {
          const sLat = store.deliveryConfig.storeLocation.lat;
          const sLng = store.deliveryConfig.storeLocation.lng;
          const km = calculateDistanceKm(sLat, sLng, lat, lng);
          setCalculatedKm(km);
        }

        setCustomerAddress(prev => prev ? `${prev} (GPS: ${mapsUrl})` : `Ubicación GPS: ${mapsUrl}`);
        setFetchingGps(false);
      },
      (error) => {
        alert('No se pudo obtener la ubicación GPS: ' + error.message);
        setFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const dConfig: DeliveryConfig = store?.deliveryConfig || {
    deliveryType: 'flat',
    storeLocation: { lat: 9.9333, lng: -84.0833, address: 'San José' },
    baseDeliveryFee: 1500,
    baseDeliveryKm: 3,
    feePerExtraKm: 350,
    maxDeliveryRadiusKm: 25,
    correosCrEnabled: true,
    originLocationType: 'GAM',
    correosIncludeIva: true
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (Number(item.unitPrice || item.product.price || 0) * item.quantity), 0);
  const totalWeightGrams = cart.reduce((acc, item) => acc + ((Number(item.product.weightGrams) || 350) * item.quantity), 0);

  let deliveryFee = 0;
  let correosRateInfo = { rate: 0, bracketLabel: '' };

  if (consumptionMode === 'delivery') {
    if (dConfig.deliveryType === 'distance' && calculatedKm !== null) {
      if (calculatedKm <= dConfig.baseDeliveryKm) {
        deliveryFee = dConfig.baseDeliveryFee;
      } else {
        const extraKm = Math.ceil(calculatedKm - dConfig.baseDeliveryKm);
        deliveryFee = dConfig.baseDeliveryFee + (extraKm * dConfig.feePerExtraKm);
      }
    } else {
      deliveryFee = Number(store?.deliveryFee || dConfig.baseDeliveryFee || 0);
    }
  } else if (consumptionMode === 'correos_cr') {
    correosRateInfo = calculateCorreosCrRate(
      store?.correosCrConfig,
      dConfig.originLocationType || 'GAM',
      correosDestination,
      totalWeightGrams,
      dConfig.correosIncludeIva !== false
    );
    deliveryFee = correosRateInfo.rate;
  }

  const cartTotal = cartSubtotal + deliveryFee;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y número de WhatsApp');
      return;
    }
    if ((consumptionMode === 'delivery' || consumptionMode === 'correos_cr') && !customerAddress && !customerGps.mapsUrl) {
      alert('Por favor ingresa la dirección de entrega');
      return;
    }

    setIsSubmitting(true);
    try {
      const isDeliveryType = consumptionMode === 'delivery' || consumptionMode === 'correos_cr';
      const payload = {
        customerName,
        customerPhone,
        customerAddress: isDeliveryType ? customerAddress : undefined,
        customerLocation: customerGps.mapsUrl ? { ...customerGps, distanceKm: calculatedKm } : undefined,
        consumptionMode,
        tableNumber: consumptionMode === 'dine_in' && dineInSubMode === 'table' ? tableNumber : undefined,
        deliveryMethod: consumptionMode === 'correos_cr' ? 'correos_cr' : (consumptionMode === 'delivery' ? 'delivery' : 'pickup'),
        paymentMethod,
        paymentReference: paymentReference || undefined,
        branchId: selectedBranch?.id || undefined,
        notes: orderNotes || undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.selectedVariablesSummary ? `${item.product.name} (${item.selectedVariablesSummary})` : item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          selectedVariables: item.selectedVariables
        }))
      };

      const res = await fetch(`/api/storefront/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al procesar pedido');
      }

      const orderData = await res.json();
      setOrderCompleted(orderData);
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = store?.storeTheme?.primaryColor || '#16a34a';
  const bgColor = store?.storeTheme?.backgroundColor || '#f8fafc';
  const cardBg = store?.storeTheme?.cardBackgroundColor || '#ffffff';
  const fontFamily = store?.storeTheme?.fontFamily || 'Inter, sans-serif';
  const isDark = hexIsDark(bgColor);
  const titleColor = store?.storeTheme?.titleColor || (isDark ? '#ffffff' : '#0f172a');
  const bodyTextColor = store?.storeTheme?.bodyTextColor || (isDark ? '#94a3b8' : '#64748b');
  const titleFontWeight = store?.storeTheme?.titleFontWeight || 'bold';
  const bodyFontWeight = store?.storeTheme?.bodyFontWeight || 'normal';
  const cardRadius = store?.storeTheme?.cardRadius === 'pill' ? '20px' : store?.storeTheme?.cardRadius === 'square' ? '4px' : '12px';
  const cardShadow = store?.storeTheme?.cardShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : store?.storeTheme?.cardShadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.05)' : store?.storeTheme?.cardShadow === 'none' ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.07)';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, fontFamily }}>
        <p style={{ fontSize: '1.2rem', color: isDark ? '#ffffff' : '#64748b' }}>Cargando catálogo...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily }}>
        <div style={{ textAlign: 'center', maxWidth: '450px', backgroundColor: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 15px auto' }} />
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>Catálogo no disponible</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>La página ingresada no existe o se encuentra desactivada.</p>
        </div>
      </div>
    );
  }

  const isRestaurant = store.storeMode === 'restaurant';
  const restConfig = store.restaurantConfig || { allowDineIn: true, allowTableNumber: true, allowCallByName: true, tableCount: 15, allowPickup: true, allowDelivery: true };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily, color: isDark ? '#f1f5f9' : '#1e293b', paddingBottom: '90px', transition: 'background-color 0.2s ease' }}>
      
      {/* Top Banner (if uploaded) */}
      {store.storeBannerUrl && (
        <div style={{ width: '100%', aspectRatio: '16 / 5', minHeight: '140px', maxHeight: '320px', overflow: 'hidden', position: 'relative', backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
          <img
            src={store.storeBannerUrl}
            alt={store.storeName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5))' }} />
        </div>
      )}

      {/* Header Container */}
      <header style={{ 
        maxWidth: '1000px', margin: '0 auto', padding: '20px 16px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        gap: '15px', flexWrap: 'wrap',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {store.storeLogoUrl ? (
            <img
              src={store.storeLogoUrl}
              alt={store.storeName}
              style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>
              {store.storeName.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: titleFontWeight, color: titleColor }}>
              {store.storeName}
            </h1>
            {store.storeDescription && (
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: bodyFontWeight, color: bodyTextColor }}>
                {store.storeDescription}
              </p>
            )}
          </div>
        </div>

        {/* WhatsApp Contact & Cart Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {store.whatsappNumber && (
            <a
              href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${store.storeName}, deseo consultar sobre su catálogo.`)}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '8px 14px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageCircle size={16} /> Contactar
            </a>
          )}

          {branches.length >= 2 && (
            <button
              onClick={() => setShowBranchModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                border: `1px solid ${primaryColor}40`,
                borderRadius: '20px',
                color: primaryColor,
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
              title="Cambiar sucursal"
            >
              <MapPin size={14} />
              <span>Sede: <strong>{selectedBranch?.name || 'Elegir'}</strong></span>
              <span style={{ fontSize: '0.7rem' }}>▾</span>
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', padding: '10px 16px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
          >
            <ShoppingBag size={18} />
            <span>{isRestaurant ? 'Orden' : 'Carrito'}</span>
            {totalItemsCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px' }}>
        
        {/* Search Bar & Category Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={18} color={bodyTextColor} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar platillo o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#1e293b' : 'white',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px', borderRadius: '20px',
                  border: 'none',
                  backgroundColor: activeCategory === cat ? primaryColor : (isDark ? '#1e293b' : 'white'),
                  color: activeCategory === cat ? 'white' : bodyTextColor,
                  fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: cardBg, borderRadius: cardRadius, border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
            <ShoppingBag size={40} color={bodyTextColor} style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: titleColor }}>No se encontraron productos</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(prod => {
              const hasVars = prod.customVariables && prod.customVariables.length > 0;
              return (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: cardBg, borderRadius: cardRadius, boxShadow: cardShadow,
                    overflow: 'hidden', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column'
                  }}
                >
                  <div
                    onClick={() => handleOpenProductModal(prod)}
                    style={{ height: '180px', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  >
                    <img
                      src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60'}
                      alt={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {prod.category && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {prod.category}
                      </span>
                    )}
                    {hasVars && (
                      <span style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: primaryColor, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sliders size={11} /> Personalizable
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      onClick={() => handleOpenProductModal(prod)}
                      style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: titleFontWeight, color: titleColor, cursor: 'pointer' }}
                    >
                      {prod.name}
                    </h3>

                    {prod.description && (
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: bodyFontWeight, color: bodyTextColor, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prod.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: primaryColor }}>
                        ₡{Number(prod.price || 0).toLocaleString('es-CR')}
                      </span>

                      <button
                        onClick={() => handleCardQuickAdd(prod)}
                        style={{ padding: '8px 14px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {hasVars ? <Sliders size={14} /> : <Plus size={15} />}
                        <span>{hasVars ? 'Opciones' : 'Agregar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, width: '90%', maxWidth: '480px' }}>
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ width: '100%', padding: '14px 20px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ backgroundColor: 'white', color: primaryColor, borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                {totalItemsCount}
              </span>
              <span>{isRestaurant ? 'Ver mi Orden' : 'Ver Carrito'}</span>
            </div>
            <span>₡{cartTotal.toLocaleString('es-CR')} →</span>
          </button>
        </div>
      )}

      {/* ==========================================
          SHOPPING CART & CHECKOUT DRAWER
      ========================================== */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: cardBg, width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', color: isDark ? '#ffffff' : '#0f172a' }}>
            
            <div style={{ padding: '18px 20px', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: titleFontWeight, color: titleColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color={primaryColor} /> {isRestaurant ? 'Tu Orden' : 'Tu Carrito'} ({totalItemsCount})
              </h2>
              <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: bodyTextColor }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: bodyTextColor }}>
                  <ShoppingBag size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>No has agregado productos a tu orden todavía.</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '10px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                        <img
                          src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60'}
                          alt={item.product.name}
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: titleColor }}>{item.product.name}</div>
                          {item.selectedVariablesSummary && (
                            <div style={{ fontSize: '0.75rem', color: bodyTextColor, marginTop: '2px' }}>
                              {item.selectedVariablesSummary}
                            </div>
                          )}
                          <div style={{ color: primaryColor, fontWeight: 'bold', fontSize: '0.85rem', marginTop: '2px' }}>
                            ₡{Number(item.unitPrice).toLocaleString('es-CR')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: isDark ? '#0f172a' : 'white' }}>
                          <button onClick={() => updateCartQuantity(item.id, -1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: isDark ? 'white' : 'black' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '0 4px' }}>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: isDark ? 'white' : 'black' }}>
                            <Plus size={14} />
                          </button>
                        </div>

                        <button onClick={() => updateCartQuantity(item.id, -item.quantity)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Delivery & Consumption Selector */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: titleColor }}>
                      {isRestaurant ? '¿Dónde deseas consumir tus alimentos?' : 'Modalidad de Entrega'}
                    </label>
                    
                    {isRestaurant ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                        {restConfig.allowDineIn && (
                          <button
                            type="button"
                            onClick={() => setConsumptionMode('dine_in')}
                            style={{
                              padding: '10px 8px', borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'dine_in' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                              backgroundColor: consumptionMode === 'dine_in' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                              color: consumptionMode === 'dine_in' ? primaryColor : bodyTextColor,
                              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Utensils size={18} />
                            <span>En Mesa / Local</span>
                          </button>
                        )}

                        {restConfig.allowPickup && (
                          <button
                            type="button"
                            onClick={() => setConsumptionMode('pickup')}
                            style={{
                              padding: '10px 8px', borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'pickup' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                              backgroundColor: consumptionMode === 'pickup' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                              color: consumptionMode === 'pickup' ? primaryColor : bodyTextColor,
                              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Store size={18} />
                            <span>Para Llevar</span>
                          </button>
                        )}

                        {restConfig.allowDelivery && (
                          <button
                            type="button"
                            onClick={() => setConsumptionMode('delivery')}
                            style={{
                              padding: '10px 8px', borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'delivery' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                              backgroundColor: consumptionMode === 'delivery' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                              color: consumptionMode === 'delivery' ? primaryColor : bodyTextColor,
                              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Truck size={18} />
                            <span>Delivery Express</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setConsumptionMode('pickup')}
                          style={{
                            padding: '10px 8px', borderRadius: '8px',
                            border: `2px solid ${consumptionMode === 'pickup' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                            backgroundColor: consumptionMode === 'pickup' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                            color: consumptionMode === 'pickup' ? primaryColor : bodyTextColor,
                            fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Store size={18} />
                          <span>Retiro en Local</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsumptionMode('delivery')}
                          style={{
                            padding: '10px 8px', borderRadius: '8px',
                            border: `2px solid ${consumptionMode === 'delivery' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                            backgroundColor: consumptionMode === 'delivery' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                            color: consumptionMode === 'delivery' ? primaryColor : bodyTextColor,
                            fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Truck size={18} />
                          <span>Entrega Express</span>
                        </button>

                        {store.correosCrConfig?.enabled !== false && (
                          <button
                            type="button"
                            onClick={() => setConsumptionMode('correos_cr')}
                            style={{
                              padding: '10px 8px', borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'correos_cr' ? primaryColor : (isDark ? '#334155' : '#cbd5e1')}`,
                              backgroundColor: consumptionMode === 'correos_cr' ? `${primaryColor}15` : (isDark ? '#1e293b' : 'white'),
                              color: consumptionMode === 'correos_cr' ? primaryColor : bodyTextColor,
                              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Package size={18} />
                            <span>Correos de Costa Rica</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Customer Information Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: titleColor }}>Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Tu nombre y apellidos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: titleColor }}>Teléfono WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej: 8888-8888"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Delivery Address if Express or Correos */}
                    {(consumptionMode === 'delivery' || consumptionMode === 'correos_cr') && (
                      <div style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc', padding: '14px', borderRadius: '10px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: titleColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={15} color={primaryColor} /> 
                            {consumptionMode === 'correos_cr' ? 'Dirección Oficial de Envío (Costa Rica)' : 'Ubicación y Dirección de Entrega'}
                          </label>

                          {consumptionMode === 'delivery' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleGetGpsLocation();
                                setShowMapPreview(true);
                              }}
                              disabled={fetchingGps}
                              style={{ border: 'none', background: 'none', color: primaryColor, fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: `${primaryColor}15` }}
                            >
                              <Navigation size={13} /> {fetchingGps ? 'Obteniendo...' : '📍 Usar GPS'}
                            </button>
                          )}
                        </div>

                        {/* 3-Tier Cascading Costa Rica Selectors */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          {/* 1. Provincia */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: bodyTextColor, marginBottom: '2px' }}>
                              Provincia *
                            </label>
                            <select
                              value={selectedProvincia}
                              onChange={(e) => {
                                setSelectedProvincia(e.target.value);
                                setSelectedCanton('');
                                setSelectedDistrito('');
                              }}
                              style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.78rem' }}
                            >
                              <option value="">-- Seleccionar --</option>
                              {getCRProvincias().map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Cantón */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: bodyTextColor, marginBottom: '2px' }}>
                              Cantón *
                            </label>
                            <select
                              value={selectedCanton}
                              disabled={!selectedProvincia}
                              onChange={(e) => {
                                setSelectedCanton(e.target.value);
                                setSelectedDistrito('');
                              }}
                              style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.78rem', opacity: selectedProvincia ? 1 : 0.6 }}
                            >
                              <option value="">-- Seleccionar --</option>
                              {selectedProvincia && getCRCantones(selectedProvincia).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Distrito */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: bodyTextColor, marginBottom: '2px' }}>
                              Distrito *
                            </label>
                            <select
                              value={selectedDistrito}
                              disabled={!selectedCanton}
                              onChange={(e) => setSelectedDistrito(e.target.value)}
                              style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.78rem', opacity: selectedCanton ? 1 : 0.6 }}
                            >
                              <option value="">-- Seleccionar --</option>
                              {selectedProvincia && selectedCanton && getCRDistritos(selectedProvincia, selectedCanton).map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Señas Exactas */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: bodyTextColor, marginBottom: '2px' }}>
                            Señas Exactas de Entrega *
                          </label>
                          <textarea
                            rows={2}
                            required
                            placeholder="Ej: 200 metros norte de la iglesia, casa de dos pisos portón negro..."
                            value={exactAddress}
                            onChange={(e) => setExactAddress(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.82rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Interactive Embedded GPS Map Preview */}
                        {consumptionMode === 'delivery' && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <button
                                type="button"
                                onClick={() => setShowMapPreview(!showMapPreview)}
                                style={{ border: 'none', background: 'none', color: primaryColor, fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                              >
                                <MapPin size={12} /> {showMapPreview ? 'Ocultar mapa' : '🗺️ Ver mapa de ubicación'}
                              </button>
                              {customerGps.lat && customerGps.lng && (
                                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 'bold' }}>
                                  ✓ GPS fijado ({customerGps.lat.toFixed(4)}, {customerGps.lng.toFixed(4)})
                                </span>
                              )}
                            </div>

                            {showMapPreview && (
                              <div style={{ borderRadius: '8px', overflow: 'hidden', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', marginTop: '6px' }}>
                                <iframe
                                  title="Selector de Mapa"
                                  width="100%"
                                  height="170"
                                  style={{ border: 0, display: 'block' }}
                                  loading="lazy"
                                  src={`https://maps.google.com/maps?q=${customerGps.lat || 9.9281},+${customerGps.lng || -84.0907}&z=15&output=embed`}
                                />
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: titleColor }}>Notas o Indicaciones</label>
                      <input
                        type="text"
                        placeholder="Indicaciones especiales para la entrega o preparación..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : 'white', color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '20px', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: bodyTextColor }}>
                  <span>Subtotal:</span>
                  <span>₡{cartSubtotal.toLocaleString('es-CR')}</span>
                </div>

                {deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: bodyTextColor }}>
                    <span>
                      {consumptionMode === 'correos_cr' ? 'Costo Correos CR:' : (calculatedKm ? `Envío Express (${calculatedKm} km):` : 'Costo de Envío:')}
                    </span>
                    <span>₡{deliveryFee.toLocaleString('es-CR')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.15rem', fontWeight: 'bold', color: titleColor }}>
                  <span>Total:</span>
                  <span style={{ color: primaryColor }}>₡{cartTotal.toLocaleString('es-CR')}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '14px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                >
                  {isSubmitting ? 'Procesando...' : `Confirmar Pedido • ₡${cartTotal.toLocaleString('es-CR')}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderCompleted && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '30px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', color: isDark ? '#ffffff' : '#0f172a' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Check size={36} color="#166534" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', margin: '0 0 6px 0' }}>
              ¡Orden Recibida con Éxito!
            </h2>
            <p style={{ color: bodyTextColor, fontSize: '0.9rem', margin: '0 0 20px 0' }}>
              Tu pedido <strong style={{ color: titleColor }}>{orderCompleted.orderCode}</strong> ha sido registrado en <strong>{orderCompleted.storeName || store.storeName}</strong>.
            </p>

            <div style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
              <div><strong>Cliente:</strong> {orderCompleted.customerName} ({orderCompleted.customerPhone})</div>
              <div><strong>Total:</strong> ₡{Number(orderCompleted.total).toLocaleString('es-CR')}</div>
              <div><strong>Modalidad:</strong> {orderCompleted.consumptionMode === 'correos_cr' ? 'Correos de Costa Rica' : (orderCompleted.consumptionMode === 'dine_in' ? (orderCompleted.tableNumber ? `En Mesa (#${orderCompleted.tableNumber})` : 'Llamado por Nombre') : (orderCompleted.deliveryMethod === 'delivery' ? 'A Domicilio Express' : 'Retiro en Local'))}</div>
            </div>

            {orderCompleted.whatsappNumber && (
              <a
                href={`https://wa.me/${orderCompleted.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, acabo de realizar el pedido ${orderCompleted.orderCode} por un total de ₡${Number(orderCompleted.total).toLocaleString('es-CR')}. Mi nombre es ${orderCompleted.customerName}.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}
              >
                <MessageCircle size={18} /> Abrir WhatsApp con el Negocio
              </a>
            )}

            <button
              onClick={() => setOrderCompleted(null)}
              style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: bodyTextColor }}
            >
              Cerrar y Seguir Navegando
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          PRODUCT DETAIL & VARIABLE CUSTOMIZATION MODAL
      ============================================================== */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '18px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', color: isDark ? '#ffffff' : '#0f172a' }}>
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '14px', right: '14px', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Product Image */}
            <div style={{ width: '100%', height: '250px', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', position: 'relative' }}>
              <img
                src={selectedProduct.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60'}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {selectedProduct.category && (
                <span style={{ position: 'absolute', bottom: '12px', left: '14px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {selectedProduct.category}
                </span>
              )}
            </div>

            {/* Details Body */}
            <div style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: titleFontWeight, color: titleColor }}>
                  {selectedProduct.name}
                </h2>
                <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: primaryColor, whiteSpace: 'nowrap' }}>
                  ₡{calculateModalUnitPrice(selectedProduct, selectedVariables).toLocaleString('es-CR')}
                </div>
              </div>

              {selectedProduct.weightGrams && Number(selectedProduct.weightGrams) > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', color: bodyTextColor, fontWeight: '600', marginBottom: '12px' }}>
                  <Package size={13} /> {selectedProduct.weightGrams} gramos
                </div>
              )}

              {selectedProduct.description ? (
                <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: bodyFontWeight, color: bodyTextColor, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedProduct.description}
                </p>
              ) : null}

              {/* Custom Variables / Modifiers Selection */}
              {selectedProduct.customVariables && selectedProduct.customVariables.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0 20px 0', padding: '14px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderRadius: '12px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  {selectedProduct.customVariables.map(group => (
                    <div key={group.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: titleColor }}>
                          {group.name}
                        </label>
                        {group.required && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold' }}>Requerido</span>
                        )}
                      </div>

                      {/* 1. COLOR SELECTION (SWATCHES & CHROMATIC CIRCLES) */}
                      {group.type === 'color' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {group.options.map(opt => {
                            const isSelected = selectedVariables[group.name] === opt.name;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedVariables(prev => ({ ...prev, [group.name]: opt.name }))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 12px', borderRadius: '20px',
                                  border: isSelected ? `2px solid ${primaryColor}` : (isDark ? '1px solid #475569' : '1px solid #cbd5e1'),
                                  backgroundColor: isSelected ? `${primaryColor}20` : (isDark ? '#0f172a' : '#ffffff'),
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span
                                  style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    backgroundColor: opt.colorHex || '#3b82f6',
                                    border: '1px solid rgba(0,0,0,0.2)',
                                    display: 'inline-block'
                                  }}
                                />
                                <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? primaryColor : titleColor }}>
                                  {opt.name}
                                </span>
                                {opt.priceDelta ? (
                                  <span style={{ fontSize: '0.75rem', color: primaryColor, fontWeight: 'bold' }}>
                                    (+₡{Number(opt.priceDelta).toLocaleString('es-CR')})
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. SELECT / RADIO OPTIONS (Tallas, Materiales, etc.) */}
                      {(group.type === 'select' || group.type === 'radio') && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {group.options.map(opt => {
                            const isSelected = selectedVariables[group.name] === opt.name;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedVariables(prev => ({ ...prev, [group.name]: opt.name }))}
                                style={{
                                  padding: '8px 14px', borderRadius: '8px',
                                  border: isSelected ? `2px solid ${primaryColor}` : (isDark ? '1px solid #475569' : '1px solid #cbd5e1'),
                                  backgroundColor: isSelected ? `${primaryColor}20` : (isDark ? '#0f172a' : '#ffffff'),
                                  color: isSelected ? primaryColor : titleColor,
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                  fontSize: '0.85rem', cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>{opt.name}</span>
                                {opt.priceDelta ? (
                                  <span style={{ marginLeft: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    (+₡{Number(opt.priceDelta).toLocaleString('es-CR')})
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. MULTI-SELECT CHECKBOXES (Extras, Ingredientes, etc.) */}
                      {group.type === 'checkbox' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {group.options.map(opt => {
                            const currentList = Array.isArray(selectedVariables[group.name]) ? selectedVariables[group.name] : [];
                            const isChecked = currentList.includes(opt.name);
                            return (
                              <label
                                key={opt.id}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 12px', borderRadius: '8px',
                                  border: isChecked ? `1px solid ${primaryColor}` : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
                                  backgroundColor: isChecked ? `${primaryColor}15` : (isDark ? '#0f172a' : '#ffffff'),
                                  cursor: 'pointer', fontSize: '0.85rem',
                                  color: titleColor
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...currentList, opt.name]
                                        : currentList.filter((x: string) => x !== opt.name);
                                      setSelectedVariables(prev => ({ ...prev, [group.name]: next }));
                                    }}
                                  />
                                  <span style={{ fontWeight: isChecked ? 'bold' : 'normal' }}>{opt.name}</span>
                                </div>
                                {opt.priceDelta ? (
                                  <span style={{ fontWeight: 'bold', color: primaryColor, fontSize: '0.8rem' }}>
                                    +₡{Number(opt.priceDelta).toLocaleString('es-CR')}
                                  </span>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Add to Cart Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '16px', borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: isDark ? 'white' : 'black' }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', minWidth: '32px', textAlign: 'center', color: titleColor }}>
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    style={{ padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: isDark ? 'white' : 'black' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    addCustomizedProductToCart(selectedProduct, modalQuantity, selectedVariables);
                    setSelectedProduct(null);
                    setModalQuantity(1);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    backgroundColor: primaryColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  <ShoppingBag size={18} />
                  <span>Agregar • ₡{(calculateModalUnitPrice(selectedProduct, selectedVariables) * modalQuantity).toLocaleString('es-CR')}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 85, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', color: isDark ? '#ffffff' : '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color={primaryColor} />
                Selecciona tu Sucursal
              </h3>
              <button onClick={() => setShowBranchModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: bodyTextColor }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: bodyTextColor, margin: '0 0 16px 0' }}>
              Elige la sede desde donde deseas retirar o recibir tu pedido:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {branches.map((b: any) => {
                const isSelected = selectedBranch?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBranch(b);
                      setShowBranchModal(false);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `2px solid ${isSelected ? primaryColor : (isDark ? '#334155' : '#e2e8f0')}`,
                      backgroundColor: isSelected ? `${primaryColor}10` : (isDark ? '#1e293b' : '#f8fafc'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: isSelected ? primaryColor : titleColor }}>
                        {b.name} {b.isMain && <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px', marginLeft: '6px' }}>Principal</span>}
                      </div>
                      {b.address && <div style={{ fontSize: '0.75rem', color: bodyTextColor, marginTop: '2px' }}>{b.address}</div>}
                    </div>
                    {isSelected && <CheckCircle2 size={18} color={primaryColor} />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowBranchModal(false)}
              style={{ width: '100%', padding: '11px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Confirmar Sede
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
