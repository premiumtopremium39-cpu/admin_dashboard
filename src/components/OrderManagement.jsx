import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  User,
  MapPin,
  Package,
  Eye,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function OrderManagement({ orders = [], onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statuses = ['Placed', 'Paid', 'Preparation', 'Dispatched', 'Delivered', 'Cancelled'];

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('order_id', orderId);

      if (error) throw error;

      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Order update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async (orderId, carrier, trackingNumber) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          carrier,
          tracking_number: trackingNumber,
          order_status: 'Dispatched'
        })
        .eq('order_id', orderId);

      if (error) throw error;
      alert('Tracking information synchronized successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Tracking update error: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter and Search Bar */}
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
              placeholder="Search by Order ID, Client Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="luxury-input"
              style={{ paddingLeft: '38px', height: '40px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="luxury-select"
            style={{ width: '160px', height: '40px' }}
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{filteredOrders.length}</span> orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>ORDER ID</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENT</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>DATE</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL AMOUNT</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>PAYMENT</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>FULFILLMENT STATUS</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No customer orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-gold)' }}>
                    {order.order_id}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.customer_email}</div>
                  </td>

                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </td>

                  <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span className={`badge ${
                      order.payment_status === 'paid' ? 'badge-success' :
                      order.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {order.payment_status || 'pending'}
                    </span>
                  </td>

                  <td style={{ padding: '14px' }}>
                    <select
                      value={order.order_status || 'Placed'}
                      onChange={(e) => handleUpdateStatus(order.order_id, e.target.value)}
                      className="luxury-select"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        width: '140px',
                        height: '32px',
                        borderColor: order.order_status === 'Delivered' ? 'var(--status-success)' : 'var(--border-subtle)'
                      }}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="secondary-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
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
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#12151c',
            border: '1px solid var(--border-gold)',
            borderRadius: '18px',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Order Dossier: {selectedOrder.order_id}
                </h3>
                <span className="badge badge-gold" style={{ marginTop: '4px' }}>
                  {selectedOrder.order_status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="secondary-btn"
                style={{ padding: '6px 10px' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Client & Shipping */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Client & Consignment Address
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{selectedOrder.customer_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedOrder.customer_email} • {selectedOrder.customer_phone || 'N/A'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {typeof selectedOrder.shipping_address === 'object'
                    ? JSON.stringify(selectedOrder.shipping_address)
                    : (selectedOrder.shipping_address || 'Standard Delivery Address')}
                </div>
              </div>

              {/* Items Purchased */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Ordered Haute Couture Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title || item.name || 'Linen Garment'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Size: {item.size || 'M'} • Color: {item.color || 'Standard'} • Qty: {item.quantity || 1}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-gold)' }}>
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(212,175,55,0.08)', borderRadius: '12px', border: '1px solid var(--border-gold)' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Total Settlement:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-gold)' }}>
                  ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
