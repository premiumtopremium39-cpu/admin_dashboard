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
  Image as ImageIcon,
  Camera,
  ChevronDown,
  ChevronUp,
  Ruler,
  Sliders
} from 'lucide-react';
import { supabase, uploadGarmentPhoto, deleteGarmentPhoto } from '../supabaseClient';
import { getOptimizedImageUrl, FALLBACK_GARMENT_IMAGES } from '../utils/imageOptimizer';
import confetti from 'canvas-confetti';

const DEFAULT_PRODUCT_SIZE_GUIDE = {
  title: 'Garment Sizing Matrix',
  subtitle: 'Measurements in inches. Tailored to luxury drape & fit.',
  rows: [
    { size: 'S', chest: '38" - 40"', shoulder: '17.5"', sleeve: '33.5"', length: '29.0"' },
    { size: 'M', chest: '41" - 43"', shoulder: '18.2"', sleeve: '34.5"', length: '29.5"' },
    { size: 'L', chest: '44" - 46"', shoulder: '19.0"', sleeve: '35.5"', length: '30.2"' },
    { size: 'XL', chest: '47" - 49"', shoulder: '19.8"', sleeve: '36.5"', length: '31.0"' }
  ],
  fitNote: 'Fits true to tailored silhouette. For a looser resort fit, select one size up.'
};

