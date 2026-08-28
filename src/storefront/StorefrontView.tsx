import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Minus, X, Check, ArrowRight, MessageCircle, AlertCircle, Trash2, MapPin, Truck, Store, ShieldCheck, Tag } from 'lucide-react';
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
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
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

  const cartSubtotal = cart.reduce((acc, item) => acc + (Number(item.product.price || 0) * item.quantity), 0);
  const deliveryFee = (deliveryMethod === 'delivery' && store?.deliveryEnabled) ? Number(store.deliveryFee || 0) : 0;
  const cartTotal = cartSubtotal + deliveryFee;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y número de WhatsApp');
      return;
    }
    if (deliveryMethod === 'delivery' && !customerAddress) {
      alert('Por favor ingresa la dirección de entrega');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        customerAddress: deliveryMethod === 'delivery' ? customerAddress : undefined,
        deliveryMethod,
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
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Cargando catálogo de la tienda...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily }}>
        <div style={{ textAlign: 'center', maxWidth: '450px', backgroundColor: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 15px auto' }} />
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>Tienda no encontrada</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>La tienda ingresada no existe o se encuentra temporalmente desactivada.</p>
        </div>
      </div>
    );
  }

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
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 'bold' }}>{store.storeName}</h1>
              {store.storeDescription && <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{store.storeDescription}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {store.whatsappNumber && (
              <a
                href={`https://wa.me/${store.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, estoy viendo tu tienda ${store.storeName} y tengo una consulta.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}
              >
                <MessageCircle size={16} /> <span style={{ display: window.innerWidth > 500 ? 'inline' : 'none' }}>WhatsApp</span>
              </a>
            )}

            {/* Cart Button Header */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              <ShoppingBag size={18} />
              <span>Carrito</span>
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
        
        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar productos en la tienda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.95rem' }}
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
                  fontWeight: activeCategory === cat ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: cardBg, borderRadius: cardRadius, border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>No se encontraron productos disponibles.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(product => {
              const primaryImg = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60';
              const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
              const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setModalQuantity(1);
                  }}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: cardRadius,
                    boxShadow: cardShadow,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                    <img src={primaryImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {hasDiscount && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        -{discountPercent}%
                      </span>
                    )}
                    {product.category && (
                      <span style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {product.category}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '600', lineHeight: 1.3 }}>{product.name}</h3>
                      {product.description && (
                        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: primaryColor }}>
                          ₡{Number(product.price).toLocaleString('es-CR')}
                        </div>
                        {hasDiscount && (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            ₡{Number(product.compareAtPrice).toLocaleString('es-CR')}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 1);
                        }}
                        style={{ padding: '8px 12px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '0.8rem' }}
                      >
                        <Plus size={15} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 40, maxWidth: '600px', margin: '0 auto' }}>
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ width: '100%', padding: '14px 20px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}
              </span>
              <span>Ver Pedido</span>
            </div>
            <span>₡{cartSubtotal.toLocaleString('es-CR')}</span>
          </button>
        </div>
      )}

      {/* ==========================================
          PRODUCT DETAIL MODAL
      ========================================== */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <button
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              <X size={18} color="#334155" />
            </button>

            <div style={{ height: '240px', backgroundColor: '#f1f5f9', position: 'relative' }}>
              <img
                src={selectedProduct.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60'}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ padding: '24px' }}>
              {selectedProduct.category && (
                <span style={{ fontSize: '0.75rem', color: primaryColor, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {selectedProduct.category}
                </span>
              )}
              <h2 style={{ margin: '4px 0 10px 0', fontSize: '1.35rem', fontWeight: 'bold' }}>{selectedProduct.name}</h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: primaryColor }}>
                  ₡{Number(selectedProduct.price).toLocaleString('es-CR')}
                </span>
                {selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price && (
                  <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    ₡{Number(selectedProduct.compareAtPrice).toLocaleString('es-CR')}
                  </span>
                )}
              </div>

              {selectedProduct.description && (
                <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-line' }}>
                  {selectedProduct.description}
                </div>
              )}

              {/* Quantity Controls & Add to Cart */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                    style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: 'none', cursor: 'pointer' }}
                  >
                    <Minus size={16} />
                  </button>
                  <span style={{ padding: '8px 14px', fontWeight: 'bold', fontSize: '0.95rem' }}>{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity(q => q + 1)}
                    style={{ padding: '8px 12px', backgroundColor: '#f8fafc', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct, modalQuantity);
                    setSelectedProduct(null);
                  }}
                  style={{ flex: 1, padding: '12px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ShoppingBag size={18} /> Agregar ₡{(Number(selectedProduct.price) * modalQuantity).toLocaleString('es-CR')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SHOPPING CART & CHECKOUT DRAWER
      ========================================== */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)' }}>
            
            {/* Cart Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={22} color={primaryColor} />
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Tu Carrito ({totalItemsCount})</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Cart Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ fontSize: '1rem', margin: 0 }}>Tu carrito está vacío.</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {cart.map(item => (
                      <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <img
                          src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60'}
                          alt={item.product.name}
                          style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
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

                  {/* Delivery Selector */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px' }}>Método de Entrega</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: `2px solid ${deliveryMethod === 'pickup' ? primaryColor : '#cbd5e1'}`,
                          backgroundColor: deliveryMethod === 'pickup' ? `${primaryColor}10` : 'white',
                          color: deliveryMethod === 'pickup' ? primaryColor : '#475569',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Store size={16} /> Retiro en Tienda
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: `2px solid ${deliveryMethod === 'delivery' ? primaryColor : '#cbd5e1'}`,
                          backgroundColor: deliveryMethod === 'delivery' ? `${primaryColor}10` : 'white',
                          color: deliveryMethod === 'delivery' ? primaryColor : '#475569',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Truck size={16} /> Envío ({store.deliveryFee ? `₡${Number(store.deliveryFee).toLocaleString('es-CR')}` : 'Gratis'})
                      </button>
                    </div>
                  </div>

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

                    {deliveryMethod === 'delivery' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Dirección de Entrega Exacta *</label>
                        <textarea
                          rows={2}
                          placeholder="Provincia, cantón, señas exactas..."
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
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
                            <span>🏦 Transferencia Bancaria</span>
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
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Notas del Pedido (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: Tocar el timbre, sin cebolla..."
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
                    <span>Costo de Envío:</span>
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
                  {isSubmitting ? 'Procesando Pedido...' : `Finalizar Pedido • ₡${cartTotal.toLocaleString('es-CR')}`}
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
              ¡Pedido Recibido con Éxito!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
              Tu orden <strong style={{ color: '#1e293b' }}>{orderCompleted.orderCode}</strong> ha sido registrada y enviada a <strong>{orderCompleted.storeName || store.storeName}</strong>.
            </p>

            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e2e8f0' }}>
              <div><strong>Cliente:</strong> {orderCompleted.customerName} ({orderCompleted.customerPhone})</div>
              <div><strong>Total a Pagar:</strong> ₡{Number(orderCompleted.total).toLocaleString('es-CR')}</div>
              <div><strong>Método de Entrega:</strong> {orderCompleted.deliveryMethod === 'delivery' ? 'A Domicilio' : 'Retiro en Tienda'}</div>
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
              style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}
            >
              Cerrar y Volver a la Tienda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
