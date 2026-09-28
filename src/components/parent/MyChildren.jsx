import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParentSidebar } from './ParentSidebar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './MyChildren.css'

export function MyChildren() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [children, setChildren] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildren()
  }, [user])

  const loadChildren = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (parent) {
        const { data: kids } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', parent.id)
        setChildren(kids || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Parent'

  const list = children.length
    ? children.map((c, i) => ({
        id: c.id,
        full_name: c.full_name,
        grade: c.grade,
        school: c.school_name || 'Riverside Primary School',
        dob: c.date_of_birth || '2012-03-12',
        gender: c.gender || (i % 2 === 0 ? 'Female' : 'Male'),
        student_no: c.student_number || `RP${123456 + i}`,
        status: i === 0 ? 'active' : 'pending',
        photo:
          i === 0
            ? 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop',
      }))
    : [
        {
          id: 'demo1',
          full_name: 'Naledi Mokoena',
          grade: 8,
          school: 'Riverside Primary School',
          dob: '2012-03-12',
          gender: 'Female',
          student_no: 'RP123456',
          status: 'active',
          photo:
            'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop',
        },
        {
          id: 'demo2',
          full_name: 'Sipho Mokoena',
          grade: 6,
          school: 'Greenwood High School',
          dob: '2014-07-08',
          gender: 'Male',
          student_no: 'GH654321',
          status: 'pending',
          photo:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop',
        },
      ]

  const filtered = list.filter((c) => {
    if (activeTab === 'active') return c.status === 'active'
    if (activeTab === 'inactive') return c.status === 'inactive'
    return true
  })

  return (
    <div className="pd-layout">
      <ParentSidebar />

      <main className="pd-main">
        {/* Topbar */}
        <div className="pd-topbar">
          <div className="mc-search">
            <span className="mc-search__icon">🔍</span>
            <input
              className="mc-search__input"
              type="text"
              placeholder="Search for anything..."
            />
          </div>

          <button className="pd-topbar__bell">
            🔔<span className="pd-topbar__bell-badge">2</span>
          </button>

          <div
            className="pd-topbar__user"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              className="pd-topbar__avatar"
              src="https://i.pravatar.cc/100?img=32"
              alt=""
            />
            <div className="pd-topbar__info">
              <div className="pd-topbar__name">{displayName}</div>
              <div className="pd-topbar__role">Parent</div>
            </div>
            <span className="pd-topbar__chevron">▾</span>

            {menuOpen && (
              <div className="pd-topbar__menu">
                <button onClick={() => navigate('/profile')}>👤 Profile</button>
                <button onClick={() => navigate('/')}>🚪 Log out</button>
              </div>
            )}
          </div>
        </div>

        {/* Hero banner */}
        <section className="mc-hero">
          <div className="mc-hero__text">
            <div className="mc-hero__icon">👥</div>
            <div>
              <h1 className="mc-hero__title">My Children</h1>
              <p className="mc-hero__sub">
                View your children's profiles, applications, school progress
                and important updates — all in one place.
              </p>
            </div>
          </div>
          <button
            className="mc-hero__btn"
            onClick={() => navigate('/add-child')}
          >
            + Add Child
          </button>
        </section>

        {/* Tabs */}
        <div className="mc-tabs">
          <button
            className={`mc-tab ${activeTab === 'all' ? 'mc-tab--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📄 All Children ({list.length})
          </button>
          <button
            className={`mc-tab ${activeTab === 'applications' ? 'mc-tab--active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📄 Applications ({list.length})
          </button>
          <button
            className={`mc-tab ${activeTab === 'active' ? 'mc-tab--active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            ✅ Active ({list.filter((c) => c.status === 'active').length})
          </button>
          <button
            className={`mc-tab ${activeTab === 'inactive' ? 'mc-tab--active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            ⏱ Inactive ({list.filter((c) => c.status === 'inactive').length})
          </button>
        </div>

        {/* Children list */}
        <div className="mc-list">
          {loading ? (
            <div className="mc-loading">Loading...</div>
          ) : (
            filtered.map((child) => {
              const isOpen = expandedId === child.id
              const statusClass =
                child.status === 'active'
                  ? 'mc-status--active'
                  : 'mc-status--pending'

              return (
                <article
                  key={child.id}
                  className={`mc-card ${isOpen ? 'mc-card--open' : ''}`}
                >
                  <div className="mc-card__top">
                    <img
                      className="mc-card__photo"
                      src={child.photo}
                      alt={child.full_name}
                    />

                    <div className="mc-card__body">
                      <div className="mc-card__header">
                        <h2 className="mc-card__name">{child.full_name}</h2>
                        <span className={`mc-status ${statusClass}`}>
                          {child.status === 'active'
                            ? '✓ Active'
                            : '⏱ Pending Application'}
                        </span>
                      </div>

                      <p className="mc-card__school">
                        Grade {child.grade} &nbsp;•&nbsp; {child.school}
                      </p>

                      <div className="mc-card__meta">
                        <div className="mc-meta">
                          <span className="mc-meta__icon">📅</span>
                          <div>
                            <div className="mc-meta__label">Date of Birth</div>
                            <div className="mc-meta__value">
                              {new Date(child.dob).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mc-meta">
                          <span className="mc-meta__icon">👤</span>
                          <div>
                            <div className="mc-meta__label">Gender</div>
                            <div className="mc-meta__value">{child.gender}</div>
                          </div>
                        </div>

                        <div className="mc-meta">
                          <span className="mc-meta__icon">🆔</span>
                          <div>
                            <div className="mc-meta__label">Student No.</div>
                            <div className="mc-meta__value">
                              {child.student_no}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="mc-card__toggle"
                      onClick={() => setExpandedId(isOpen ? null : child.id)}
                      aria-label="Toggle details"
                    >
                      {isOpen ? '⌃' : '⌄'}
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="mc-card__expanded">
                      <div className="mc-subtabs">
                        {['Overview', 'Applications', 'Academic Progress', 'Documents'].map(
                          (t, i) => (
                            <button
                              key={t}
                              className={`mc-subtab ${i === 0 ? 'mc-subtab--active' : ''}`}
                            >
                              {t}
                            </button>
                          )
                        )}
                      </div>

                      <div className="mc-card__expanded-grid">
                        <div className="mc-expand-left">
                          <div className="mc-info-box">
                            <span className="mc-info-box__icon mc-info-box__icon--blue">
                              🏫
                            </span>
                            <div>
                              <div className="mc-info-box__label">
                                Current School
                              </div>
                              <div className="mc-info-box__value">
                                {child.school}
                              </div>
                            </div>
                            <span className="mc-info-box__chevron">›</span>
                          </div>

                          <div className="mc-info-box">
                            <span className="mc-info-box__icon mc-info-box__icon--green">
                              ✓
                            </span>
                            <div>
                              <div className="mc-info-box__label">
                                Next Important Date
                              </div>
                              <div className="mc-info-box__value">
                                School Fees Due
                              </div>
                              <div className="mc-info-box__sub">30 Sep 2025</div>
                            </div>
                          </div>
                        </div>

                        <div className="mc-expand-right">
                          {[
                            { icon: '👤', label: 'View Profile' },
                            { icon: '📄', label: 'View Applications' },
                            { icon: '📈', label: 'View Academic Progress' },
                            { icon: '✉️', label: 'Message School' },
                            { icon: '📁', label: 'Upload Documents' },
                          ].map((a) => (
                            <button key={a.label} className="mc-action-row">
                              <span className="mc-action-row__icon">
                                {a.icon}
                              </span>
                              <span className="mc-action-row__label">
                                {a.label}
                              </span>
                              <span className="mc-action-row__chevron">›</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mc-card__collapsed-action">
                      <button
                        className="mc-view-btn"
                        onClick={() => setExpandedId(child.id)}
                      >
                        View Details →
                      </button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}