import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, uploadGarmentPhoto, deleteGarmentPhoto } from '../supabaseClient';
import { getOptimizedImageUrl, FALLBACK_GARMENT_IMAGES } from '../utils/imageOptimizer';
import confetti from 'canvas-confetti';

export default function ProductManagement({ products = [], onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Linen Shirts',
    price: '',
    stock: 25,
    image: '',
    badge: 'Italian Luxury',
    description: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Pure White', hex: '#FFFFFF', stock: 10 },
      { name: 'Obsidian Black', hex: '#111111', stock: 15 }
    ],
    is_active: true
  });

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      category: 'Linen Shirts',
      price: '',
      stock: 20,
      image: '',
      badge: 'Italian Luxury',
      description: 'Crafted from 100% Normandy flax linen. Features bespoke mother-of-pearl buttons and tailored French seams.',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Pure Ivory', hex: '#fdfbf7', stock: 10 },
        { name: 'Sardinia Navy', hex: '#1a2942', stock: 10 }
      ],
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      category: product.category || 'Linen Shirts',
      price: product.price || '',
      stock: product.stock ?? 0,
      image: product.image || '',
      badge: product.badge || '',
      description: product.description || '',
      sizes: Array.isArray(product.sizes) ? product.sizes : ['S', 'M', 'L', 'XL'],
      colors: Array.isArray(product.colors) ? product.colors : [],
      is_active: product.is_active ?? true
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ type: '', text: '' });
    setUploadingImage(true);

    try {
      const publicUrl = await uploadGarmentPhoto(file);
      setFormData((prev) => ({ ...prev, image: publicUrl }));
      setStatusMessage({ type: 'success', text: "Garment photo uploaded successfully to 'garment-photos' bucket!" });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Image upload failed. You can paste an image URL directly.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleSize = (sz) => {
    setFormData((prev) => {
      const current = prev.sizes || [];
      const updated = current.includes(sz) ? current.filter(s => s !== sz) : [...current, sz];
      return { ...prev, sizes: updated };
    });
  };

  const handleColorChange = (index, field, value) => {
    const updated = [...formData.colors];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate total stock from colors if defined
    const newTotalStock = updated.reduce((sum, c) => sum + Number(c.stock || 0), 0);
    setFormData(prev => ({ ...prev, colors: updated, stock: newTotalStock > 0 ? newTotalStock : prev.stock }));
  };

  const handleAddColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: 'Sage Green', hex: '#7c8e76', stock: 5 }]
    }));
  };

  const handleRemoveColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      setStatusMessage({ type: 'error', text: 'Title and price are required.' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: '', text: '' });

    try {
      // Default to luxury curated linen fallback if no photo was uploaded or pasted
      const finalImage = formData.image?.trim() || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600';

      // Ensure all color variants have the product image and views set
      const formattedColors = (formData.colors || []).map(c => {
        const colorImg = c.image || finalImage;
        return {
          ...c,
          name: c.name || 'Default',
          code: c.hex || c.code || '#FFFFFF',
          hex: c.hex || c.code || '#FFFFFF',
          stock: Number(c.stock !== undefined ? c.stock : 10),
          image: colorImg,
          views: c.views && c.views.length > 0 ? c.views : [
            { name: "Front View", url: colorImg },
            { name: "Back Side", url: colorImg },
            { name: "Left Side View", url: colorImg },
            { name: "Button View", url: colorImg },
            { name: "Right Side View", url: colorImg }
          ]
        };
      });

      const payload = {
        title: formData.title.trim(),
        category: formData.category || 'Linen Shirts',
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        image: finalImage,
        badge: formData.badge?.trim() || null,
        description: formData.description?.trim() || '',
        sizes: formData.sizes && formData.sizes.length > 0 ? formData.sizes : ['S', 'M', 'L', 'XL'],
        colors: formattedColors,
        is_active: formData.is_active ?? true
      };

      if (editingProduct) {
        // If image was replaced with a new one, remove the previous photo from Supabase storage
        if (editingProduct.image && editingProduct.image !== payload.image) {
          await deleteGarmentPhoto(editingProduct.image);
        }

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to persist product to database.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you certain you wish to archive/delete "${product.title}" from the live catalog?`)) {
      return;
    }

    try {
      // 1. Delete image from Supabase Storage bucket 'garment-photos' so no orphan files remain
      if (product.image) {
        await deleteGarmentPhoto(product.image);
      }

      // 2. Delete product row from database
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);
      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Status toggle error: ${err.message}`);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
                          p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter and Action Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search garments by name or weave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="luxury-input"
              style={{ paddingLeft: '38px', height: '40px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="luxury-select"
            style={{ width: '160px', height: '40px' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button onClick={handleOpenAdd} className="gold-btn" style={{ height: '40px' }}>
          <Plus size={16} />
          <span>Add New Garment</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>PRODUCT</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>PRICE</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>STOCK</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>SIZES / VARIANTS</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No garments found matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.2s',
                    opacity: p.is_active ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={getOptimizedImageUrl(p.image, 400)}
                        alt={p.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_GARMENT_IMAGES[p.id] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400';
                        }}
                        style={{
                          width: '48px',
                          height: '56px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)',
                          background: '#1a1e28'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                          {p.title}
                        </div>
                        {p.badge && (
                          <span className="badge badge-gold" style={{ fontSize: '9px', marginTop: '3px' }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    {p.category}
                  </td>

                  <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span className={`badge ${p.stock <= 5 ? 'badge-danger' : 'badge-gold'}`}>
                      {p.stock} units
                    </span>
                  </td>

                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
                      {Array.isArray(p.sizes) && p.sizes.map((sz) => (
                        <span key={sz} style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.05)',
                          fontSize: '11px',
                          color: 'var(--text-secondary)'
                        }}>
                          {sz}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td style={{ padding: '14px' }}>
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click to toggle active visibility in storefront"
                    >
                      {p.is_active ? 'Live Storefront' : 'Archived / Hidden'}
                    </button>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="secondary-btn"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Edit product"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="danger-btn"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#12151c',
            border: '1px solid var(--border-gold)',
            borderRadius: '18px',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingProduct ? 'Edit Haute Couture Garment' : 'Introduce New Garment to Catalog'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Persists directly to public.products in Supabase.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {statusMessage.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: statusMessage.type === 'error' ? '#f87171' : '#34d399',
                border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  GARMENT TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sardinia Riviera French-Linen Shirt"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="luxury-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="luxury-select"
                  >
                    <option value="Linen Shirts">Linen Shirts</option>
                    <option value="Tuxedos & Suits">Tuxedos & Suits</option>
                    <option value="Trousers">Trousers</option>
                    <option value="Blazers">Blazers</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    PRICE (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="4990"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="luxury-input"
                  />
                </div>
              </div>

              {/* Garment Image Upload to Supabase Storage 'garment-photos' */}
              <div style={{
                border: '1px dashed var(--border-gold)',
                borderRadius: '12px',
                padding: '16px',
                background: 'rgba(212, 175, 55, 0.03)'
              }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '8px' }}>
                  SUPABASE DIRECT IMAGE STORAGE (garment-photos) *
                </label>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Garment Preview"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-gold)',
                        background: '#0a0c10'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <ImageIcon size={28} />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <label className="secondary-btn" style={{ cursor: uploadingImage ? 'wait' : 'pointer', fontSize: '12px' }}>
                        <Upload size={14} />
                        <span>{uploadingImage ? 'Uploading to Supabase...' : 'Select File to Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste public Image CDN URL directly..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="luxury-input"
                      style={{ fontSize: '12px', height: '34px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Badges & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    LUXURY BADGE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Italian Luxury, Bestseller"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="luxury-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    OVERALL STOCK COUNT
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="luxury-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  BESPOKE CRAFTSMANSHIP DESCRIPTION
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="luxury-textarea"
                  placeholder="Detail the fabric origin, weave, drape, and care instructions..."
                />
              </div>

              {/* Sizes Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  AVAILABLE COUTURE SIZES
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {availableSizes.map((sz) => {
                    const isSelected = formData.sizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        style={{
                          width: '42px',
                          height: '36px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.03)',
                          color: isSelected ? 'var(--text-gold)' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Variants with Individual Stock */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    COLOR VARIANTS & SPECIFIC INVENTORY
                  </label>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-gold)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Add Variant
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.colors.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={c.hex || '#000000'}
                        onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                        style={{ width: '38px', height: '36px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Monaco Navy)"
                        value={c.name}
                        onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                        className="luxury-input"
                        style={{ flex: 2, height: '36px' }}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={c.stock}
                        onChange={(e) => handleColorChange(idx, 'stock', Number(e.target.value))}
                        className="luxury-input"
                        style={{ flex: 1, height: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="gold-btn"
                >
                  {saving ? 'Writing to Supabase...' : (editingProduct ? 'Save Modifications' : 'Create Garment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
