import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import ProductManagement from './components/ProductManagement';
import InventoryCounter from './components/InventoryCounter';
import OrderManagement from './components/OrderManagement';
import PromoCodesManagement from './components/PromoCodesManagement';
import ClientReviewsManagement from './components/ClientReviewsManagement';
import FinancialAnalytics from './components/FinancialAnalytics';
import AdminSettings from './components/AdminSettings';

export default function App() {
  const { session, user, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promos, setPromos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all live database records
  const fetchAllData = async () => {
    try {
      setRefreshing(true);

      const [productsRes, ordersRes, promosRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('promo_codes').select('*').order('id', { ascending: true }),
        supabase.from('product_reviews').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (promosRes.data) setPromos(promosRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch (err) {
      console.error('Error fetching Supabase database records:', err);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session && user) {
      fetchAllData();

      // Setup Realtime listeners for instant synchronization
      const productChannel = supabase
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          supabase.from('products').select('*').order('id', { ascending: true }).then(({ data }) => {
            if (data) setProducts(data);
          });
        })
        .subscribe();

      const orderChannel = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setOrders(data);
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(productChannel);
        supabase.removeChannel(orderChannel);
      };
    }
  }, [session, user]);

  // If verifying authentication
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0c10',
        color: 'var(--text-gold)',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid rgba(212,175,55,0.2)',
          borderTopColor: 'var(--accent-gold)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
          Authenticating Executive Session...
        </span>
      </div>
    );
  }

  // If unauthenticated or session not verified, show login
  if (!session || !user) {
    return <LoginView />;
  }

  // Pre-calculate count badges for sidebar
  const pendingOrdersCount = orders.filter(o => o.order_status === 'Placed' || o.order_status === 'Preparation').length;
  const lowStockCount = products.filter(p => Number(p.stock) <= 5).length;

  const tabTitles = {
    dashboard: { title: 'Executive Overview', subtitle: 'Live key performance indicators & store velocity' },
    products: { title: 'Haute Couture Product Catalog', subtitle: 'Manage garment profiles, prices, sizes, and colors' },
    inventory: { title: 'Inventory & Stock Management', subtitle: 'Real-time stock controls and variant replenishment' },
    orders: { title: 'Customer Order Fulfillment', subtitle: 'Track orders, payments, logistics, and delivery dispatches' },
    promotions: { title: 'Promotional Vouchers', subtitle: 'Configure discounts, coupon codes, and campaigns' },
    reviews: { title: 'Client Feedback Moderation', subtitle: 'Review and approve authenticated buyer testimonials' },
    analytics: { title: 'Fiscal Intelligence & Analytics', subtitle: 'Consolidated revenue growth, basket size, and margins' },
    settings: { title: 'System Settings', subtitle: 'Storefront banners, RLS policies, and administrator credentials' },
  };

  const currentHeaderInfo = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Fixed Luxury Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          products: products.length,
          lowStock: lowStockCount,
          pendingOrders: pendingOrdersCount,
          promos: promos.length,
          reviews: reviews.length
        }}
      />

      {/* Main Content Workspace */}
      <div style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        <Header
          title={currentHeaderInfo.title}
          subtitle={currentHeaderInfo.subtitle}
          onRefresh={fetchAllData}
          refreshing={refreshing}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />

        <main style={{ padding: '32px', flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'dashboard' && (
            <DashboardOverview
              products={products}
              orders={orders}
              promos={promos}
              reviews={reviews}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagement
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryCounter
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManagement
              orders={orders}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'promotions' && (
            <PromoCodesManagement
              promos={promos}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'reviews' && (
            <ClientReviewsManagement
              reviews={reviews}
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'analytics' && (
            <FinancialAnalytics
              orders={orders}
              products={products}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings />
          )}
        </main>
      </div>
    </div>
  );
}
