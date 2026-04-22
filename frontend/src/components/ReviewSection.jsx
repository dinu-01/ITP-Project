import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StarRating, Pagination } from './shared';
import toast from 'react-hot-toast';

export default function ReviewSection({ serviceType, serviceId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recent');
  const [minRating, setMinRating] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReply, setShowReply] = useState({});
  const [myCompletedBookings, setMyCompletedBookings] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', bookingId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [myReviewedBookings, setMyReviewedBookings] = useState([]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/${serviceType}/${serviceId}`, { params: { sort, minRating, page } });
      setReviews(data.reviews);
      setTotal(data.total);
      setPages(data.pages);
    } catch { }
  };

  const fetchMyCompletedBookings = async () => {
    if (!user || user.role !== 'tourist') return;
    try {
      const { data } = await api.get('/bookings/my', { params: { status: 'Completed', limit: 50 } });
      const relevant = (data.bookings || []).filter(b => {
        if (serviceType === 'hotel') return b.hotel?._id === serviceId || b.hotel === serviceId;
        if (serviceType === 'vehicle') return b.vehicle?._id === serviceId || b.vehicle === serviceId;
        if (serviceType === 'guide') return b.guide?._id === serviceId || b.guide === serviceId;
        return false;
      });
      setMyCompletedBookings(relevant);
      const myRev = await api.get('/reviews/my');
      const reviewedIds = (myRev.data.reviews || []).map(r => r.booking?._id || r.booking);
      setMyReviewedBookings(reviewedIds);
      const unreviewed = relevant.find(b => !reviewedIds.includes(b._id));
      if (unreviewed) setReviewForm(f => ({ ...f, bookingId: unreviewed._id }));
    } catch { }
  };

  useEffect(() => { fetchReviews(); }, [serviceType, serviceId, sort, minRating, page]);
  useEffect(() => { fetchMyCompletedBookings(); }, [user, serviceId]);

  const submitReview = async () => {
    if (!reviewForm.bookingId) return toast.error('Select a booking to review');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId: reviewForm.bookingId, rating: reviewForm.rating, comment: reviewForm.comment });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '', bookingId: '' });
      fetchReviews();
      fetchMyCompletedBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch { toast.error('Failed'); }
  };

  const submitReply = async (reviewId) => {
    const comment = replyText[reviewId];
    if (!comment?.trim()) return toast.error('Reply text required');
    try {
      await api.post(`/reviews/${reviewId}/reply`, { comment });
      toast.success('Reply posted');
      setShowReply({});
      fetchReviews();
    } catch { toast.error('Failed'); }
  };

  const isProvider = user && ['hotel_owner', 'vehicle_owner', 'guide', 'admin'].includes(user.role);
  const unreviewedBookings = myCompletedBookings.filter(b => !myReviewedBookings.includes(b._id));

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px',
    fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none', transition: 'all 0.2s', width: '100%',
  };

  return (
    <div>
      {/* Write Review Section */}
      {user?.role === 'tourist' && unreviewedBookings.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          border: '1.5px solid #bae6fd', borderRadius: 18,
          padding: '24px 28px', marginBottom: 28,
          boxShadow: '0 4px 20px rgba(3,105,161,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#0369a1,#0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>⭐</div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.1rem', color: '#0c2340', margin: 0 }}>Share Your Experience</h3>
          </div>

          {unreviewedBookings.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select Booking</label>
              <select
                value={reviewForm.bookingId}
                onChange={e => setReviewForm({ ...reviewForm, bookingId: e.target.value })}
                style={{ ...inp, maxWidth: 340 }}
                onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Select a booking</option>
                {unreviewedBookings.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.referenceNumber} — {new Date(b.startDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Rating</label>
            <StarRating rating={reviewForm.rating} onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your experience with other travellers..."
              rows={3}
              style={{
                ...inp, resize: 'none', lineHeight: 1.6,
                padding: '12px 14px',
              }}
              onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            onClick={submitReview}
            disabled={submitting}
            style={{
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#0369a1,#0284c7)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(3,105,161,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : '✓ Submit Review'}
          </button>
        </div>
      )}

      {/* Reviews Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.4rem', color: '#0c2340', margin: 0 }}>
            Reviews
            <span style={{
              marginLeft: 10, background: '#e0f2fe', color: '#0369a1',
              fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
            }}>{total}</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            style={{ ...inp, width: 'auto', fontSize: 12 }}
            onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
          <select value={minRating} onChange={e => { setMinRating(e.target.value); setPage(1); }}
            style={{ ...inp, width: 'auto', fontSize: 12 }}
            onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'white', borderRadius: 16,
          border: '1px solid #f1f5f9',
          color: '#94a3b8', fontSize: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
          No reviews yet. Be the first to share your experience!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(review => (
            <div key={review._id} style={{
              background: 'white', borderRadius: 16,
              border: '1px solid #f1f5f9',
              boxShadow: '0 2px 12px rgba(12,74,110,0.06)',
              padding: '20px 22px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(12,74,110,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(12,74,110,0.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#0369a1', flexShrink: 0,
                  }}>
                    {review.tourist?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, margin: 0 }}>{review.tourist?.name}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0', }}>
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <StarRating rating={review.rating} />
                  {(user?._id === review.tourist?._id || user?.role === 'admin') && (
                    <button onClick={() => deleteReview(review._id)} style={{
                      background: 'none', border: 'none', color: '#ef4444',
                      fontSize: 12, cursor: 'pointer', padding: '2px 6px',
                      borderRadius: 6, transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >Delete</button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#374151', marginTop: 14, lineHeight: 1.65 }}>{review.comment}</p>

              {/* Provider reply */}
              {review.reply && (
                <div style={{
                  marginTop: 14,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderLeft: '3px solid #0369a1',
                  borderRadius: '0 10px 10px 0', padding: '12px 16px',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Provider Reply</p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{review.reply.comment}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{new Date(review.reply.createdAt).toLocaleDateString()}</p>
                </div>
              )}

              {/* Reply button for providers */}
              {isProvider && !review.reply && (
                <div style={{ marginTop: 12 }}>
                  {showReply[review._id] ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <input
                        value={replyText[review._id] || ''}
                        onChange={e => setReplyText({ ...replyText, [review._id]: e.target.value })}
                        placeholder="Write a reply..."
                        style={{ ...inp, flex: 1, fontSize: 13 }}
                        onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button onClick={() => submitReply(review._id)} style={{
                        background: 'linear-gradient(135deg,#0369a1,#0284c7)', color: 'white',
                        border: 'none', borderRadius: 8, padding: '0 16px',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>Reply</button>
                      <button onClick={() => setShowReply({ ...showReply, [review._id]: false })} style={{
                        background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b',
                        borderRadius: 8, padding: '0 12px', fontSize: 13, cursor: 'pointer',
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowReply({ ...showReply, [review._id]: true })} style={{
                      background: 'none', border: 'none', color: '#0369a1',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                      textDecoration: 'underline', textUnderlineOffset: 2,
                    }}>↩ Reply to this review</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}