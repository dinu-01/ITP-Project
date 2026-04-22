import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, StarRating } from '../components/shared';
import toast from 'react-hot-toast';

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchBooking = () => {
    api.get(`/bookings/${id}`)
      .then(({ data }) => { setBooking(data.booking); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  const fetchExistingReview = async () => {
    try {
      const { data } = await api.get('/reviews/my');
      const found = (data.reviews || []).find(r => {
        const rBooking = r.booking?._id || r.booking;
        return rBooking === id;
      });
      setExistingReview(found || null);
    } catch { }
  };

  useEffect(() => { fetchBooking(); }, [id]);
  useEffect(() => { if (user?.role === 'tourist') fetchExistingReview(); }, [id, user]);

  const downloadPDF = async () => {
    try {
      const res = await api.get(`/bookings/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `booking-${booking.referenceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download'); }
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) return toast.error('Please write a review comment');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { bookingId: id, ...reviewForm });
      toast.success('Review submitted!');
      fetchBooking();
      fetchExistingReview();
      setShowReviewForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit review'); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <Spinner />;
  if (!booking) return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={{ color: '#64748b', fontSize: 16 }}>Booking not found</p>
      </div>
    </div>
  );

  const isTourist = user?._id === booking.tourist?._id;
  const days = booking.startDate && booking.endDate
    ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 0;

  const sectionTitle = (text) => (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
      color: '#64748b', textTransform: 'uppercase', marginBottom: 14, margin: '0 0 14px',
    }}>{text}</p>
  );

  const infoRow = (label, value, highlight) => (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: highlight ? 700 : 500, color: highlight ? '#0369a1' : '#0f172a', margin: 0, fontSize: highlight ? 16 : 14 }}>{value}</p>
    </div>
  );

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px',
    fontSize: 14, fontFamily: 'inherit', width: '100%',
    transition: 'all 0.2s', background: 'white', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#0c4a6e,#0369a1)',
        padding: '40px 24px 64px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => navigate('/bookings')} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: 8, padding: '6px 14px',
            fontSize: 13, cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >← Back to Bookings</button>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#bae6fd', marginBottom: 8, textTransform: 'uppercase' }}>Booking Details</div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.9rem', color: 'white', marginBottom: 6 }}>
            {booking.referenceNumber}
          </h1>
          <p style={{ color: '#bae6fd', fontSize: 14, textTransform: 'capitalize' }}>
            {booking.serviceType} Booking
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '-28px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Status & Actions bar */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '16px 22px',
          boxShadow: '0 8px 32px rgba(12,74,110,0.12)',
          marginBottom: 20, border: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={downloadPDF} style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              color: '#64748b', borderRadius: 8, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#0369a1'; e.currentTarget.style.color = '#0369a1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
            >📄 Download PDF</button>
            {isTourist && booking.status === 'Completed' && !existingReview && (
              <button onClick={() => setShowReviewForm(f => !f)} style={{
                background: 'linear-gradient(135deg,#fde68a,#f97316)', color: '#7c2d12',
                border: 'none', borderRadius: 8, padding: '7px 16px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)', transition: 'all 0.2s',
              }}>⭐ Write Review</button>
            )}
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(12,74,110,0.08)', border: '1px solid #f1f5f9',
        }}>

          {/* Tourist Info */}
          <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
            {sectionTitle('👤 Tourist Information')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {infoRow('Name', booking.tourist?.name)}
              {infoRow('Email', booking.tourist?.email)}
              {booking.tourist?.phone && infoRow('Phone', booking.tourist.phone)}
            </div>
          </div>

          {/* Booking Dates */}
          <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
            {sectionTitle('📅 Booking Dates & Details')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {infoRow('Check-in', new Date(booking.startDate).toDateString())}
              {infoRow('Check-out', new Date(booking.endDate).toDateString())}
              {infoRow('Duration', `${days} day${days > 1 ? 's' : ''}`)}
              {infoRow('Guests', booking.numberOfGuests)}
              {booking.numberOfRooms > 1 && infoRow('Rooms', booking.numberOfRooms)}
              {infoRow('Total Price', `LKR ${booking.totalPrice?.toLocaleString()}`, true)}
            </div>
            {booking.roomType && (
              <div style={{ marginTop: 12 }}>
                <span style={{
                  background: '#e0f2fe', color: '#0369a1',
                  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                }}>Room: {booking.roomType}</span>
              </div>
            )}
            {booking.specialRequests && (
              <div style={{
                marginTop: 14, background: '#fff7ed',
                border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>💬 Special Requests</p>
                <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.6 }}>{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Hotel Details */}
          {booking.hotel && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
              {sectionTitle('🏨 Hotel Details')}
              <div style={{ background: '#eff6ff', borderRadius: 14, padding: '16px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0c2340', margin: '0 0 10px' }}>{booking.hotel.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {booking.hotel.address && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>📍 {booking.hotel.address}</p>}
                  {booking.hotel.location && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{booking.hotel.location}</p>}
                  {booking.hotel.phone && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>📞 {booking.hotel.phone}</p>}
                  {booking.hotel.mapLink && (
                    <a href={booking.hotel.mapLink} target="_blank" rel="noreferrer" style={{
                      color: '#0369a1', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    }}>🗺️ View on Google Maps →</a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Details */}
          {booking.vehicle && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
              {sectionTitle('🚗 Vehicle Details')}
              <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '16px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0c2340', margin: '0 0 10px' }}>{booking.vehicle.brand} {booking.vehicle.model}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[`Type: ${booking.vehicle.type}`, `Reg: ${booking.vehicle.registrationNumber}`].map(tag => (
                    <span key={tag} style={{ background: '#dcfce7', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Guide Details */}
          {booking.guide && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
              {sectionTitle('🧭 Tour Guide Details')}
              <div style={{ background: '#fefce8', borderRadius: 14, padding: '16px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0c2340', margin: '0 0 10px' }}>{booking.guide.user?.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {booking.guide.user?.email && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>✉️ {booking.guide.user.email}</p>}
                  {booking.guide.user?.phone && <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>📞 {booking.guide.user.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Package Details */}
          {booking.serviceType === 'package' && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9' }}>
              {sectionTitle('🎒 Package Components')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {booking.packageHotel && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#eff6ff', borderRadius: 12, padding: '12px 16px',
                  }}>
                    <span style={{ fontSize: 14, color: '#0c2340' }}><strong>🏨 Hotel:</strong> {booking.packageHotel?.name || 'Hotel included'}</span>
                    <StatusBadge status={booking.packageHotelStatus || 'Pending'} />
                  </div>
                )}
                {booking.packageVehicle && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f0fdf4', borderRadius: 12, padding: '12px 16px',
                  }}>
                    <span style={{ fontSize: 14, color: '#0c2340' }}><strong>🚗 Vehicle:</strong> {booking.packageVehicle?.brand ? `${booking.packageVehicle.brand} ${booking.packageVehicle.model}` : 'Vehicle included'}</span>
                    <StatusBadge status={booking.packageVehicleStatus || 'Pending'} />
                  </div>
                )}
                {booking.packageGuide && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fefce8', borderRadius: 12, padding: '12px 16px',
                  }}>
                    <span style={{ fontSize: 14, color: '#0c2340' }}><strong>🧭 Guide:</strong> {booking.packageGuide?.user?.name || 'Guide included'}</span>
                    <StatusBadge status={booking.packageGuideStatus || 'Pending'} />
                  </div>
                )}
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Each component is confirmed individually by their provider.</p>
              </div>
            </div>
          )}

          {/* Review section */}
          {isTourist && booking.status === 'Completed' && !existingReview && showReviewForm && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.1rem', color: '#0c2340', marginBottom: 18, marginTop: 0 }}>⭐ Leave a Review</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Rating</label>
                  <StarRating rating={reviewForm.rating} onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your Review</label>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience with future travellers..."
                    rows={3} style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = '#0369a1'; e.target.style.boxShadow = '0 0 0 3px rgba(3,105,161,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={submitReview} disabled={submittingReview} style={{
                    background: submittingReview ? '#94a3b8' : 'linear-gradient(135deg,#0369a1,#0284c7)',
                    color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px',
                    fontSize: 14, fontWeight: 600, cursor: submittingReview ? 'not-allowed' : 'pointer',
                    boxShadow: submittingReview ? 'none' : '0 4px 14px rgba(3,105,161,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {submittingReview ? 'Submitting...' : '✓ Submit Review'}
                  </button>
                  <button onClick={() => setShowReviewForm(false)} style={{
                    background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b',
                    borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {isTourist && booking.status === 'Completed' && existingReview && (
            <div style={{ padding: '24px 26px', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <p style={{ fontWeight: 600, color: '#065f46', fontSize: 14, margin: 0 }}>You've reviewed this booking</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
                <StarRating rating={existingReview.rating} />
                <p style={{ fontSize: 14, color: '#374151', margin: '10px 0 6px', lineHeight: 1.6 }}>{existingReview.comment}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{new Date(existingReview.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <div style={{ padding: '16px 26px' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              Booked on: {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}