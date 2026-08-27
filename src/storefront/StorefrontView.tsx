import React, { useState, useEffect } from 'react';
import { ShoppingCart, Phone, Search, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function StorefrontView({ slug }: { slug: string }) {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'whatsapp' | 'sinpe' | null>(null);

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  const fetchStoreData = async () => {
    try {
      const storeRes = await fetch(`/api/storefront/${slug}`);
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);
      }

      const prodRes = await fetch(`/api/storefront/${slug}/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // add shipping later

  const handleCheckoutWhatsApp = () => {
    if(!store?.whatsappNumber) return;
    let msg = `Hola, me gustaría hacer un pedido en ${store.name}:\n\n`;
    cart.forEach(item => {
      msg += `- ${item.quantity}x ${item.name} ($${item.price})\n`;
    });
    msg += `\nTotal: $${total}`;
    
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${store.whatsappNumber}?text=${encoded}`, '_blank');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando tienda...</div>;
  if (!store) return <div style={{ textAlign: 'center', padding: '50px' }}>Tienda no encontrada</div>;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {store.logoUrl ? (
              <img src={store.logoUrl} alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {store.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{store.name}</h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{store.description}</p>
            </div>
          </div>
          <button 
            onClick={() => setCartOpen(true)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '10px' }}
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Products */}
      <main style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {products.map(product => (
            <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', backgroundColor: '#e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#9ca3af' }}>Sin Imagen</span>
                )}
              </div>
              <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{product.name}</h3>
                <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '0.9rem', flex: 1 }}>{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>${product.price}</span>
                  <button 
                    onClick={() => addToCart(product)}
                    style={{ padding: '8px 15px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '30px 20px', color: '#9ca3af', fontSize: '0.85rem', borderTop: '1px solid #f3f4f6', marginTop: '40px' }}>
        <p style={{ margin: 0 }}>⚡ Potenciado por <strong>Betico</strong> &middot; Asistente Virtual & Tienda WhatsApp</p>
      </footer>


      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', backgroundColor: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Tu Pedido</h2>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Tu carrito está vacío.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{item.quantity} x ${item.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>${item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span>${total}</span>
              </div>
              
              <button 
                onClick={handleCheckoutWhatsApp}
                style={{ width: '100%', padding: '15px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
              >
                <Phone size={20} /> Pedir por WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
