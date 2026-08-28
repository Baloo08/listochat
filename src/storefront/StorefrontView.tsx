import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Minus, X, Check, ArrowRight, MessageCircle, AlertCircle, Trash2, MapPin, Truck, Store, ShieldCheck, Tag, Utensils, Navigation } from 'lucide-react';
import { Product, StoreSettings } from '../shared/types';

interface StorefrontProps {
  slug: string;
}

export default function StorefrontView({ slug }: StorefrontProps) {
  const [store, setStore] = useState<StoreSettings & { whatsappNumber?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Modal State
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Checkout Form State
  const [consumptionMode, setConsumptionMode] = useState<'dine_in' | 'pickup' | 'delivery'>('pickup');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGps, setCustomerGps] = useState<{ lat?: number; lng?: number; mapsUrl?: string }>({});
  const [fetchingGps, setFetchingGps] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'transfer' | 'cash'>('sinpe');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const storeRes = await fetch(`/api/storefront/${slug}`);
        if (!storeRes.ok) throw new Error('Tienda no encontrada');
        const storeData = await storeRes.json();
        setStore(storeData);

        if (storeData.storeMode === 'restaurant') {
          if (storeData.restaurantConfig?.allowDineIn) setConsumptionMode('dine_in');
          else if (storeData.restaurantConfig?.allowPickup) setConsumptionMode('pickup');
          else setConsumptionMode('delivery');
        }

        const prodRes = await fetch(`/api/storefront/${slug}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
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
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [store?.storeTheme?.fontFamily]);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || (p.category || 'General') === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>
    );
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setCustomerGps({ lat, lng, mapsUrl });
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

  const isDelivery = consumptionMode === 'delivery';
  const cartSubtotal = cart.reduce((acc, item) => acc + (Number(item.product.price || 0) * item.quantity), 0);
  const deliveryFee = (isDelivery && store?.deliveryEnabled) ? Number(store.deliveryFee || 0) : 0;
  const cartTotal = cartSubtotal + deliveryFee;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y número de WhatsApp');
      return;
    }
    if (isDelivery && !customerAddress && !customerGps.mapsUrl) {
      alert('Por favor ingresa la dirección de entrega o presiona Usar GPS');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        customerAddress: isDelivery ? customerAddress : undefined,
        customerLocation: customerGps.mapsUrl ? customerGps : undefined,
        consumptionMode,
        tableNumber: consumptionMode === 'dine_in' ? tableNumber : undefined,
        deliveryMethod: isDelivery ? 'delivery' : 'pickup',
        paymentMethod,
        paymentReference: paymentReference || undefined,
        notes: orderNotes || undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price
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

  // Theme Variables
  const primaryColor = store?.storeTheme?.primaryColor || '#16a34a';
  const bgColor = store?.storeTheme?.backgroundColor || '#f8fafc';
  const cardBg = store?.storeTheme?.cardBackgroundColor || '#ffffff';
  const fontFamily = store?.storeTheme?.fontFamily || 'Inter, sans-serif';
  const cardRadius = store?.storeTheme?.cardRadius === 'pill' ? '20px' : store?.storeTheme?.cardRadius === 'square' ? '4px' : '12px';
  const cardShadow = store?.storeTheme?.cardShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : store?.storeTheme?.cardShadow === 'sm' ? '0 1px 3px rgba(0,0,0,0.05)' : store?.storeTheme?.cardShadow === 'none' ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.07)';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, fontFamily }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Cargando catálogo...</p>
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
  const restConfig = store.restaurantConfig || { allowDineIn: true, dineInMode: 'table_number', tableCount: 15, allowPickup: true, allowDelivery: true };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, fontFamily, color: '#1e293b', paddingBottom: '90px' }}>
      
      {/* Optional Store Banner Hero */}
      {store.storeBannerUrl && (
        <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
          <img src={store.storeBannerUrl} alt={store.storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }} />
        </div>
      )}

      {/* Store Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {store.storeLogoUrl && (
              <img src={store.storeLogoUrl} alt={store.storeName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 'bold' }}>{store.storeName}</h1>
                {isRestaurant && (
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 'bold' }}>
                    Menú Digital
                  </span>
                )}
              </div>
              {store.storeDescription && <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{store.storeDescription}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, estoy viendo su catálogo ${store.storeName} y tengo una consulta.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 14px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              style={{ padding: '8px 16px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold', position: 'relative' }}
            >
              <ShoppingBag size={18} />
              <span>Ver Orden</span>
              {totalItemsCount > 0 && (
                <span style={{ backgroundColor: 'white', color: primaryColor, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '25px auto', padding: '0 20px' }}>
        
        {/* Search & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={isRestaurant ? "Buscar platillos, bebidas, postres..." : "Buscar productos en el catálogo..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: activeCategory === cat ? primaryColor : 'white',
                  color: activeCategory === cat ? 'white' : '#475569',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: cardRadius, border: '1px solid #e2e8f0' }}>
            <ShoppingBag size={40} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No se encontraron productos</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Intenta con otro término de búsqueda o categoría.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(prod => (
              <div
                key={prod.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: cardRadius,
                  boxShadow: cardShadow,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div
                  onClick={() => { setSelectedProduct(prod); setModalQuantity(1); }}
                  style={{ height: '180px', backgroundColor: '#f1f5f9', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                >
                  <img
                    src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60'}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {prod.category && (
                    <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {prod.category}
                    </span>
                  )}
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    onClick={() => { setSelectedProduct(prod); setModalQuantity(1); }}
                    style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {prod.name}
                  </h3>

                  {prod.description && (
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: primaryColor }}>
                        ₡{Number(prod.price || 0).toLocaleString('es-CR')}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(prod, 1)}
                      style={{ padding: '8px 14px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={15} /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)' }}>
            
            {/* Drawer Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color={primaryColor} /> {isRestaurant ? 'Tu Orden' : 'Tu Carrito'} ({totalItemsCount})
              </h2>
              <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                  <ShoppingBag size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>No has agregado productos a tu orden todavía.</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {cart.map(item => (
                      <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <img
                          src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60'}
                          alt={item.product.name}
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.product.name}</div>
                          <div style={{ color: primaryColor, fontWeight: 'bold', fontSize: '0.85rem' }}>
                            ₡{Number(item.product.price).toLocaleString('es-CR')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white' }}>
                          <button onClick={() => updateCartQuantity(item.product.id, -1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', padding: '0 4px' }}>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.product.id, 1)} style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Plus size={14} />
                          </button>
                        </div>

                        <button onClick={() => updateCartQuantity(item.product.id, -item.quantity)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Consumption Mode Selector (Restaurant vs Retail) */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px' }}>
                      {isRestaurant ? '¿Dónde deseas consumir tus alimentos?' : 'Método de Entrega'}
                    </label>
                    
                    {isRestaurant ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        {restConfig.allowDineIn && (
                          <button
                            type="button"
                            onClick={() => setConsumptionMode('dine_in')}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'dine_in' ? primaryColor : '#cbd5e1'}`,
                              backgroundColor: consumptionMode === 'dine_in' ? `${primaryColor}15` : 'white',
                              color: consumptionMode === 'dine_in' ? primaryColor : '#475569',
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
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'pickup' ? primaryColor : '#cbd5e1'}`,
                              backgroundColor: consumptionMode === 'pickup' ? `${primaryColor}15` : 'white',
                              color: consumptionMode === 'pickup' ? primaryColor : '#475569',
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
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: `2px solid ${consumptionMode === 'delivery' ? primaryColor : '#cbd5e1'}`,
                              backgroundColor: consumptionMode === 'delivery' ? `${primaryColor}15` : 'white',
                              color: consumptionMode === 'delivery' ? primaryColor : '#475569',
                              fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Truck size={18} />
                            <span>Delivery Express</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setConsumptionMode('pickup')}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: `2px solid ${consumptionMode === 'pickup' ? primaryColor : '#cbd5e1'}`,
                            backgroundColor: consumptionMode === 'pickup' ? `${primaryColor}10` : 'white',
                            color: consumptionMode === 'pickup' ? primaryColor : '#475569',
                            fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                        >
                          <Store size={16} /> Retiro en Tienda
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsumptionMode('delivery')}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: `2px solid ${consumptionMode === 'delivery' ? primaryColor : '#cbd5e1'}`,
                            backgroundColor: consumptionMode === 'delivery' ? `${primaryColor}10` : 'white',
                            color: consumptionMode === 'delivery' ? primaryColor : '#475569',
                            fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                        >
                          <Truck size={16} /> Envío ({store.deliveryFee ? `₡${Number(store.deliveryFee).toLocaleString('es-CR')}` : 'Gratis'})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* If Dine-In Mode Selected */}
                  {isRestaurant && consumptionMode === 'dine_in' && restConfig.dineInMode === 'table_number' && (
                    <div style={{ marginBottom: '16px', backgroundColor: '#ffedd5', padding: '12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#9a3412', marginBottom: '4px' }}>
                        🔢 Selecciona o Escribe tu Número de Mesa:
                      </label>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #f97316', backgroundColor: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}
                      >
                        {Array.from({ length: restConfig.tableCount || 15 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>Mesa #{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Checkout Form Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Nombre Completo *</label>
                      <input
                        type="text"
                        placeholder="Ej: Daniel Vega"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Teléfono WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="Ej: 8888-8888"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Delivery Address & GPS Location Button */}
                    {isDelivery && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Dirección de Entrega Exacta *</label>
                          <button
                            type="button"
                            onClick={handleGetGpsLocation}
                            disabled={fetchingGps}
                            style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Navigation size={12} /> {fetchingGps ? 'Obteniendo GPS...' : '📍 Usar mi Ubicación GPS'}
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Provincia, cantón, señas exactas o punto de referencia..."
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                        {customerGps.mapsUrl && (
                          <div style={{ fontSize: '0.75rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Coordenadas GPS detectadas exitosamente
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Method Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Método de Pago</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {store.acceptSinpe && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === 'sinpe'}
                              onChange={() => setPaymentMethod('sinpe')}
                            />
                            <span>📱 SINPE Móvil {store.sinpePhone && `(${store.sinpePhone} - ${store.sinpeName || ''})`}</span>
                          </label>
                        )}

                        {store.acceptTransfer && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === 'transfer'}
                              onChange={() => setPaymentMethod('transfer')}
                            />
                            <span>🏦 Transferencia Bancaria IBAN</span>
                          </label>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                          />
                          <span>💵 Efectivo / Pago al Recibir</span>
                        </label>
                      </div>
                    </div>

                    {paymentMethod !== 'cash' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Número de Comprobante / Referencia</label>
                        <input
                          type="text"
                          placeholder="Ej: #123456"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Notas o Indicaciones Especiales</label>
                      <input
                        type="text"
                        placeholder="Ej: Sin cebolla, extra salsa..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>₡{cartSubtotal.toLocaleString('es-CR')}</span>
                </div>

                {deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Costo de Envío Express:</span>
                    <span>₡{deliveryFee.toLocaleString('es-CR')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.15rem', fontWeight: 'bold', color: '#1e293b' }}>
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

      {/* ==========================================
          ORDER SUCCESS MODAL
      ========================================== */}
      {orderCompleted && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '30px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Check size={36} color="#166534" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', margin: '0 0 6px 0' }}>
              ¡Orden Recibida con Éxito!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
              Tu pedido <strong style={{ color: '#1e293b' }}>{orderCompleted.orderCode}</strong> ha sido registrado en <strong>{orderCompleted.storeName || store.storeName}</strong>.
            </p>

            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e2e8f0' }}>
              <div><strong>Cliente:</strong> {orderCompleted.customerName} ({orderCompleted.customerPhone})</div>
              <div><strong>Total:</strong> ₡{Number(orderCompleted.total).toLocaleString('es-CR')}</div>
              <div><strong>Modalidad:</strong> {orderCompleted.consumptionMode === 'dine_in' ? `En Mesa (#${orderCompleted.tableNumber || 1})` : orderCompleted.deliveryMethod === 'delivery' ? 'A Domicilio' : 'Para Llevar / Retiro'}</div>
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
              style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#64748b' }}
            >
              Cerrar y Seguir Navegando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
