import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Spinner, Pagination, StarRating, ServiceImage } from '../components/shared';
import { useTranslation } from 'react-i18next';

export default function Guides() {
  const { t } = useTranslation();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ language: '', area: '', minPrice: '', maxPrice: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/guides', { params: { page, limit: 12, ...filters } });
      setGuides(data.guides);
      setPages(data.pages);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchGuides(); }, [page, filters]);

  const inp = {
    border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px',
    fontSize: 14, fontFamily: 'inherit', background: 'white', outline: 'none',
    transition: 'all 0.2s', width: '100%',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#7c2d12 0%,#c2410c 45%,#ea580c 100%)',
        padding: '60px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(253,230,138,0.08)', pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          position: 'relative', zIndex: 1,
          textAlign: 'center',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 20,
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{ fontSize: 12 }}>🧭</span>
            <span style={{ fontSize: 11, color: '#fed7aa', letterSpacing: '0.08em', fontWeight: 700 }}>BROWSE TOUR GUIDES</span>
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display",serif',
            fontSize: 'clamp(2rem,5vw,3.2rem)',
            color: 'white', marginBottom: 14, lineHeight: 1.2,
          }}>
            Expert Tour <em style={{ color: '#fde68a', fontStyle: 'normal' }}>Guides</em>
          </h1>
          <p style={{
            color: '#fed7aa', fontSize: 16,
            maxWidth: 520, lineHeight: 1.7,
            margin: '0 auto', textAlign: 'center',
          }}>
            Discover Sri Lanka with passionate local experts who know every hidden gem.
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: '-36px auto 0',
        padding: '0 24px 60px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── Filter Card ── */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '24px 28px',
          boxShadow: '0 12px 40px rgba(124,45,18,0.14)',
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.8)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
        }}>
          <div style={{ fontSize: 20, alignSelf: 'center', marginRight: 4 }}>🔍</div>

          {/* Language */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: '#64748b', marginBottom: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Language</label>
            <input
              value={filters.language}
              onChange={e => setFilters({ ...filters, language: e.target.value })}
              placeholder="e.g. English"
              style={inp}
              onFocus={e => { e.target.style.borderColor = '#c2410c'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Area */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: '#64748b', marginBottom: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Area</label>
            <input
              value={filters.area}
              onChange={e => setFilters({ ...filters, area: e.target.value })}
              placeholder="e.g. Galle"
              style={inp}
              onFocus={e => { e.target.style.borderColor = '#c2410c'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Min Price */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: '#64748b', marginBottom: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Min Price/Day</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0"
              style={inp}
              onFocus={e => { e.target.style.borderColor = '#c2410c'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Max Price */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: '#64748b', marginBottom: 8,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Max Price/Day</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="Any"
              style={inp}
              onFocus={e => { e.target.style.borderColor = '#c2410c'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-end' }}>
            <button
              onClick={() => { setPage(1); fetchGuides(); }}
              style={{
                background: 'linear-gradient(135deg,#7c2d12,#c2410c)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '11px 22px', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(194,65,12,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(194,65,12,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(194,65,12,0.35)'; }}
            >Filter</button>
            <button
              onClick={() => { setFilters({ language: '', area: '', minPrice: '', maxPrice: '' }); setPage(1); }}
              style={{
                background: 'white', color: '#64748b',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '11px 18px', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
            >Clear</button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? <Spinner /> : guides.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            background: 'white', borderRadius: 20,
            boxShadow: '0 4px 20px rgba(124,45,18,0.07)',
            border: '1px solid #f1f5f9',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🧭</div>
            <p style={{ color: '#94a3b8', fontSize: 16, margin: 0 }}>No guides found.</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {guides.map(g => (
                <Link key={g._id} to={`/guides/${g._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{
                      background: 'white', borderRadius: 18, overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(124,45,18,0.08)',
                      border: '1.5px solid #f1f5f9',
                      transition: 'all 0.25s',
                      height: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,45,18,0.16)';
                      e.currentTarget.style.borderColor = '#fdba74';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,45,18,0.08)';
                      e.currentTarget.style.borderColor = '#f1f5f9';
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                      {g.profileImage
                        ? <img src={g.profileImage} alt={g.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fef3c7,#fed7aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>🧭</div>
                      }

                      {/* Name overlay */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                        padding: '28px 16px 14px',
                      }}>
                        <div style={{
                          color: 'white', fontFamily: '"Playfair Display",serif',
                          fontSize: '1.1rem', fontWeight: 700,
                        }}>{g.user?.name}</div>
                      </div>

                      {/* Price ribbon */}
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'linear-gradient(135deg,#7c2d12,#c2410c)',
                        color: 'white', fontSize: 12, fontWeight: 700,
                        padding: '5px 12px', borderRadius: 999,
                        boxShadow: '0 2px 8px rgba(124,45,18,0.35)',
                      }}>
                        LKR {g.pricePerDay?.toLocaleString()}
                        <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 10 }}>/day</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px 20px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>🌍 {g.languages?.slice(0, 3).join(', ')}</p>
                          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>📍 {g.areasServed?.slice(0, 2).join(', ')}</p>
                        </div>
                        <div style={{
                          textAlign: 'center',
                          background: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
                          borderRadius: 10, padding: '6px 12px',
                          border: '1px solid #fed7aa',
                          minWidth: 56,
                        }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Experience</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#7c2d12', lineHeight: 1 }}>
                            {g.experience}
                            <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}> yrs</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StarRating rating={Math.round(g.averageRating || 0)} />
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>({g.totalReviews})</span>
                        {g.tourPackages?.filter(p => p.isActive).length > 0 && (
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: 10, background: '#fef3c7', color: '#92400e',
                            padding: '3px 9px', borderRadius: 6,
                            border: '1px solid #fde68a', fontWeight: 600,
                          }}>
                            {g.tourPackages.filter(p => p.isActive).length} packages
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div style={{
                      borderTop: '1px solid #f1f5f9',
                      padding: '12px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#fffaf7',
                    }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>View Profile</span>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#fef3c7,#fed7aa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#7c2d12',
                      }}>→</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}