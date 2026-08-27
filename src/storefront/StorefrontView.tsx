import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, Plus, Minus, Trash2, Check, ArrowRight, Search, X, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

interface StorefrontProps {
  slug: string;
}

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  images?: ProductImage[];
  stock?: number;
  active?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function StorefrontView({ slug }: StorefrontProps) {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'transfer' | 'cash'>('sinpe');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<any>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const [storeRes, productsRes] = await Promise.all([
          fetch(`/api/storefront/${slug}`),
          fetch(`/api/storefront/${slug}/products`)
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
          if (storeData.deliveryEnabled === false) {
            setDeliveryMethod('pickup');
          }
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      } catch (err) {
        console.error('Error fetching storefront:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [slug]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = (deliveryMethod === 'delivery' && store?.deliveryEnabled) ? parseFloat(store.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Por favor ingresa tu nombre y número de teléfono.');
      return;
    }
    if (deliveryMethod === 'delivery' && !customerAddress) {
      alert('Por favor ingresa tu dirección de entrega.');
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. Post order to backend
      const payload = {
        customerName,
        customerPhone,
        customerAddress: deliveryMethod === 'delivery' ? customerAddress : 'Retiro en Local',
        deliveryMethod,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity
        })),
        subtotal,
        deliveryFee,
        total
      };

      const res = await fetch(`/api/storefront/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let orderNumber = 'NUEVA';
      if (res.ok) {
        const orderData = await res.json();
        orderNumber = orderData.orderNumber || orderData.id?.slice(0, 6);
        setOrderCompleted(orderData);
      }

      // 2. Build WhatsApp message and open link
      let msg = `🛍️ *¡NUEVO PEDIDO DESDE LA TIENDA VIRTUAL!* (Orden #${orderNumber})\n\n`;
      msg += `👤 *Cliente:* ${customerName}\n`;
      msg += `📞 *Teléfono:* ${customerPhone}\n`;
      msg += `🚚 *Método:* ${deliveryMethod === 'delivery' ? 'Express / Entrega a Domicilio' : 'Retiro en Local'}\n`;
      if (deliveryMethod === 'delivery') {
        msg += `📍 *Dirección:* ${customerAddress}\n`;
      }
      msg += `💳 *Método de Pago:* ${paymentMethod.toUpperCase()}\n\n`;
      msg += `📦 *Detalle del Pedido:*\n`;
      cart.forEach(item => {
        msg += `  • ${item.quantity}x ${item.product.name} - ₡${(item.product.price * item.quantity).toLocaleString()}\n`;
      });
      if (deliveryFee > 0) {
        msg += `  • Envío Express: ₡${deliveryFee.toLocaleString()}\n`;
      }
      msg += `\n💰 *TOTAL A PAGAR:* ₡${total.toLocaleString()}\n`;

      if (paymentMethod === 'sinpe' && store?.sinpePhone) {
        msg += `\n📱 *Pago por SINPE Móvil al:* ${store.sinpePhone} (${store.sinpeName || 'Negocio'})\n(Adjunto comprobante a continuación)`;
      }

      const whatsappTarget = (store?.whatsappNumber || '50688888888').replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${whatsappTarget}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      // Clear cart
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      alert('Error procesando orden. Por favor intenta de nuevo.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Cargando tienda virtual...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '10px' }}>Tienda no encontrada</h2>
        <p style={{ color: '#64748b' }}>La tienda virtual que buscas no existe o está temporalmente inactiva.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a' }}>
      {/* Header Banner */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {store.storeLogoUrl ? (
              <img src={store.storeLogoUrl} alt={store.storeName} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', backgroundColor: '#2563eb', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.3rem' }}>
                {store.storeName?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{store.storeName}</h1>
              {store.storeDescription && (
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{store.storeDescription}</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            style={{ position: 'relative', padding: '10px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
          >
            <ShoppingBag size={18} />
            <span>Ver Carrito</span>
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '25px 20px 80px 20px' }}>
        {/* Search & Category Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar productos en la tienda..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            />
            <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          </div>

          {/* Categories Horizontal Scroll */}
          {categories.length > 2 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    backgroundColor: selectedCategory === cat ? '#2563eb' : '#e2e8f0',
                    color: selectedCategory === cat ? 'white' : '#475569'
                  }}
                >
                  {cat === 'all' ? '✨ Todos los productos' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748b', margin: '0 0 10px 0' }}>No encontramos productos que coincidan con tu búsqueda.</p>
            <button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(product => {
              const image = product.images && product.images.length > 0 ? product.images[0].url : null;
              return (
                <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
                  {/* Product Image */}
                  <div style={{ width: '100%', height: '180px', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                    {image ? (
                      <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <ShoppingBag size={40} />
                      </div>
                    )}
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        OFERTA
                      </div>
                    )}
                  </div>

                  {/* Product Body */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {product.category && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {product.category}
                      </span>
                    )}
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>{product.name}</h3>
                    {product.description && (
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description}
                      </p>
                    )}

                    {/* Price and Add button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <div>
                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                          ₡{product.price.toLocaleString()}
                        </span>
                        {product.compareAtPrice && (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                            ₡{product.compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => addToCart(product)}
                        style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '0.85rem' }}
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '460px', height: '100%', backgroundColor: 'white', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            {/* Cart Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Tu Carrito ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
            </div>

            {/* Cart Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <ShoppingBag size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>Tu carrito está vacío</p>
                  <p style={{ fontSize: '0.85rem' }}>Selecciona productos de la tienda para agregarlos.</p>
                </div>
              ) : (
                <form onSubmit={handleCheckout} id="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Cart Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map(item => (
                      <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '600' }}>₡{(item.product.price * item.quantity).toLocaleString()}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button type="button" onClick={() => updateQuantity(item.product.id, -1)} style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product.id, 1)} style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={14} />
                          </button>
                          <button type="button" onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '6px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Information */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Datos de Entrega</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="Tu Nombre Completo *"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <input 
                        type="tel" 
                        required
                        placeholder="Tu WhatsApp / Teléfono *"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />

                      {/* Delivery or Pickup */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                        {store.deliveryEnabled && (
                          <button 
                            type="button"
                            onClick={() => setDeliveryMethod('delivery')}
                            style={{ padding: '8px', borderRadius: '6px', border: deliveryMethod === 'delivery' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: deliveryMethod === 'delivery' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                          >
                            🚚 Envío Express
                          </button>
                        )}
                        {store.pickupEnabled && (
                          <button 
                            type="button"
                            onClick={() => setDeliveryMethod('pickup')}
                            style={{ padding: '8px', borderRadius: '6px', border: deliveryMethod === 'pickup' ? '2px solid #2563eb' : '1px solid #cbd5e1', backgroundColor: deliveryMethod === 'pickup' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                          >
                            🏪 Retiro en Local
                          </button>
                        )}
                      </div>

                      {deliveryMethod === 'delivery' && (
                        <textarea 
                          rows={2}
                          required
                          placeholder="Dirección exacta de entrega (señas, cantón, etc.) *"
                          value={customerAddress}
                          onChange={e => setCustomerAddress(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Método de Pago</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {store.acceptSinpe && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: paymentMethod === 'sinpe' ? '2px solid #16a34a' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'sinpe' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input type="radio" name="payment" checked={paymentMethod === 'sinpe'} onChange={() => setPaymentMethod('sinpe')} />
                          <strong>SINPE Móvil</strong> {store.sinpePhone ? `(${store.sinpePhone})` : ''}
                        </label>
                      )}
                      {store.acceptTransfer && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: paymentMethod === 'transfer' ? '2px solid #2563eb' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'transfer' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
                          <span>Transferencia Bancaria</span>
                        </label>
                      )}
                      {store.acceptCashOnDelivery && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', border: paymentMethod === 'cash' ? '2px solid #ea580c' : '1px solid #e2e8f0', backgroundColor: paymentMethod === 'cash' ? '#fff7ed' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                          <span>Efectivo contra entrega</span>
                        </label>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', color: '#64748b' }}>
                  <span>Subtotal:</span>
                  <span>₡{subtotal.toLocaleString()}</span>
                </div>
                {deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', color: '#64748b' }}>
                    <span>Envío Express:</span>
                    <span>₡{deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', color: '#0f172a' }}>
                  <span>Total a Pagar:</span>
                  <span>₡{total.toLocaleString()}</span>
                </div>

                <button 
                  type="submit"
                  form="checkout-form"
                  disabled={submittingOrder}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}
                >
                  <Phone size={18} /> {submittingOrder ? 'Procesando pedido...' : 'Realizar Pedido por WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        ⚡ Potenciado por <strong>Betico</strong> · Asistente Virtual & Tienda WhatsApp
      </footer>
    </div>
  );
}
