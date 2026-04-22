import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner, Pagination, StatusBadge } from '../components/shared';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editingDates, setEditingDates] = useState(null);
  const [savingDates, setSavingDates] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/my', { params: { status: filter || undefined, page, limit: 10 } });
      let bks = data.bookings || [];
      if (dateFilter.startDate) bks = bks.filter(b => new Date(b.startDate) >= new Date(dateFilter.startDate));
      if (dateFilter.endDate) bks = bks.filter(b => new Date(b.endDate) <= new Date(dateFilter.endDate));
      setBookings(bks); setPages(data.pages);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filter, page, dateFilter]);

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.put(`/bookings/${id}/cancel`); toast.success('Booking cancelled'); fetchBookings(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const downloadPDF = async (id, ref) => {
    try {
      const res = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `booking-${ref}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

  const openDateEdit = (b) => setEditingDates({ bookingId: b._id, startDate: b.startDate.split('T')[0], endDate: b.endDate.split('T')[0] });

  const saveDates = async () => {
    if (!editingDates.startDate || !editingDates.endDate) return toast.error('Both dates required');
    if (new Date(editingDates.startDate) >= new Date(editingDates.endDate)) return toast.error('End date must be after start date');
    setSavingDates(true);
    try {
      await api.put(`/bookings/${editingDates.bookingId}/dates`, { startDate: editingDates.startDate, endDate: editingDates.endDate });
      toast.success('Booking dates updated'); setEditingDates(null); fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update dates'); }
    finally { setSavingDates(false); }
  };

  const getServiceLabel = (b) => {
    if (b.serviceType === 'hotel' && b.hotel) return `🏨 ${b.hotel.name}${b.roomType ? ` — ${b.roomType} Room` : ''}`;
    if (b.serviceType === 'vehicle' && b.vehicle) return `🚗 ${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.type})`;
    if (b.serviceType === 'guide') return `🧭 Tour Guide`;
    if (b.serviceType === 'package') return `🎒 All-in-One Travel Package`;
    return b.serviceType;
  };

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px',
    fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none', transition: 'all 0.2s',
  };

  const statusColors = { '': '#0369a1', Pending: '#d97706', Confirmed: '#0369a1', Completed: '#059669', Cancelled: '#dc2626' };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#bae6fd', marginBottom: 8, textTransform: 'uppercase' }}>My Account</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', color: 'white', marginBottom: 6 }}>My Bookings</h1>
          <p style={{ color: '#bae6fd', fontSize: 14 }}>Track and manage all your travel bookings</p>
        </div>
      </div>

      {/* Date Edit Modal */}
      {editingDates && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,74,110,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '28px', maxWidth: 420, width: '100%', boxShadow: '0 24px 64px rgba(12,74,110,0.2)' }}>
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#0c2340', marginBottom: 20 }}>Change Booking Dates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[['New Start Date','startDate',new Date().toISOString().split('T')[0]],['New End Date','endDate',editingDates.startDate||new Date().toISOString().split('T')[0]]].map(([l,k,min]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{l.toUpperCase()}</label>
                  <input type="date" value={editingDates[k]} min={min}
                    onChange={e => setEditingDates({ ...editingDates, [k]: e.target.value })} style={{ ...inp, width: '100%' }}
                    onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveDates} disabled={savingDates} style={{
                flex: 1, background: savingDates ? '#94a3b8' : 'linear-gradient(135deg,#0369a1,#0284c7)',
                color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 600, fontSize: 13, cursor: savingDates ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>{savingDates ? 'Saving...' : 'Save Dates'}</button>
              <button onClick={() => setEditingDates(null)} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
        {/* Filters */}
        <div style={{ background: 'white', borderRadius: 18, padding: '20px 24px', boxShadow: '0 8px 32px rgba(12,74,110,0.12)', marginBottom: 24, border: '1px solid #f1f5f9' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
                <button key={s} onClick={() => { setFilter(s); setPage(1); }} style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  border: filter === s ? 'none' : '1.5px solid #e2e8f0',
                  background: filter === s ? `linear-gradient(135deg, ${statusColors[s]}, ${statusColors[s]}cc)` : 'white',
                  color: filter === s ? 'white' : '#475569', transition: 'all 0.2s',
                }}>{s || 'All'}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[['From Date','startDate'],['To Date','endDate']].map(([l,k]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>📅 {l}</div>
                <input type="date" value={dateFilter[k]} min={k === 'endDate' ? dateFilter.startDate : ''}
                  onChange={e => { setDateFilter(d => ({ ...d, [k]: e.target.value })); setPage(1); }} style={inp}
                  onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button onClick={() => { setDateFilter({ startDate: '', endDate: '' }); setPage(1); }}
                style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '9px 0' }}>✕ Clear dates</button>
            )}
          </div>
        </div>

        {loading ? <Spinner /> : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(12,74,110,0.07)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 16 }}>No bookings found.</p>
            <Link to="/hotels" style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Browse Hotels →</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bookings.map(b => (
                <div key={b._id} style={{ background: 'white', borderRadius: 18, padding: '20px 24px', boxShadow: '0 4px 24px rgba(12,74,110,0.07)', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(12,74,110,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(12,74,110,0.07)'}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#0369a1', background: '#dbeafe', padding: '3px 10px', borderRadius: 6 }}>{b.referenceNumber}</span>
                        <StatusBadge status={b.status} />
                        <StatusBadge status={b.paymentStatus} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0c2340', marginBottom: 4 }}>{getServiceLabel(b)}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>📅 {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>LKR {b.totalPrice?.toLocaleString()}</p>
                      {b.serviceType === 'package' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                          {b.packageHotel && <span style={{ fontSize: 11 }}>🏨 <StatusBadge status={b.packageHotelStatus || 'Pending'} /></span>}
                          {b.packageVehicle && <span style={{ fontSize: 11 }}>🚗 <StatusBadge status={b.packageVehicleStatus || 'Pending'} /></span>}
                          {b.packageGuide && <span style={{ fontSize: 11 }}>🧭 <StatusBadge status={b.packageGuideStatus || 'Pending'} /></span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <Link to={`/bookings/${b._id}`} style={{ fontSize: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', color: '#475569', background: 'white', fontWeight: 500 }}>👁 View</Link>
                      <button onClick={() => downloadPDF(b._id, b.referenceNumber)} style={{ fontSize: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', background: 'white', color: '#475569', fontFamily: 'inherit', fontWeight: 500 }}>📄 PDF</button>
                      {b.status === 'Pending' && (
                        <>
                          <button onClick={() => openDateEdit(b)} style={{ fontSize: 12, border: '1.5px solid #bae6fd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', background: '#f0f9ff', color: '#0369a1', fontFamily: 'inherit', fontWeight: 500 }}>✏️ Dates</button>
                          <button onClick={() => cancelBooking(b._id)} style={{ fontSize: 12, background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Cancel</button>
                        </>
                      )}
                      {b.status === 'Completed' && (
                        <Link to={`/bookings/${b._id}`} style={{ fontSize: 12, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', fontWeight: 500 }}>⭐ Review</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}