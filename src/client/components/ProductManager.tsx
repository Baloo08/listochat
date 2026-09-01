import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Edit, Trash2, Plus, Image as ImageIcon, Sparkles, FileSpreadsheet, 
  Upload, Download, Search, Check, AlertCircle, X, Palette, Sliders, Layers, Tag
} from 'lucide-react';
import { CustomVariable, CustomVariableOption } from '../../shared/types';

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
  weightGrams?: number;
  customVariables?: CustomVariable[];
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
    images: [] as string[],
    customVariables: [] as CustomVariable[]
  });

  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; total: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const api = useApi();

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/products/template', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al generar plantilla');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_productos_betico.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Error al descargar plantilla: ' + (err.message || 'Error'));
    }
  };

  const handleBulkUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploading(true);
    setBulkResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el archivo Excel');
      }

      setBulkResult({
        count: data.createdCount || 0,
        total: data.totalRows || 0,
        errors: data.errors || []
      });

      loadProducts();
    } catch (err: any) {
      alert('Error en la carga masiva: ' + (err.message || 'Verifique el archivo'));
    } finally {
      setBulkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      images: [],
      customVariables: []
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
      images: (product.images || []).map(img => img.url),
      customVariables: product.customVariables || []
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

  // Variable Helpers
  const addVariableGroup = () => {
    const newGroup: CustomVariable = {
      id: 'var_' + Date.now(),
      name: 'Nueva Variable (Ej: Talla, Color)',
      type: 'select',
      required: false,
      options: [
        { id: 'opt_1', name: 'Opción 1', priceDelta: 0 }
      ]
    };
    setFormData(prev => ({
      ...prev,
      customVariables: [...prev.customVariables, newGroup]
    }));
  };

  const updateVariableGroup = (index: number, updates: Partial<CustomVariable>) => {
    setFormData(prev => {
      const copy = [...prev.customVariables];
      copy[index] = { ...copy[index], ...updates };
      return { ...prev, customVariables: copy };
    });
  };

  const removeVariableGroup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customVariables: prev.customVariables.filter((_, i) => i !== index)
    }));
  };

  const addOptionToGroup = (groupIndex: number) => {
    setFormData(prev => {
      const copy = [...prev.customVariables];
      const group = copy[groupIndex];
      const isColor = group.type === 'color';
      const newOption: CustomVariableOption = {
        id: 'opt_' + Date.now(),
        name: isColor ? 'Color' : 'Nueva Opción',
        priceDelta: 0,
        colorHex: isColor ? '#3b82f6' : undefined
      };
      group.options = [...group.options, newOption];
      return { ...prev, customVariables: copy };
    });
  };

  const updateOptionInGroup = (groupIndex: number, optionIndex: number, updates: Partial<CustomVariableOption>) => {
    setFormData(prev => {
      const copy = [...prev.customVariables];
      const group = copy[groupIndex];
      group.options[optionIndex] = { ...group.options[optionIndex], ...updates };
      return { ...prev, customVariables: copy };
    });
  };

  const removeOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setFormData(prev => {
      const copy = [...prev.customVariables];
      copy[groupIndex].options = copy[groupIndex].options.filter((_, i) => i !== optionIndex);
      return { ...prev, customVariables: copy };
    });
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
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
        category: formData.category,
        sku: formData.sku,
        stock: Number(formData.stock),
        weightGrams: Number(formData.weightGrams || 250),
        active: formData.active,
        featured: formData.featured,
        images: formData.images.map((url, idx) => ({ url, sortOrder: idx, isPrimary: idx === 0 })),
        customVariables: formData.customVariables
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      alert('Error guardando producto: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) {
      try {
        await api.del(`/api/products/${id}`);
        loadProducts();
      } catch (err) {
        alert('Error eliminando producto');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>Catálogo de Productos</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestiona los productos, tallas, colores, precios y stock de tu catálogo</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleDownloadTemplate}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '9px 14px', backgroundColor: 'var(--surface)', color: 'var(--text)', 
              border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' 
            }}
            title="Descargar plantilla Excel oficial para llenar productos"
          >
            <Download size={16} /> Descargar Plantilla Excel
          </button>

          <button 
            onClick={() => { setShowBulkModal(true); setBulkResult(null); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '9px 14px', backgroundColor: '#0284c7', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' 
            }}
            title="Importar productos masivamente desde Excel"
          >
            <FileSpreadsheet size={16} /> Carga Masiva Excel
          </button>

          <button 
            onClick={handleOpenCreate}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '9px 16px', backgroundColor: 'var(--primary)', color: 'white', 
              border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' 
            }}
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

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
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>VARIABLES</th>
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
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Crea tu primer producto con el botón "Nuevo Producto".</p>
                </td>
              </tr>
            ) : (
              products.map(product => {
                const primaryImage = product.images && product.images.length > 0 ? product.images[0].url : null;
                const varCount = (product.customVariables || []).length;
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
                      {varCount > 0 ? (
                        <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: '600' }}>
                          {varCount} variable{varCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin variables</span>
                      )}
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(product)}
                          style={{
                            padding: '5px 10px', backgroundColor: '#ecfdf5', color: '#047857',
                            border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', fontWeight: '700'
                          }}
                          title="Duplicar este producto para crear uno nuevo similar"
                        >
                          <Copy size={13} /> Duplicar
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          style={{ padding: '5px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}
                          title="Editar producto"
                        >
                          <Edit size={13} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
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

      {/* Modal Crear / Editar */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
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
                  placeholder="Ej: Camisa Polo Slim Fit, Hamburguesa Doble, etc." 
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
                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Sparkles size={14} /> {generatingAi ? 'Generando con IA...' : 'Generar con IA'}
                  </button>
                </div>
                <textarea 
                  rows={3} 
                  placeholder="Describe los detalles, ingredientes o características del producto..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Prices & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio Base (CRC) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="15000" 
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Precio Comparación (Tachado)</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 18000" 
                    value={formData.compareAtPrice}
                    onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Categoría</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Ropa, Comidas, Bebidas" 
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

              {/* ==============================================================
                  CUSTOM VARIABLES & MODIFIERS (Tallas, Colores, Extras)
              ============================================================== */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders size={16} color="var(--primary)" /> Variables & Modificadores Personalizados
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Permite que tus clientes elijan tallas, colores con selector visual, materiales o extras que modifiquen el precio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariableGroup}
                    style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Agregar Variable
                  </button>
                </div>

                {formData.customVariables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Este producto no tiene variables. Haz clic en "Agregar Variable" para configurar tallas, colores, etc.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {formData.customVariables.map((group, gIdx) => (
                      <div key={group.id || gIdx} style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                        
                        {/* Group Header */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Nombre (ej: Color, Talla, Extra)"
                            value={group.name}
                            onChange={(e) => updateVariableGroup(gIdx, { name: e.target.value })}
                            style={{ flex: 1, minWidth: '160px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 'bold' }}
                          />

                          <select
                            value={group.type}
                            onChange={(e) => updateVariableGroup(gIdx, { type: e.target.value as any })}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: 'white' }}
                          >
                            <option value="select">Selección Única (Talla / Opción)</option>
                            <option value="color">Círculo Cromático / Color (HEX)</option>
                            <option value="checkbox">Múltiple Selección / Extras</option>
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => updateVariableGroup(gIdx, { required: e.target.checked })}
                            />
                            <span>Obligatorio</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeVariableGroup(gIdx)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Eliminar grupo de variable"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Options List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                          {group.options.map((opt, oIdx) => (
                            <div key={opt.id || oIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              
                              {/* If color picker */}
                              {group.type === 'color' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="color"
                                    value={opt.colorHex || '#3b82f6'}
                                    onChange={(e) => updateOptionInGroup(gIdx, oIdx, { colorHex: e.target.value })}
                                    style={{ width: '32px', height: '32px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '50%', cursor: 'pointer' }}
                                    title="Seleccionar color en el círculo cromático"
                                  />
                                  <input
                                    type="text"
                                    placeholder="#000000"
                                    value={opt.colorHex || '#3b82f6'}
                                    onChange={(e) => updateOptionInGroup(gIdx, oIdx, { colorHex: e.target.value })}
                                    style={{ width: '75px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontFamily: 'monospace' }}
                                  />
                                </div>
                              )}

                              <input
                                type="text"
                                placeholder={group.type === 'color' ? 'Nombre del color (ej: Azul Rey)' : 'Nombre de la opción (ej: Talla M)'}
                                value={opt.name}
                                onChange={(e) => updateOptionInGroup(gIdx, oIdx, { name: e.target.value })}
                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                              />

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₡+/-</span>
                                <input
                                  type="number"
                                  placeholder="+/- Precio (0)"
                                  value={opt.priceDelta || ''}
                                  onChange={(e) => updateOptionInGroup(gIdx, oIdx, { priceDelta: Number(e.target.value) })}
                                  style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeOptionFromGroup(gIdx, oIdx)}
                                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addOptionToGroup(gIdx)}
                            style={{ alignSelf: 'flex-start', border: 'none', background: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                          >
                            <Plus size={13} /> Agregar Opción a {group.name || 'Variable'}
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
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
                  <span>Visible en el catálogo</span>
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

      {/* Modal Carga Masiva Excel */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '560px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={22} color="#0284c7" />
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Carga Masiva de Productos</h2>
              </div>
              <button onClick={() => { setShowBulkModal(false); setBulkResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sube un archivo de Excel (<code>.xlsx</code> o <code>.xls</code>) con tus productos para agregarlos automáticamente a tu catálogo.
            </p>

            {/* Template Download Prompt */}
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                <strong>¿No tienes la plantilla oficial?</strong><br />
                Descárgala con ejemplos listos para rellenar.
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={15} /> Descargar Plantilla
              </button>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => !bulkUploading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: bulkUploading ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--background)',
                marginBottom: '16px'
              }}
            >
              <Upload size={32} color="#0284c7" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                {bulkUploading ? '⏳ Procesando archivo Excel...' : 'Haz clic para seleccionar tu archivo Excel'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Formatos aceptados: .xlsx, .xls
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleBulkUploadFile}
                disabled={bulkUploading}
                style={{ display: 'none' }}
              />
            </div>

            {/* Results breakdown */}
            {bulkResult && (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '8px', border: `1px solid ${bulkResult.errors.length > 0 ? '#fde68a' : '#bbf7d0'}`, backgroundColor: bulkResult.errors.length > 0 ? '#fffbeb' : '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: bulkResult.errors.length > 0 ? '#92400e' : '#166534', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <Check size={18} /> ¡Importación finalizada!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  Se crearon <strong>{bulkResult.count}</strong> de <strong>{bulkResult.total}</strong> productos encontrados.
                </div>

                {bulkResult.errors.length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid #fde68a', paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b45309', marginBottom: '4px' }}>Advertencias o filas ignoradas:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#b45309' }}>
                      {bulkResult.errors.map((err, idx) => (
                        <li key={idx}>{err.error || err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
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
