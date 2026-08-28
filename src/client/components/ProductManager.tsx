import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { Edit, Trash2, Plus, Image as ImageIcon, Sparkles, FileSpreadsheet, Upload, Download, Search, Check, AlertCircle, X } from 'lucide-react';

interface ProductImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  sku?: string;
  stock: number;
  trackStock: boolean;
  featured: boolean;
  active: boolean;
  currency: string;
  images: ProductImage[];
  createdAt: string;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    sku: '',
    stock: '10',
    weightGrams: '250',
    active: true,
    featured: false,
    images: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; total: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const api = useApi();

  const loadProducts = async () => {
    try {
      setLoading(true);
      let url = '/api/products';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const data = await api.get(url);
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      category: categories[0] || 'General',
      sku: '',
      stock: '10',
      weightGrams: '250',
      active: true,
      featured: false,
      images: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      category: product.category || '',
      sku: product.sku || '',
      stock: String(product.stock),
      weightGrams: String(product.weightGrams || 250),
      active: product.active !== false,
      featured: product.featured || false,
      images: (product.images || []).map(img => img.url)
    });
    setShowModal(true);
  };

  const handleGenerateAiDescription = async () => {
    if (!formData.name.trim()) {
      alert('Ingresa el nombre del producto primero para que la IA genere la descripción.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await api.post('/api/products/generate-description', {
        name: formData.name,
        category: formData.category,
        keywords: aiKeywords
      });
      if (res && res.description) {
        setFormData(prev => ({ ...prev, description: res.description }));
      }
    } catch (err: any) {
      alert('Error generando descripción con IA: ' + (err.message || 'Intente de nuevo'));
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const form = new FormData();
    form.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await res.json();
      if (data && data.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, data.url] }));
      }
    } catch (err) {
      alert('Error al subir imagen');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        category: formData.category,
        sku: formData.sku,
        stock: parseInt(formData.stock, 10) || 0,
        weightGrams: parseInt(formData.weightGrams, 10) || 250,
        active: formData.active,
        featured: formData.featured,
        images: formData.images
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      setShowModal(false);
      await loadProducts();
    } catch (err: any) {
      alert('Error guardando producto: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`¿Eliminar el producto "${name}"?`)) {
      try {
        await api.del(`/api/products/${id}`);
        await loadProducts();
      } catch (err) {
        alert('Error al eliminar producto');
      }
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/products/template';
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const form = new FormData();
    form.append('file', file);

    setBulkUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await res.json();
      if (data.success) {
        setBulkResult({
          count: data.createdCount,
          total: data.totalRows,
          errors: data.errors || []
        });
        await loadProducts();
      } else {
        alert('Error importando productos: ' + (data.error || 'Verifique el archivo'));
      }
    } catch (err) {
      alert('Error en la carga masiva');
    } finally {
      setBulkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Catálogo de Productos</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los productos, precios, inventario y descripciones de tu tienda virtual</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleDownloadTemplate}
            style={{ 
              padding: '9px 14px', 
              backgroundColor: 'white', 
              color: '#0f766e', 
              border: '1px solid #0f766e', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} /> Plantilla Excel
          </button>

          <label 
            style={{ 
              padding: '9px 14px', 
              backgroundColor: '#0f766e', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Upload size={16} /> {bulkUploading ? 'Importando...' : 'Cargar Excel'}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".xlsx, .xls" 
              onChange={handleBulkUpload} 
              style={{ display: 'none' }} 
              disabled={bulkUploading}
            />
          </label>

          <button 
            onClick={handleOpenCreate}
            style={{ 
              padding: '9px 16px', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Bulk result notification */}
      {bulkResult && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: '600', color: '#166534' }}>¡Carga masiva completada! </span>
            <span style={{ color: '#15803d' }}>Se importaron {bulkResult.count} de {bulkResult.total} productos con éxito.</span>
            {bulkResult.errors.length > 0 && (
              <span style={{ color: '#b91c1c', marginLeft: '10px' }}>({bulkResult.errors.length} filas con error)</span>
            )}
          </div>
          <button onClick={() => setBulkResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}><X size={18} /></button>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '250px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o descripción..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--border)', borderRadius: '6px' }}
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        </form>

        <select 
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'white', minWidth: '160px' }}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', width: '60px' }}>IMAGEN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NOMBRE</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CATEGORÍA</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PRECIO (CRC)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STOCK</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ESTADO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando catálogo de productos...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '500' }}>No tienes productos registrados todavía.</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Puedes crear tu primer producto con el botón "Nuevo Producto" o importar un Excel completo.</p>
                </td>
              </tr>
            ) : (
              products.map(product => {
                const primaryImage = product.images && product.images.length > 0 ? product.images[0].url : null;
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '45px', height: '45px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {primaryImage ? (
                          <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon size={20} color="var(--text-muted)" />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{product.name}</div>
                      {product.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {product.category || 'General'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      ₡{product.price.toLocaleString()}
                      {product.compareAtPrice && (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                          ₡{product.compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: product.stock > 0 ? 'inherit' : '#dc2626', fontWeight: product.stock <= 5 ? 'bold' : 'normal' }}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: product.active !== false ? '#dcfce7' : '#fee2e2', 
                        color: product.active !== false ? '#166534' : '#991b1b', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {product.active !== false ? 'Activo' : 'Oculto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenEdit(product)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '10px' }}
                        title="Editar producto"
                      >
                        <Edit size={17} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingProduct ? `Editar: ${editingProduct.name}` : 'Crear Nuevo Producto'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Producto *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Hamburguesa Doble Queso, Lavado Premium, etc." 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                />
              </div>

              {/* Description + AI Generator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Descripción del Producto</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateAiDescription}
                    disabled={generatingAi}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      background: 'none', 
                      border: '1px solid #8b5cf6', 
                      color: '#7c3aed', 
                      borderRadius: '4px', 
                      padding: '3px 8px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      cursor: 'pointer' 
                    }}
                  >
                    <Sparkles size={14} color="#7c3aed" /> {generatingAi ? 'Generando con IA...' : '✨ Generar con IA'}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  placeholder="Describe los ingredientes, materiales, beneficios o detalles de este producto..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              {/* Prices and Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio (₡ CRC) *</label>
                  <input 
                    type="number" 
                    required
                    step="any"
                    placeholder="Ej: 4500" 
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio Anterior (Tachado)</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Ej: 5500" 
                    value={formData.compareAtPrice}
                    onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Categoría</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Comidas, Bebidas, Ropa" 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Stock, SKU, and Weight in Grams */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Inventario (Stock)</label>
                  <input 
                    type="number" 
                    placeholder="Cantidad disponible" 
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Código SKU</label>
                  <input 
                    type="text" 
                    placeholder="Ej: PRD-001" 
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Peso en Gramos (g)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="Ej: 350" 
                    value={formData.weightGrams}
                    onChange={e => setFormData({ ...formData, weightGrams: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Para Correos de CR</span>
                </div>
              </div>

              {/* Images */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Imágenes del Producto</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {formData.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={img} alt="Product preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label style={{ width: '60px', height: '60px', borderRadius: '6px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    <Plus size={16} />
                    <span>Subir</span>
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.active} 
                    onChange={e => setFormData({ ...formData, active: e.target.checked })} 
                  />
                  <span>Visible en la tienda virtual</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.featured} 
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })} 
                  />
                  <span>Destacar en portada</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 16px', border: '1px solid var(--border)', background: 'white', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {saving ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
