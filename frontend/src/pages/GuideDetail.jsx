import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StarRating } from '../components/shared';
import toast from 'react-hot-toast';
import ReviewSection from '../components/ReviewSection';

export default function GuideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({ startDate: '', endDate: '', specialRequests: '', numberOfGuests: 1 });
  const [availability, setAvailability] = useState(null);
  const [booking, setBooking] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    api.get(`/guides/${id}`).then(({ data }) => { setGuide(data.guide); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const checkAvailability = async () => {
    if (!bookingForm.startDate || !bookingForm.endDate) return toast.error('Select dates first');
    try {
      const { data } = await api.post('/guides/check-availability', { guideId: id, ...bookingForm });
      setAvailability(data);
      toast[data.available ? 'success' : 'error'](data.available ? 'Guide available!' : 'Not available for these dates');
    } catch (err) { toast.error(err.response?.data?.message || 'Error checking availability'); }
  };

  const handleBook = async () => {
    if (!user) return navigate('/login');
    if (!bookingForm.startDate || !bookingForm.endDate) return toast.error('Select dates');
    setBooking(true);
    try {
      const { data } = await api.post('/bookings', { serviceType: 'guide', guideId: id, ...bookingForm });
      toast.success(`Booking created! Ref: ${data.booking.referenceNumber}`);
      navigate('/bookings');
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setBooking(false); }
  };

  if (loading) return <Spinner />;
  if (!guide) return <p style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Guide not found</p>;

  const days = bookingForm.startDate && bookingForm.endDate
    ? Math.max(1, Math.ceil((new Date(bookingForm.endDate) - new Date(bookingForm.startDate)) / 86400000)) : 0;

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px',
    fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none', width: '100%', transition: 'all 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)', padding: '48px 24px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#fed7aa', marginBottom: 8, textTransform: 'uppercase' }}>Tour Guide</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {guide.profileImage
              ? <img src={guide.profileImage} alt={guide.user?.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '3px solid rgba(255,255,255,0.3)' }}>🧭</div>
            }
            <div>
              <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', color: 'white', marginBottom: 4 }}>{guide.user?.name}</h1>
              <p style={{ color: '#fed7aa', fontSize: 13 }}>{guide.experience} years experience</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StarRating rating={Math.round(guide.averageRating || 0)} />
                <span style={{ fontSize: 12, color: '#fed7aa' }}>({guide.totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-28px auto 0', padding: '0 24px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }} className="guide-grid">
          <style>{`@media(max-width:900px){.guide-grid{grid-template-columns:1fr!important}}`}</style>

          {/* Info */}
          <div>
            {/* About */}
            <div style={{ background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 8px 32px rgba(12,74,110,0.1)', marginBottom: 20, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#0c2340' }}>About</h2>
                <button onClick={() => { if (user) { api.post('/users/wishlist', { serviceType: 'guide', serviceId: id }).then(() => { setWishlisted(true); toast.success('Wishlisted!'); }); } else navigate('/login'); }}
                  style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>{wishlisted ? '❤️' : '🤍'}</button>
              </div>
              {guide.bio && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 16 }}>{guide.bio}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#fef9c3', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, color: '#92400e', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Languages</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#78350f' }}>{guide.languages?.join(', ')}</p>
                </div>
                <div style={{ background: '#fef9c3', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 10, color: '#92400e', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Areas Served</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#78350f' }}>{guide.areasServed?.join(', ')}</p>
                </div>
              </div>
              {guide.certifications?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Certifications</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {guide.certifications.map(c => <span key={c} style={{ background: '#dbeafe', color: '#1e40af', fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 500 }}>🏅 {c}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Tour Packages */}
            {guide.tourPackages?.filter(p => p.isActive).length > 0 && (
              <div style={{ background: 'white', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(12,74,110,0.07)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#0c2340', marginBottom: 18 }}>Tour Packages</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {guide.tourPackages.filter(p => p.isActive).map(pkg => (
                    <div key={pkg._id} style={{ border: '1.5px solid #fde68a', borderRadius: 14, padding: '16px 18px', background: '#fffbeb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <h4 style={{ fontWeight: 700, color: '#78350f', fontSize: 15, marginBottom: 4 }}>{pkg.name}</h4>
                          <p style={{ fontSize: 12, color: '#92400e' }}>{pkg.duration} · Max {pkg.maxGroupSize} people</p>
                          {pkg.description && <p style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>{pkg.description}</p>}
                          {pkg.locations?.length > 0 && <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📍 {pkg.locations.join(' → ')}</p>}
                          {pkg.includes?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {pkg.includes.map(item => <span key={item} style={{ fontSize: 11, background: '#dcfce7', color: '#14532d', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>✓ {item}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <p style={{ fontWeight: 700, color: '#c2410c', fontSize: 15 }}>LKR {pkg.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div style={{ background: 'white', borderRadius: 20, padding: '24px', boxShadow: '0 8px 32px rgba(12,74,110,0.12)', border: '1px solid #f1f5f9', position: 'sticky', top: 88 }}>
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: '#0c2340', marginBottom: 6 }}>Book This Guide</h3>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c2410c', marginBottom: 20 }}>LKR {guide.pricePerDay?.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>/day</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Start Date','startDate',new Date().toISOString().split('T')[0]],['End Date','endDate',bookingForm.startDate||new Date().toISOString().split('T')[0]]].map(([l,k,min]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '0.03em' }}>{l.toUpperCase()}</label>
                  <input type="date" value={bookingForm[k]} min={min}
                    onChange={e => setBookingForm({ ...bookingForm, [k]: e.target.value })} style={inp}
                    onFocus={e => { e.target.style.borderColor = '#c2410c'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '0.03em' }}>GROUP SIZE</label>
                <input type="number" min="1" value={bookingForm.numberOfGuests} onChange={e => setBookingForm({ ...bookingForm, numberOfGuests: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 5, letterSpacing: '0.03em' }}>SPECIAL REQUESTS</label>
                <textarea value={bookingForm.specialRequests} onChange={e => setBookingForm({ ...bookingForm, specialRequests: e.target.value })} rows={2} style={{ ...inp, resize: 'none' }} />
              </div>

              {availability && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: availability.available ? '#dcfce7' : '#fee2e2', color: availability.available ? '#14532d' : '#7f1d1d', fontSize: 13, fontWeight: 500 }}>
                  {availability.available ? '✓ Available for these dates' : '✗ Not available for these dates'}
                </div>
              )}
              {days > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#fef3c7,#fffbeb)', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>Total Estimate</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706' }}>LKR {(guide.pricePerDay * days).toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>{days} day{days > 1 ? 's' : ''}</p>
                </div>
              )}
              <button onClick={checkAvailability} style={{ width: '100%', border: '2px solid #c2410c', color: '#c2410c', background: 'transparent', borderRadius: 10, padding: '11px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >Check Availability</button>
              <button onClick={handleBook} disabled={booking} style={{
                width: '100%', background: booking ? '#94a3b8' : 'linear-gradient(135deg,#7c2d12,#c2410c)',
                color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 14,
                cursor: booking ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                boxShadow: booking ? 'none' : '0 4px 14px rgba(194,65,12,0.35)',
              }}
                onMouseEnter={e => { if (!booking) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >{booking ? 'Booking...' : '🧭 Book Now'}</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, background: 'white', borderRadius: 20, padding: '28px', boxShadow: '0 4px 24px rgba(12,74,110,0.07)', border: '1px solid #f1f5f9' }}>
          <ReviewSection serviceType="guide" serviceId={id} />
        </div>
      </div>
    </div>
  );
}