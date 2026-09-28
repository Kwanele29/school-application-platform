import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ParentSidebar } from './ParentSidebar'
import './ParentDashboard.css'

export function ParentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [children, setChildren] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      setProfile(parent)

      if (parent) {
        const { data: kids } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', parent.id)

        setChildren(kids || [])

        if (kids?.length) {
          const { data: apps } = await supabase
            .from('applications')
            .select(`*, schools (name, location), children (full_name)`)
            .in('child_id', kids.map((k) => k.id))
          setApplications(apps || [])
        }

        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('parent_id', parent.id)
          .order('sent_at', { ascending: false })
          .limit(5)

        setNotifications(notifs || [])
      }
    } catch (err) {
      console.error('Parent dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayName =
    profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : user?.user_metadata?.full_name || 'Parent'

  const unreadCount = notifications.filter((n) => !n.read).length

  // Demo fallback if DB is empty
  const demoChildren = children.length
    ? children
    : [
        {
          id: 'demo1',
          full_name: 'Sipho Mokoena',
          grade: 6,
          badge: 'Application Submitted',
          school: 'Riverside Primary School',
          avatar: 'https://i.pravatar.cc/100?img=15',
        },
        {
          id: 'demo2',
          full_name: 'Naledi Mokoena',
          grade: 8,
          badge: 'Application In Progress',
          school: 'Greenwood High School',
          avatar: 'https://i.pravatar.cc/100?img=47',
        },
      ]

  const quickActions = [
    { cls: 'purple', icon: '📝', label: 'Apply for School' },
    { cls: 'green',  icon: '📄', label: 'View Applications' },
    { cls: 'blue',   icon: '👤', label: 'Update Profile' },
    { cls: 'pink',   icon: '📁', label: 'Upload Documents' },
    { cls: 'orange', icon: '✉️', label: 'Messages' },
    { cls: 'teal',   icon: '❓', label: 'Need Help?' },
  ]

  const upcomingEvents = [
    { day: '20', month: 'SEP', title: 'School Open Day', school: 'Riverside Primary School', time: '09:00 AM – 12:00 PM' },
    { day: '25', month: 'SEP', title: 'Parent Meeting', school: 'Greenwood High School', time: '04:00 PM – 05:30 PM' },
    { day: '01', month: 'OCT', title: 'Application Deadline', school: 'High School Applications', time: '11:59 PM' },
  ]

  const recentUpdates = [
    { cls: 'green',  icon: '📄', title: 'Application Status Update', text: "Your application for Riverside Primary School has been submitted.", date: '12 Sep 2025' },
    { cls: 'purple', icon: '🔔', title: 'School Announcement', text: 'Open Day at Riverside Primary School – 20 Sep 2025', date: '10 Sep 2025' },
    { cls: 'blue',   icon: '✉️', title: 'New Message', text: 'You have a new message from Riverside Primary School.', date: '08 Sep 2025' },
  ]

  return (
    <div className="pd-layout">
      <ParentSidebar />

      <main className="pd-main">
        {/* Topbar */}
        <div className="pd-topbar">
          <button className="pd-topbar__bell" aria-label="Notifications">
            🔔
            {unreadCount > 0 && (
              <span className="pd-topbar__bell-badge">{unreadCount}</span>
            )}
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

        {/* Welcome banner */}
        <section className="pd-welcome">
          <div className="pd-welcome__text">
            <div className="pd-welcome__sparkle">✨</div>
            <p className="pd-welcome__greeting">Welcome back,</p>
            <h1 className="pd-welcome__name">{displayName}!</h1>
            <p className="pd-welcome__sub">
              Here's an overview of your children's applications, updates and
              school information.
            </p>
          </div>
          <img
            className="pd-welcome__image"
            src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop"
            alt=""
          />
        </section>

        <div className="pd-grid">
          {/* ============ LEFT ============ */}
          <div className="pd-grid__left">
            {/* Stats */}
            <div className="pd-stats">
              <div className="pd-stat pd-stat--blue">
                <div className="pd-stat__icon">👥</div>
                <div className="pd-stat__label">My Children</div>
                <div className="pd-stat__value">{demoChildren.length}</div>
                <div className="pd-stat__hint">Children linked to your account</div>
                <div className="pd-stat__arrow">›</div>
              </div>
              <div className="pd-stat pd-stat--green">
                <div className="pd-stat__icon">📄</div>
                <div className="pd-stat__label">Applications</div>
                <div className="pd-stat__value">{applications.length || 1}</div>
                <div className="pd-stat__hint">Active application</div>
                <div className="pd-stat__arrow">›</div>
              </div>
              <div className="pd-stat pd-stat--purple">
                <div className="pd-stat__icon">✉️</div>
                <div className="pd-stat__label">Messages</div>
                <div className="pd-stat__value">{unreadCount || 2}</div>
                <div className="pd-stat__hint">Unread messages</div>
                <div className="pd-stat__arrow">›</div>
              </div>
              <div className="pd-stat pd-stat--orange">
                <div className="pd-stat__icon">🏫</div>
                <div className="pd-stat__label">Schools</div>
                <div className="pd-stat__value">3</div>
                <div className="pd-stat__hint">Schools you've saved</div>
                <div className="pd-stat__arrow">›</div>
              </div>
            </div>

            {/* My Children */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2 className="pd-card__title">My Children</h2>
                <button
                  className="pd-card__link"
                  onClick={() => navigate('/my-children')}
                >
                  View All
                </button>
              </div>

              {demoChildren.map((child, i) => (
                <div key={child.id} className="pd-child">
                  <img
                    className="pd-child__avatar"
                    src={child.avatar || `https://i.pravatar.cc/100?img=${20 + i}`}
                    alt=""
                  />
                  <div className="pd-child__info">
                    <h3 className="pd-child__name">{child.full_name}</h3>
                    <p className="pd-child__grade">Grade {child.grade}</p>
                    <span
                      className={`pd-child__badge ${
                        child.badge?.includes('Submitted')
                          ? 'pd-child__badge--submitted'
                          : 'pd-child__badge--progress'
                      }`}
                    >
                      {child.badge || 'Application Submitted'}
                    </span>
                    <p className="pd-child__school">
                      {child.school || 'Riverside Primary School'}
                    </p>
                  </div>
                  <button
                    className="pd-child__cta"
                    onClick={() => navigate('/my-children')}
                  >
                    View Details <span aria-hidden="true">→</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Updates */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2 className="pd-card__title">Recent Updates</h2>
              </div>
              {recentUpdates.map((u) => (
                <div key={u.title} className="pd-update">
                  <div className={`pd-update__icon pd-update__icon--${u.cls}`}>
                    {u.icon}
                  </div>
                  <div className="pd-update__info">
                    <p className="pd-update__title">{u.title}</p>
                    <p className="pd-update__text">{u.text}</p>
                    <p className="pd-update__date">{u.date}</p>
                  </div>
                  <span className="pd-update__chevron">›</span>
                </div>
              ))}
            </div>

            {/* Help */}
            <div className="pd-help">
              <div className="pd-help__icon">🎧</div>
              <div className="pd-help__info">
                <p className="pd-help__title">Need help?</p>
                <p className="pd-help__text">
                  Our support team is here to assist you with any questions or
                  concerns.
                </p>
              </div>
              <button className="pd-help__btn">
                Contact Support <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* ============ RIGHT ============ */}
          <div className="pd-grid__right">
            {/* Quick Actions */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2 className="pd-card__title">Quick Actions</h2>
              </div>
              <div className="pd-quick">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    className={`pd-quick__btn pd-quick__btn--${a.cls}`}
                  >
                    <span className="pd-quick__icon">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="pd-card">
              <div className="pd-card__header">
                <h2 className="pd-card__title">📅 Upcoming Events</h2>
                <button className="pd-card__link">View All</button>
              </div>

              {upcomingEvents.map((e) => (
                <div key={e.title} className="pd-event">
                  <div className="pd-event__date">
                    <div className="pd-event__day">{e.day}</div>
                    <div className="pd-event__month">{e.month}</div>
                  </div>
                  <div className="pd-event__info">
                    <p className="pd-event__title">{e.title}</p>
                    <p className="pd-event__school">{e.school}</p>
                    <p className="pd-event__time">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo */}
            <div className="pd-promo">
              <div className="pd-promo__icon">☀️</div>
              <h3 className="pd-promo__title">
                Your child's future starts with the right school.
              </h3>
              <button className="pd-promo__btn">
                Explore Schools <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}