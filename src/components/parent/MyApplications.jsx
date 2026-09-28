import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParentSidebar } from './ParentSidebar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './MyApplications.css'

export function MyApplications() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Drawer state
  const [selected, setSelected] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!parent) {
        setApplications([])
        return
      }

      const { data: kids } = await supabase
        .from('children')
        .select('id, full_name, grade')
        .eq('parent_id', parent.id)

      if (!kids?.length) {
        setApplications([])
        return
      }

      const { data: apps } = await supabase
        .from('applications')
        .select(`
          *,
          schools (id, name, location, requirements, contact_email, application_deadline, verification_status),
          children (id, full_name, grade, date_of_birth, gender)
        `)
        .in('child_id', kids.map((k) => k.id))
        .order('created_at', { ascending: false })

      setApplications(apps || [])

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('parent_id', parent.id)
        .order('sent_at', { ascending: false })
        .limit(5)

      setNotifications(notifs || [])
    } catch (err) {
      console.error('Load applications error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this application? This cannot be undone.')) return

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to withdraw: ' + error.message)
      return
    }

    setApplications((prev) => prev.filter((a) => a.id !== id))
    setSelected(null)
  }

  const markNotifRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Parent'

  const demo = [
    {
      id: 'demo1',
      status: 'accepted',
      created_at: '2025-09-10',
      notes: 'Interview completed. Welcome!',
      schools: {
        name: 'Riverside Primary School',
        location: 'Johannesburg',
        requirements: 'Birth certificate, ID copy, proof of address',
        contact_email: 'admin@riverside.co.za',
        application_deadline: '2025-10-01',
        verification_status: 'verified',
      },
      children: {
        full_name: 'Naledi Mokoena',
        grade: 8,
        date_of_birth: '2012-03-12',
        gender: 'Female',
      },
    },
    {
      id: 'demo2',
      status: 'pending',
      created_at: '2025-09-12',
      notes: '',
      schools: {
        name: 'Greenwood High School',
        location: 'Pretoria',
        requirements: 'Birth certificate, latest report card',
        contact_email: 'info@greenwood.co.za',
        application_deadline: '2025-09-30',
        verification_status: 'verified',
      },
      children: {
        full_name: 'Sipho Mokoena',
        grade: 6,
        date_of_birth: '2014-07-08',
        gender: 'Male',
      },
    },
  ]

  const source = applications.length ? applications : demo

  const filtered = source.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.schools?.name?.toLowerCase().includes(q) ||
      a.children?.full_name?.toLowerCase().includes(q) ||
      a.schools?.location?.toLowerCase().includes(q)
    )
  })

  const counts = {
    all: source.length,
    pending: source.filter((a) => a.status === 'pending').length,
    accepted: source.filter((a) => a.status === 'accepted').length,
    rejected: source.filter((a) => a.status === 'rejected').length,
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const statusLabel = (s) => {
    if (s === 'accepted') return '✓ Accepted'
    if (s === 'rejected') return '✕ Rejected'
    return '⏱ Pending'
  }

  const timeline = (status) => {
    const steps = [
      { key: 'submitted', label: 'Submitted', done: true },
      { key: 'review', label: 'Under Review', done: true },
      {
        key: 'decision',
        label:
          status === 'accepted'
            ? 'Accepted'
            : status === 'rejected'
            ? 'Rejected'
            : 'Decision Pending',
        done: status !== 'pending',
      },
    ]
    return steps
  }

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
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="pd-topbar__bell"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="pd-topbar__bell-badge">{unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="ma-notif-panel">
                <div className="ma-notif-panel__title">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="ma-notif-panel__empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`ma-notif-item ${!n.read ? 'ma-notif-item--unread' : ''}`}
                      onClick={() => markNotifRead(n.id)}
                    >
                      <div className="ma-notif-item__subject">{n.subject}</div>
                      <div className="ma-notif-item__msg">{n.message}</div>
                      <div className="ma-notif-item__date">
                        {new Date(n.sent_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

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

        {/* Hero */}
        <section className="ma-hero">
          <div className="ma-hero__text">
            <div className="ma-hero__icon">📄</div>
            <div>
              <h1 className="ma-hero__title">My Applications</h1>
              <p className="ma-hero__sub">
                Track every school application you've submitted — status,
                dates and next steps in one place.
              </p>
            </div>
          </div>
          <button
            className="ma-hero__btn"
            onClick={() => navigate('/schools')}
          >
            + New Application
          </button>
        </section>

        {/* Tabs */}
        <div className="ma-tabs">
          <button
            className={`ma-tab ${filter === 'all' ? 'ma-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📋 All ({counts.all})
          </button>
          <button
            className={`ma-tab ${filter === 'pending' ? 'ma-tab--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏱ Pending ({counts.pending})
          </button>
          <button
            className={`ma-tab ${filter === 'accepted' ? 'ma-tab--active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            ✅ Accepted ({counts.accepted})
          </button>
          <button
            className={`ma-tab ${filter === 'rejected' ? 'ma-tab--active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            ✕ Rejected ({counts.rejected})
          </button>
        </div>

        {/* List */}
        <div className="ma-list">
          {loading ? (
            <div className="ma-empty">Loading applications...</div>
          ) : filtered.length === 0 ? (
            <div className="ma-empty">
              <div className="ma-empty__icon">📭</div>
              <p>No applications found.</p>
              <button
                className="ma-hero__btn"
                onClick={() => navigate('/schools')}
              >
                Browse schools →
              </button>
            </div>
          ) : (
            filtered.map((app) => (
              <article key={app.id} className="ma-card">
                <div className="ma-card__left">
                  <div className={`ma-card__badge ma-card__badge--${app.status}`}>
                    {statusLabel(app.status)}
                  </div>
                  <h3 className="ma-card__school">{app.schools?.name}</h3>
                  <p className="ma-card__location">
                    📍 {app.schools?.location || 'Location not set'}
                  </p>
                </div>

                <div className="ma-card__middle">
                  <div className="ma-meta">
                    <span className="ma-meta__label">Child</span>
                    <span className="ma-meta__value">
                      {app.children?.full_name}
                    </span>
                  </div>
                  <div className="ma-meta">
                    <span className="ma-meta__label">Grade</span>
                    <span className="ma-meta__value">
                      {app.children?.grade}
                    </span>
                  </div>
                  <div className="ma-meta">
                    <span className="ma-meta__label">Submitted</span>
                    <span className="ma-meta__value">
                      {new Date(app.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="ma-card__right">
                  <button
                    className="ma-card__cta"
                    onClick={() => setSelected(app)}
                  >
                    View →
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
          <>
            <div
              className="ma-drawer-overlay"
              onClick={() => setSelected(null)}
            />
            <aside className="ma-drawer">
              <button
                className="ma-drawer__close"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>

              <div className={`ma-card__badge ma-card__badge--${selected.status}`}>
                {statusLabel(selected.status)}
              </div>

              <h2 className="ma-drawer__title">{selected.schools?.name}</h2>
              <p className="ma-drawer__sub">
                📍 {selected.schools?.location || '—'}
              </p>

              {/* Timeline */}
              <div className="ma-drawer__section">
                <div className="ma-drawer__label">Progress</div>
                <div className="ma-timeline">
                  {timeline(selected.status).map((step) => (
                    <div
                      key={step.key}
                      className={`ma-timeline__step ${
                        step.done ? 'ma-timeline__step--done' : ''
                      }`}
                    >
                      <span className="ma-timeline__dot" />
                      <span className="ma-timeline__label">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Child */}
              <div className="ma-drawer__section">
                <div className="ma-drawer__label">Child</div>
                <div className="ma-drawer__row">
                  <strong>{selected.children?.full_name}</strong>
                </div>
                <div className="ma-drawer__row ma-drawer__row--muted">
                  Grade {selected.children?.grade} ·{' '}
                  {selected.children?.gender || '—'} · DOB{' '}
                  {selected.children?.date_of_birth
                    ? new Date(
                        selected.children.date_of_birth
                      ).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>

              {/* School info */}
              <div className="ma-drawer__section">
                <div className="ma-drawer__label">School</div>
                {selected.schools?.requirements && (
                  <div className="ma-drawer__row ma-drawer__row--muted">
                    <strong>Requirements:</strong>{' '}
                    {selected.schools.requirements}
                  </div>
                )}
                {selected.schools?.application_deadline && (
                  <div className="ma-drawer__row ma-drawer__row--muted">
                    <strong>Deadline:</strong>{' '}
                    {new Date(
                      selected.schools.application_deadline
                    ).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {selected.schools?.contact_email && (
                  <div className="ma-drawer__row ma-drawer__row--muted">
                    <strong>Contact:</strong> {selected.schools.contact_email}
                  </div>
                )}
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="ma-drawer__section">
                  <div className="ma-drawer__label">Notes</div>
                  <div className="ma-drawer__row ma-drawer__row--muted">
                    {selected.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="ma-drawer__actions">
                {selected.status === 'pending' && (
                  <button
                    className="ma-drawer__btn ma-drawer__btn--danger"
                    onClick={() => handleWithdraw(selected.id)}
                  >
                    Withdraw Application
                  </button>
                )}
                {selected.schools?.contact_email && (
                  <a
                    className="ma-drawer__btn ma-drawer__btn--ghost"
                    href={`mailto:${selected.schools.contact_email}?subject=Question about my application`}
                  >
                    ✉️ Contact School
                  </a>
                )}
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  )
}