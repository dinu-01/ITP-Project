import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner, Pagination, StatusBadge } from '../components/shared';
import toast from 'react-hot-toast';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', serviceType: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/bookings', { params: { ...filters, page, limit: 15 } });
      setBookings(data.bookings); setPages(data.pages); setTotal(data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [filters, page]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/bookings/${id}/status`, { status }); toast.success('Status updated'); fetchBookings(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const downloadPDF = async (id, ref) => {
    try {
      const res = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `booking-${ref}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download'); }
  };

  const selStyle = {
    border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '4px 8px',
    fontSize: 12, outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer',
  };

  const typeColors = { hotel: { bg: '#dbeafe', color: '#1e40af' }, vehicle: { bg: '#dcfce7', color: '#14532d' }, guide: { bg: '#fef9c3', color: '#854d0e' }, package: { bg: '#ede9fe', color: '#581c87' } };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <Link to="/admin" style={{ fontSize: 12, color: '#bae6fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>← Dashboard</Link>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#bae6fd', marginBottom: 8, textTransform: 'uppercase' }}>Admin Panel</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', color: 'white', marginBottom: 6 }}>All Bookings</h1>
            <p style={{ color: '#bae6fd', fontSize: 14 }}>{total} total bookings on the platform</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '-28px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
        {/* Filters */}
        <div style={{
          background: 'white', borderRadius: 18, padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(12,74,110,0.12)', marginBottom: 24,
          display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end',
          border: '1px solid #f1f5f9',
        }}>
          {[['status','Status',['','Pending','Confirmed','Completed','Cancelled'],['All Statuses','Pending','Confirmed','Completed','Cancelled']],
            ['serviceType','Service Type',['','hotel','vehicle','guide','package'],['All Types','Hotel','Vehicle','Guide','Package']]].map(([k,l,vals,labels]) => (
            <div key={k}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{l}</div>
              <select value={filters[k]} onChange={e => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); }}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white' }}>
                {vals.map((v,i) => <option key={v} value={v}>{labels[i]}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => { setFilters({ status: '', serviceType: '' }); setPage(1); }}
            style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: 'white', fontFamily: 'inherit', color: '#475569' }}>Clear</button>
        </div>

        {loading ? <Spinner /> : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(12,74,110,0.07)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 15 }}>No bookings found.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(12,74,110,0.08)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f0f9ff)', borderBottom: '2px solid #e0f2fe' }}>
                      {['Reference','Tourist','Service','Dates','Amount','Status','Payment','Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, idx) => {
                      const tc = typeColors[b.serviceType] || typeColors.hotel;
                      return (
                        <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafcff', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafcff'}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#dbeafe', padding: '3px 8px', borderRadius: 6 }}>{b.referenceNumber}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: 600, color: '#0c2340' }}>{b.tourist?.name}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{b.tourist?.email}</p>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: tc.bg, color: tc.color }}>{b.serviceType}</span>
                            <p style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{b.hotel?.name || (b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : '')}</p>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>
                            <p>{new Date(b.startDate).toLocaleDateString()}</p>
                            <p style={{ color: '#94a3b8' }}>→ {new Date(b.endDate).toLocaleDateString()}</p>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0369a1' }}>LKR {b.totalPrice?.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={b.status} /></td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={b.paymentStatus} /></td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <select value={b.status} onChange={e => updateStatus(b._id, e.target.value)} style={selStyle}>
                                {['Pending','Confirmed','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
                              </select>
                              <button onClick={() => downloadPDF(b._id, b.referenceNumber)}
                                style={{ fontSize: 11, color: '#0369a1', background: '#dbeafe', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>📄 PDF</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}