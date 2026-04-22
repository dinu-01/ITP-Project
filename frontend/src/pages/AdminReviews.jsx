import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner, Pagination, StarRating } from '../components/shared';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ minRating: '', maxRating: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews', { params: { ...filters, page, limit: 15 } });
      setReviews(data.reviews); setPages(data.pages); setTotal(data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [filters, page]);

  const deleteReview = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try { await api.delete(`/reviews/${id}`); toast.success('Review deleted'); fetchReviews(); }
    catch { toast.error('Failed'); }
  };

  const toggleVisibility = async (id) => {
    try { await api.put(`/admin/reviews/${id}/toggle-visibility`); toast.success('Visibility toggled'); fetchReviews(); }
    catch { toast.error('Failed'); }
  };

  const typeColors = { hotel: { bg: '#dbeafe', color: '#1e40af' }, vehicle: { bg: '#dcfce7', color: '#14532d' }, guide: { bg: '#fef9c3', color: '#854d0e' } };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link to="/admin" style={{ fontSize: 12, color: '#bae6fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>← Dashboard</Link>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#bae6fd', marginBottom: 8, textTransform: 'uppercase' }}>Admin Panel</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', color: 'white', marginBottom: 6 }}>All Reviews</h1>
          <p style={{ color: '#bae6fd', fontSize: 14 }}>{total} reviews submitted by tourists</p>
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
          {[['minRating','Min Rating'],['maxRating','Max Rating']].map(([k,l]) => (
            <div key={k}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{l}</div>
              <select value={filters[k]} onChange={e => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); }}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white' }}>
                <option value="">Any</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => { setFilters({ minRating: '', maxRating: '' }); setPage(1); }}
            style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: 'white', fontFamily: 'inherit', color: '#475569' }}>Clear</button>
        </div>

        {loading ? <Spinner /> : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(12,74,110,0.07)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p style={{ fontSize: 15 }}>No reviews found.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => {
                const tc = typeColors[r.serviceType] || typeColors.hotel;
                return (
                  <div key={r._id} style={{
                    background: 'white', borderRadius: 18, padding: '20px 24px',
                    boxShadow: '0 4px 24px rgba(12,74,110,0.07)', border: '1px solid #f1f5f9',
                    opacity: r.isVisible ? 1 : 0.55, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white' }}>
                          {r.tourist?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#0c2340', fontSize: 14 }}>{r.tourist?.name}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8' }}>{r.tourist?.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <StarRating rating={r.rating} />
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: tc.bg, color: tc.color }}>{r.serviceType}</span>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: r.isVisible ? '#dcfce7' : '#f1f5f9', color: r.isVisible ? '#14532d' : '#475569', border: `1px solid ${r.isVisible ? '#86efac' : '#e2e8f0'}` }}>
                          {r.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 10 }}>{r.comment}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.hotel && <span style={{ fontSize: 11, color: '#475569' }}>• 🏨 {r.hotel.name}</span>}
                      {r.vehicle && <span style={{ fontSize: 11, color: '#475569' }}>• 🚗 {r.vehicle.brand} {r.vehicle.model}</span>}
                    </div>

                    {r.reply && (
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 12, borderLeft: '3px solid #0369a1' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0369a1' }}>Provider replied: </span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{r.reply.comment}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => toggleVisibility(r._id)} style={{
                        fontSize: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 14px',
                        cursor: 'pointer', background: 'white', fontFamily: 'inherit', color: '#475569', fontWeight: 500,
                      }}>{r.isVisible ? 'Hide Review' : 'Show Review'}</button>
                      <button onClick={() => deleteReview(r._id)} style={{
                        fontSize: 12, background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5',
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                      }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}