export default function ProductManagement({ products = [], onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingColorKey, setUploadingColorKey] = useState(null);
  const [uploadingAngleKey, setUploadingAngleKey] = useState(null);
  const [uploadingMainAngleKey, setUploadingMainAngleKey] = useState(null);
  const [expandedColorIdx, setExpandedColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [showMainAngles, setShowMainAngles] = useState(true);
  const [showSizeGuideEditor, setShowSizeGuideEditor] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Linen Shirts',
    price: '',
    stock: 25,
    image: '',
    views: [
      { name: 'Front View', url: '' },
      { name: 'Back Side', url: '' },
      { name: 'Left Side View', url: '' },
      { name: 'Button View', url: '' },
      { name: 'Right Side View', url: '' }
    ],
    size_guide: DEFAULT_PRODUCT_SIZE_GUIDE,
    badge: 'Italian Luxury',
    description: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Pure White', hex: '#FFFFFF', stock: 10, image: '', views: [] },
      { name: 'Obsidian Black', hex: '#111111', stock: 15, image: '', views: [] }
    ],
    is_active: true
  });

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const defaultAngleLabels = [
    { key: 'front', label: 'Front View' },
    { key: 'back', label: 'Back Side' },
    { key: 'left', label: 'Left Side View' },
    { key: 'button', label: 'Button View' },
    { key: 'right', label: 'Right Side View' }
  ];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setShowMainAngles(true);
    setFormData({
      title: '',
      category: 'Linen Shirts',
      price: '',
      stock: 20,
      image: '',
      views: [
        { name: 'Front View', url: '' },
        { name: 'Back Side', url: '' },
        { name: 'Left Side View', url: '' },
        { name: 'Button View', url: '' },
        { name: 'Right Side View', url: '' }
      ],
      size_guide: DEFAULT_PRODUCT_SIZE_GUIDE,
      badge: 'Italian Luxury',
      description: 'Crafted from 100% Normandy flax linen. Features bespoke mother-of-pearl buttons and tailored French seams.',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        {
          name: 'Pure Ivory',
          hex: '#fdfbf7',
          stock: 10,
          image: '',
          views: [
            { name: 'Front View', url: '' },
            { name: 'Back Side', url: '' },
            { name: 'Left Side View', url: '' },
            { name: 'Button View', url: '' },
            { name: 'Right Side View', url: '' }
          ]
        },
        {
          name: 'Sardinia Navy',
          hex: '#1a2942',
          stock: 10,
          image: '',
          views: [
            { name: 'Front View', url: '' },
            { name: 'Back Side', url: '' },
            { name: 'Left Side View', url: '' },
            { name: 'Button View', url: '' },
            { name: 'Right Side View', url: '' }
          ]
        }
      ],
      is_active: true
    });
    setShowSizeGuideEditor(false);
    setExpandedColorIdx(0);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setShowMainAngles(true);
    setShowSizeGuideEditor(false);
    setExpandedColorIdx(0);

    // Extract existing product views or fallback to first color views or main image
    const existingViews = Array.isArray(product.views) && product.views.length > 0
      ? product.views
      : (product.colors?.[0]?.views && Array.isArray(product.colors[0].views) && product.colors[0].views.length > 0)
        ? product.colors[0].views
        : [
            { name: 'Front View', url: product.image || '' },
            { name: 'Back Side', url: '' },
            { name: 'Left Side View', url: '' },
            { name: 'Button View', url: '' },
            { name: 'Right Side View', url: '' }
          ];

    // Parse size_guide if stored as json or object
    let parsedSizeGuide = DEFAULT_PRODUCT_SIZE_GUIDE;
    if (product.size_guide) {
      if (typeof product.size_guide === 'string') {
        try {
          parsedSizeGuide = JSON.parse(product.size_guide);
        } catch {}
      } else if (typeof product.size_guide === 'object') {
        parsedSizeGuide = product.size_guide;
      }
    }

    setFormData({
      title: product.title || '',
      category: product.category || 'Linen Shirts',
      price: product.price || '',
      stock: product.stock ?? 0,
      image: product.image || '',
      views: [
        { name: 'Front View', url: existingViews[0]?.url || product.image || '' },
        { name: 'Back Side', url: existingViews[1]?.url || '' },
        { name: 'Left Side View', url: existingViews[2]?.url || '' },
        { name: 'Button View', url: existingViews[3]?.url || '' },
        { name: 'Right Side View', url: existingViews[4]?.url || '' }
      ],
      size_guide: parsedSizeGuide,
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
      setFormData((prev) => {
        const nextViews = Array.isArray(prev.views) && prev.views.length > 0 ? [...prev.views] : [
          { name: 'Front View', url: '' },
          { name: 'Back Side', url: '' },
          { name: 'Left Side View', url: '' },
          { name: 'Button View', url: '' },
          { name: 'Right Side View', url: '' }
        ];
        // If front view is empty, set it
        if (!nextViews[0]?.url) {
          nextViews[0] = { name: 'Front View', url: publicUrl };
        }
        return {
          ...prev,
          image: publicUrl,
          views: nextViews
        };
      });
      setStatusMessage({ type: 'success', text: "Garment photo uploaded successfully to 'garment-photos' bucket!" });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Image upload failed. You can paste an image URL directly.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMainAngleChange = (viewIdx, url) => {
    setFormData(prev => {
      const defaultAngleNames = ['Front View', 'Back Side', 'Left Side View', 'Button View', 'Right Side View'];
      const nextViews = Array.isArray(prev.views) && prev.views.length > 0
        ? [...prev.views]
        : defaultAngleNames.map(name => ({ name, url: '' }));

      nextViews[viewIdx] = {
        name: nextViews[viewIdx]?.name || defaultAngleNames[viewIdx],
        url: url
      };

      // Also sync primary image if Front View changed
      const nextImage = viewIdx === 0 && url ? url : (prev.image || url);

      return {
        ...prev,
        image: nextImage,
        views: nextViews
      };
    });
  };

  const handleMainAngleUpload = async (viewIdx, file) => {
    if (!file) return;
    setUploadingMainAngleKey(viewIdx);
    try {
      const publicUrl = await uploadGarmentPhoto(file);
      handleMainAngleChange(viewIdx, publicUrl);
    } catch (err) {
      alert(`Angle photo upload error: ${err.message}`);
    } finally {
      setUploadingMainAngleKey(null);
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
      colors: [
        ...prev.colors,
        {
          name: 'Olive Linen',
          hex: '#556B2F',
          stock: 5,
          image: prev.image || '',
          views: [
            { name: 'Front View', url: prev.image || '' },
            { name: 'Back Side', url: prev.image || '' },
            { name: 'Left Side View', url: prev.image || '' },
            { name: 'Button View', url: prev.image || '' },
            { name: 'Right Side View', url: prev.image || '' }
          ]
        }
      ]
    }));
  };

  const handleRemoveColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
    if (expandedColorIdx === index) setExpandedColorIdx(null);
  };

  const handleColorMainImageChange = (colorIdx, url) => {
    const updated = [...formData.colors];
    const currentColor = updated[colorIdx] || {};
    const defaultAngleNames = ['Front View', 'Back Side', 'Left Side View', 'Button View', 'Right Side View'];
    let views = Array.isArray(currentColor.views) && currentColor.views.length > 0
      ? [...currentColor.views]
      : defaultAngleNames.map(name => ({ name, url: '' }));

    // Set primary front view if not set or update it
    if (!views[0]?.url) {
      views[0] = { name: 'Front View', url: url };
    }

    updated[colorIdx] = {
      ...currentColor,
      image: url,
      views: views
    };
    setFormData(prev => ({ ...prev, colors: updated }));
  };

  const handleColorMainImageUpload = async (colorIdx, file) => {
    if (!file) return;
    setUploadingColorKey(colorIdx);
    try {
      const publicUrl = await uploadGarmentPhoto(file);
      handleColorMainImageChange(colorIdx, publicUrl);
    } catch (err) {
      alert(`Color main photo upload error: ${err.message}`);
    } finally {
      setUploadingColorKey(null);
    }
  };

  const handleAngleViewChange = (colorIdx, viewIdx, url) => {
    const defaultAngleNames = ['Front View', 'Back Side', 'Left Side View', 'Button View', 'Right Side View'];
    const updated = [...formData.colors];
    const currentColor = updated[colorIdx] || {};
    let views = Array.isArray(currentColor.views) && currentColor.views.length > 0
      ? [...currentColor.views]
      : defaultAngleNames.map(name => ({ name, url: currentColor.image || formData.image || '' }));

    views[viewIdx] = {
      name: views[viewIdx]?.name || defaultAngleNames[viewIdx],
      url: url
    };

    updated[colorIdx] = {
      ...currentColor,
      image: viewIdx === 0 && url ? url : (currentColor.image || url),
      views: views
    };
    setFormData(prev => ({ ...prev, colors: updated }));
  };

  const handleAngleFileUpload = async (colorIdx, viewIdx, file) => {
    if (!file) return;
    const key = `${colorIdx}-${viewIdx}`;
    setUploadingAngleKey(key);
    try {
      const publicUrl = await uploadGarmentPhoto(file);
      handleAngleViewChange(colorIdx, viewIdx, publicUrl);
    } catch (err) {
      alert(`Angle photo upload error: ${err.message}`);
    } finally {
      setUploadingAngleKey(null);
    }
  };

  // Size Guide Handlers
  const handleSizeGuideRowChange = (index, field, value) => {
    setFormData(prev => {
      const currentGuide = prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE;
      const rows = [...(currentGuide.rows || [])];
      rows[index] = { ...rows[index], [field]: value };
      return {
        ...prev,
        size_guide: { ...currentGuide, rows }
      };
    });
  };

  const handleAddSizeGuideRow = () => {
    setFormData(prev => {
      const currentGuide = prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE;
      const rows = [...(currentGuide.rows || []), { size: 'XXL', chest: '50" - 52"', shoulder: '20.5"', sleeve: '37.5"', length: '31.8"' }];
      return {
        ...prev,
        size_guide: { ...currentGuide, rows }
      };
    });
  };

  const handleRemoveSizeGuideRow = (index) => {
    setFormData(prev => {
      const currentGuide = prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE;
      const rows = (currentGuide.rows || []).filter((_, i) => i !== index);
      return {
        ...prev,
        size_guide: { ...currentGuide, rows }
      };
    });
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
      // Clean & ensure 5 standard angles for product views
      const defaultAngleNames = ['Front View', 'Back Side', 'Left Side View', 'Button View', 'Right Side View'];
      const productViews = defaultAngleNames.map((name, i) => {
        const found = formData.views?.[i];
        return {
          name: found?.name || name,
          url: found?.url || (i === 0 ? finalImage : '')
        };
      });

      // Ensure all color variants have the product image and views set
      const formattedColors = (formData.colors || []).map(c => {
        const colorImg = c.image || finalImage;
        const colorViews = defaultAngleNames.map((name, i) => {
          const found = c.views?.[i];
          return {
            name: found?.name || name,
            url: found?.url || (i === 0 ? colorImg : (productViews[i]?.url || colorImg))
          };
        });

        return {
          ...c,
          name: c.name || 'Default',
          code: c.hex || c.code || '#FFFFFF',
          hex: c.hex || c.code || '#FFFFFF',
          stock: Number(c.stock !== undefined ? c.stock : 10),
          image: colorImg,
          views: colorViews
        };
      });

      const payload = {
        title: formData.title.trim(),
        category: formData.category || 'Linen Shirts',
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0,
        image: finalImage,
        views: productViews,
        size_guide: formData.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE,
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
                        <span>{uploadingImage ? 'Uploading to Supabase...' : 'Select Main Photo to Upload'}</span>
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
                      onChange={(e) => {
                        const url = e.target.value;
                        setFormData((prev) => {
                          const nextViews = Array.isArray(prev.views) ? [...prev.views] : [];
                          if (!nextViews[0]?.url) nextViews[0] = { name: 'Front View', url };
                          return { ...prev, image: url, views: nextViews };
                        });
                      }}
                      className="luxury-input"
                      style={{ fontSize: '12px', height: '34px' }}
                    />
                  </div>
                </div>

                {/* 5-Angle Lookbook Photos: Front, Back, Left, Button, Right */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px dashed rgba(212, 175, 55, 0.25)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={14} color="var(--accent-gold)" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        5 Angle Views (Front, Back, Left, Button, Right)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Upload one-by-one to sync with customer storefront
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {defaultAngleLabels.map((angle, vIdx) => {
                      const viewObj = formData.views?.[vIdx] || { name: angle.label, url: '' };
                      const isUploadingThis = uploadingMainAngleKey === vIdx;

                      return (
                        <div
                          key={angle.key}
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: viewObj.url ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-gold)' }}>
                              {angle.label}
                            </span>
                            {viewObj.url && <Check size={12} color="#10b981" />}
                          </div>

                          <div style={{
                            width: '100%',
                            height: '84px',
                            borderRadius: '6px',
                            background: '#07090e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border-subtle)',
                            position: 'relative'
                          }}>
                            {viewObj.url ? (
                              <img
                                src={viewObj.url}
                                alt={angle.label}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Photo</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <label
                              className="secondary-btn"
                              style={{
                                flex: 1,
                                height: '26px',
                                fontSize: '10px',
                                padding: '0 6px',
                                cursor: isUploadingThis ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Upload size={11} style={{ marginRight: '4px' }} />
                              <span>{isUploadingThis ? 'Uploading...' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingThis}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleMainAngleUpload(vIdx, file);
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>

                            {viewObj.url && (
                              <button
                                type="button"
                                onClick={() => handleMainAngleChange(vIdx, '')}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444',
                                  borderRadius: '4px',
                                  padding: '0 6px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                                title="Clear photo"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          <input
                            type="url"
                            placeholder="Or CDN URL..."
                            value={viewObj.url || ''}
                            onChange={(e) => handleMainAngleChange(vIdx, e.target.value)}
                            className="luxury-input"
                            style={{ height: '24px', fontSize: '10px', padding: '2px 6px' }}
                          />
                        </div>
                      );
                    })}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formData.colors.map((c, idx) => {
                    const isExpanded = expandedColorIdx === idx;
                    const defaultAngleNames = ['Front View', 'Back Side', 'Left Side View', 'Button View', 'Right Side View'];
                    const currentViews = Array.isArray(c.views) && c.views.length > 0
                      ? c.views
                      : defaultAngleNames.map(name => ({ name, url: c.image || formData.image || '' }));

                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: isExpanded ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={c.hex || '#000000'}
                            onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                            style={{ width: '38px', height: '36px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Pick variant color"
                          />
                          <input
                            type="text"
                            placeholder="Color Name (e.g. Light Pink, Navy)"
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

                          {/* Quick Color Main Image Thumbnail */}
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-gold)' }}
                              title="Current main photo for this color"
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <ImageIcon size={14} />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedColorIdx(isExpanded ? null : idx)}
                            style={{
                              background: isExpanded ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                              border: isExpanded ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                              color: isExpanded ? 'var(--text-gold)' : 'var(--text-secondary)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Manage Main Image & 5 Angle Photos for this Color"
                          >
                            <Camera size={13} />
                            <span>Color Photos ({currentViews.filter(v => v.url).length}/5)</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveColor(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                            title="Remove color variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Collapsible Main Image & 5 Angle Views for this specific Color */}
                        {isExpanded && (
                          <div style={{
                            padding: '14px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            border: '1px dashed rgba(212, 175, 55, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}>
                            {/* Color Primary / Main Image */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: 'rgba(212, 175, 55, 0.05)',
                              border: '1px solid rgba(212, 175, 55, 0.2)',
                              borderRadius: '6px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '6px',
                                  background: '#07090e',
                                  overflow: 'hidden',
                                  border: '1px solid var(--border-gold)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {c.image ? (
                                    <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <ImageIcon size={18} color="var(--text-muted)" />
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-gold)' }}>
                                    MAIN COVER PHOTO: {c.name ? c.name.toUpperCase() : 'VARIANT'}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    Displays as storefront swatch thumbnail & primary front view
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <label
                                  className="secondary-btn"
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    padding: '0 10px',
                                    cursor: uploadingColorKey === idx ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Upload size={12} style={{ marginRight: '5px' }} />
                                  <span>{uploadingColorKey === idx ? 'Uploading...' : 'Upload Main Photo'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingColorKey === idx}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleColorMainImageUpload(idx, file);
                                    }}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                                <input
                                  type="url"
                                  placeholder="Or paste CDN URL..."
                                  value={c.image || ''}
                                  onChange={(e) => handleColorMainImageChange(idx, e.target.value)}
                                  className="luxury-input"
                                  style={{ width: '160px', height: '28px', fontSize: '11px', padding: '2px 8px' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                5 Angle Views for {c.name || 'this color'} (Front, Back, Left, Button, Right)
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                Shows in customer gallery when buyer selects this color
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                              {defaultAngleNames.map((angleName, vIdx) => {
                                const viewObj = currentViews[vIdx] || { name: angleName, url: '' };
                                const isAngleUploading = uploadingAngleKey === `${idx}-${vIdx}`;

                                return (
                                  <div
                                    key={angleName}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: viewObj.url ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid var(--border-subtle)',
                                      borderRadius: '6px',
                                      padding: '8px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                        {angleName}
                                      </span>
                                      {viewObj.url && <Check size={11} color="#10b981" />}
                                    </div>

                                    <div style={{
                                      width: '100%',
                                      height: '80px',
                                      borderRadius: '4px',
                                      background: '#07090e',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-subtle)'
                                    }}>
                                      {viewObj.url ? (
                                        <img
                                          src={viewObj.url}
                                          alt={angleName}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No Photo</span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <label
                                        className="secondary-btn"
                                        style={{
                                          flex: 1,
                                          height: '26px',
                                          fontSize: '10px',
                                          padding: '0 4px',
                                          cursor: isAngleUploading ? 'wait' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Upload size={10} style={{ marginRight: '4px' }} />
                                        <span>{isAngleUploading ? '...' : 'Upload'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          disabled={isAngleUploading}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleAngleFileUpload(idx, vIdx, file);
                                          }}
                                          style={{ display: 'none' }}
                                        />
                                      </label>

                                      {viewObj.url && (
                                        <button
                                          type="button"
                                          onClick={() => handleAngleViewChange(idx, vIdx, '')}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#ef4444',
                                            borderRadius: '4px',
                                            padding: '0 4px',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                          }}
                                          title="Clear photo"
                                        >
                                          <X size={11} />
                                        </button>
                                      )}
                                    </div>

                                    <input
                                      type="url"
                                      placeholder="Or CDN URL..."
                                      value={viewObj.url || ''}
                                      onChange={(e) => handleAngleViewChange(idx, vIdx, e.target.value)}
                                      className="luxury-input"
                                      style={{ height: '24px', fontSize: '10px', padding: '2px 6px' }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product-Specific Size Guide Chart Editor */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-gold)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ruler size={16} color="var(--accent-gold)" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Product Size Guide Chart
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Custom measurements for this product. Syncs directly to Storefront Size Guide modal.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSizeGuideEditor(!showSizeGuideEditor)}
                    style={{
                      background: showSizeGuideEditor ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: showSizeGuideEditor ? 'var(--text-gold)' : 'var(--text-secondary)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sliders size={12} />
                    <span>{showSizeGuideEditor ? 'Hide Sizing Matrix' : 'Edit Sizing Matrix'}</span>
                    {showSizeGuideEditor ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {showSizeGuideEditor && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          CHART TITLE
                        </label>
                        <input
                          type="text"
                          value={formData.size_guide?.title || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            size_guide: { ...(prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE), title: e.target.value }
                          }))}
                          className="luxury-input"
                          style={{ height: '32px', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                          SUBTITLE / FIT ADVISORY
                        </label>
                        <input
                          type="text"
                          value={formData.size_guide?.subtitle || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            size_guide: { ...(prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE), subtitle: e.target.value }
                          }))}
                          className="luxury-input"
                          style={{ height: '32px', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    {/* Sizing Rows Table */}
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>SIZE</th>
                            <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>CHEST</th>
                            <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>SHOULDER</th>
                            <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>SLEEVE</th>
                            <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>LENGTH</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.size_guide?.rows || DEFAULT_PRODUCT_SIZE_GUIDE.rows).map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  value={row.size || ''}
                                  onChange={(e) => handleSizeGuideRowChange(rIdx, 'size', e.target.value)}
                                  className="luxury-input"
                                  style={{ height: '28px', width: '60px', fontWeight: 700 }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  value={row.chest || ''}
                                  onChange={(e) => handleSizeGuideRowChange(rIdx, 'chest', e.target.value)}
                                  className="luxury-input"
                                  style={{ height: '28px' }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  value={row.shoulder || ''}
                                  onChange={(e) => handleSizeGuideRowChange(rIdx, 'shoulder', e.target.value)}
                                  className="luxury-input"
                                  style={{ height: '28px' }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  value={row.sleeve || ''}
                                  onChange={(e) => handleSizeGuideRowChange(rIdx, 'sleeve', e.target.value)}
                                  className="luxury-input"
                                  style={{ height: '28px' }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px' }}>
                                <input
                                  type="text"
                                  value={row.length || ''}
                                  onChange={(e) => handleSizeGuideRowChange(rIdx, 'length', e.target.value)}
                                  className="luxury-input"
                                  style={{ height: '28px' }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSizeGuideRow(rIdx)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  title="Remove size row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleAddSizeGuideRow}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-gold)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Add Size Measurement Row
                      </button>

                      <input
                        type="text"
                        placeholder="Fit Recommendation Note (e.g. Fits true to size...)"
                        value={formData.size_guide?.fitNote || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          size_guide: { ...(prev.size_guide || DEFAULT_PRODUCT_SIZE_GUIDE), fitNote: e.target.value }
                        }))}
                        className="luxury-input"
                        style={{ height: '30px', fontSize: '11px', width: '65%' }}
                      />
                    </div>
                  </div>
                )}
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
