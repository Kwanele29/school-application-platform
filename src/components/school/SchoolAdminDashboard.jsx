import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './SchoolAdminDashboard.css'

const NAV = [
  { icon: '🏠', label: 'Dashboard',     path: '/school' },
  { icon: '📄', label: 'Applications',  path: '/school/applications' },
  { icon: '🎓', label: 'Students',      path: '/school/students' },
  { icon: '📢', label: 'Announcements', path: '/school/announcements' },
  { icon: '📅', label: 'Meetings',      path: '/school/meetings' },
  { icon: '✉️', label: 'Messages',      path: '/school/messages', badge: 2 },
  { icon: '⚙️', label: 'Settings',      path: '/school/settings' },
]

export function SchoolAdminDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [school, setSchool] = useState(null)
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadSchoolData()
  }, [user])

  const loadSchoolData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: admin } = await supabase
        .from('school_admins')
        .select('school_id, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!admin) {
        setLoading(false)
        return
      }

      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', admin.school_id)
        .maybeSingle()

      setSchool(schoolData)

      const { data: apps } = await supabase
        .from('applications')
        .select(`
          *,
          children (full_name, date_of_birth, grade, gender),
          parents (id, first_name, last_name, user_id)
        `)
        .eq('school_id', admin.school_id)
        .order('created_at', { ascending: false })

      setApplications(apps || [])

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('school_id', admin.school_id)
        .order('sent_at', { ascending: false })
        .limit(5)

      setNotifications(notifs || [])
    } catch (err) {
      console.error('School dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId, status) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select(`
          *,
          children (full_name, parent_id)
        `)
        .single()

      if (error) throw error

      if (data && school) {
        await supabase.from('notifications').insert([
          {
            parent_id: data.children.parent_id,
            school_id: school.id,
            application_id: data.id,
            type: status === 'accepted' ? 'acceptance' : 'update',
            subject: `Application ${status}: ${school.name}`,
            message: `Your child's application to ${school.name} has been ${status}.`,
          },
        ])
      }

      await loadSchoolData()
    } catch (err) {
      alert('Error updating application: ' + err.message)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'

  const statusBadge = (status) => {
    if (status === 'accepted') return { label: '✓ Accepted', cls: 'sad-badge--accepted' }
    if (status === 'rejected') return { label: '✕ Rejected', cls: 'sad-badge--rejected' }
    return { label: '⏱ Pending', cls: 'sad-badge--pending' }
  }

  if (loading) {
    return <div className="sad-loading">Loading school dashboard...</div>
  }

  if (!school) {
    return (
      <div className="sad-empty">
        <p>No school linked to your account. Please contact support.</p>
        <button onClick={handleLogout} className="sad-btn sad-btn--ghost">
          Log out
        </button>
      </div>
    )
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length

  return (
    <div className="sad-layout">
      {/* ============= SIDEBAR ============= */}
      <aside className="sad-sidebar">
        <div className="sad-sidebar__brand">
          <div className="sad-sidebar__brand-icon">🏫</div>
          <div className="sad-sidebar__brand-text">
            {school.name}
            <br />
            <span className="sad-sidebar__brand-role">School Admin</span>
          </div>
        </div>

        <nav className="sad-sidebar__nav">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`sad-nav-item ${
                item.path === '/school' ? 'sad-nav-item--active' : ''
              }`}
            >
              <span className="sad-nav-item__icon">{item.icon}</span>
              <span className="sad-nav-item__label">{item.label}</span>
              {item.badge && (
                <span className="sad-nav-item__badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="sad-sidebar__logout" onClick={handleLogout}>
          <span className="sad-sidebar__logout-icon">🚪</span>
          <span>Log out</span>
        </button>

        <div className="sad-sidebar__footer">
          <div className="sad-sidebar__footer-text">
            Verification:
            <br />
            <span
              className={`sad-sidebar__status sad-sidebar__status--${school.verification_status}`}
            >
              {school.verification_status}
            </span>
          </div>
        </div>
      </aside>

      {/* ============= MAIN ============= */}
      <main className="sad-main">
        {/* Topbar */}
        <div className="sad-topbar">
          <div className="sad-topbar__left">
            <h1 className="sad-topbar__title">
              {activeTab === 'dashboard' ? 'Dashboard' : 'School Admin'}
            </h1>
          </div>

          <button className="sad-topbar__bell">
            🔔
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="sad-topbar__bell-badge">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          <div
            className="sad-topbar__user"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="sad-topbar__avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="sad-topbar__info">
              <div className="sad-topbar__name">{displayName}</div>
              <div className="sad-topbar__role">School Admin</div>
            </div>
            <span className="sad-topbar__chevron">▾</span>

            {menuOpen && (
              <div className="sad-topbar__menu">
                <button onClick={() => navigate('/school/settings')}>
                  ⚙️ Settings
                </button>
                <button onClick={handleLogout}>🚪 Log out</button>
              </div>
            )}
          </div>
        </div>

        {/* Welcome banner */}
        <section className="sad-welcome">
          <div className="sad-welcome__text">
            <p className="sad-welcome__greeting">Welcome back,</p>
            <h2 className="sad-welcome__name">{displayName}!</h2>
            <p className="sad-welcome__sub">
              Here's what's happening at {school.name} today.
            </p>
          </div>
          <div className="sad-welcome__visual">
            <div className="sad-welcome__visual-icon">🏫</div>
          </div>
        </section>

        {/* Stats */}
        <div className="sad-stats">
          <div className="sad-stat sad-stat--blue">
            <div className="sad-stat__icon">📄</div>
            <div className="sad-stat__label">Total Applications</div>
            <div className="sad-stat__value">{applications.length}</div>
          </div>
          <div className="sad-stat sad-stat--orange">
            <div className="sad-stat__icon">⏱</div>
            <div className="sad-stat__label">Pending Review</div>
            <div className="sad-stat__value">{pendingCount}</div>
          </div>
          <div className="sad-stat sad-stat--green">
            <div className="sad-stat__icon">✓</div>
            <div className="sad-stat__label">Accepted</div>
            <div className="sad-stat__value">{acceptedCount}</div>
          </div>
          <div className="sad-stat sad-stat--red">
            <div className="sad-stat__icon">✕</div>
            <div className="sad-stat__label">Rejected</div>
            <div className="sad-stat__value">{rejectedCount}</div>
          </div>
        </div>

        {/* School status card */}
        <section className="sad-card">
          <div className="sad-card__header">
            <h3 className="sad-card__title">School Profile</h3>
            <button
              className="sad-card__link"
              onClick={() => navigate('/school/settings')}
            >
              Edit →
            </button>
          </div>

          <div className="sad-profile-grid">
            <div>
              <div className="sad-profile-label">Name</div>
              <div className="sad-profile-value">{school.name}</div>
            </div>
            <div>
              <div className="sad-profile-label">EMIS Number</div>
              <div className="sad-profile-value">{school.emis_number || '—'}</div>
            </div>
            <div>
              <div className="sad-profile-label">Location</div>
              <div className="sad-profile-value">{school.location || '—'}</div>
            </div>
            <div>
              <div className="sad-profile-label">Verification</div>
              <div>
                <span
                  className={`sad-badge sad-badge--${school.verification_status}`}
                >
                  {school.verification_status}
                </span>
              </div>
            </div>
            <div>
              <div className="sad-profile-label">Applications Open</div>
              <div className="sad-profile-value">
                {school.open_applications ? '🟢 Yes' : '⚪ Closed'}
              </div>
            </div>
            <div>
              <div className="sad-profile-label">Deadline</div>
              <div className="sad-profile-value">
                {school.application_deadline
                  ? new Date(school.application_deadline).toLocaleDateString(
                      'en-GB',
                      { day: '2-digit', month: 'short', year: 'numeric' }
                    )
                  : '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Applications */}
        <section className="sad-card">
          <div className="sad-card__header">
            <h3 className="sad-card__title">
              Recent Applications ({applications.length})
            </h3>
            <button
              className="sad-card__link"
              onClick={() => navigate('/school/applications')}
            >
              View all →
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="sad-empty-inner">
              <p>No applications yet. Once parents apply, they'll show up here.</p>
            </div>
          ) : (
            <div className="sad-apps-list">
              {applications.slice(0, 6).map((app) => {
                const badge = statusBadge(app.status)
                return (
                  <div key={app.id} className="sad-app-row">
                    <div className="sad-app-row__avatar">
                      {app.children?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="sad-app-row__info">
                      <div className="sad-app-row__name">
                        {app.children?.full_name}
                      </div>
                      <div className="sad-app-row__meta">
                        Grade {app.children?.grade} ·{' '}
                        {app.children?.gender || '—'} · Applied{' '}
                        {new Date(app.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                    </div>
                    <div className="sad-app-row__actions">
                      <span className={`sad-badge ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {app.status === 'pending' && (
                        <>
                          <button
                            className="sad-btn sad-btn--success sad-btn--sm"
                            onClick={() =>
                              handleApplicationStatus(app.id, 'accepted')
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="sad-btn sad-btn--danger sad-btn--sm"
                            onClick={() =>
                              handleApplicationStatus(app.id, 'rejected')
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}