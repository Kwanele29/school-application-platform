import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './SchoolSettings.css'

const NAV = [
  { icon: '🏠', label: 'Dashboard',     path: '/school' },
  { icon: '📄', label: 'Applications',  path: '/school/applications' },
  { icon: '🎓', label: 'Students',      path: '/school/students' },
  { icon: '📢', label: 'Announcements', path: '/school/announcements' },
  { icon: '📅', label: 'Meetings',      path: '/school/meetings' },
  { icon: '✉️', label: 'Messages',      path: '/school/messages' },
  { icon: '⚙️', label: 'Settings',      path: '/school/settings' },
]

export function SchoolSettings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [school, setSchool] = useState(null)
  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
    requirements: '',
    contact_email: '',
    contact_phone: '',
    application_deadline: '',
    open_applications: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadSchool()
  }, [user])

  const loadSchool = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: admin } = await supabase
        .from('school_admins')
        .select('school_id')
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

      if (schoolData) {
        setForm({
          name: schoolData.name || '',
          location: schoolData.location || '',
          description: schoolData.description || '',
          requirements: schoolData.requirements || '',
          contact_email: schoolData.contact_email || '',
          contact_phone: schoolData.contact_phone || '',
          application_deadline: schoolData.application_deadline
            ? new Date(schoolData.application_deadline).toISOString().slice(0, 16)
            : '',
          open_applications: schoolData.open_applications || false,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!school) return
    setError('')
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('schools')
        .update({
          name: form.name.trim(),
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          requirements: form.requirements.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          application_deadline: form.application_deadline || null,
          open_applications: form.open_applications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', school.id)

      if (updateError) throw updateError

      setSaved(true)
      await loadSchool()
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return <div className="ss-loading">Loading settings...</div>
  }

  if (!school) {
    return (
      <div className="ss-loading">
        <p>No school linked to your account.</p>
        <button onClick={handleLogout} className="ss-btn ss-btn--ghost">
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="sad-layout">
      {/* SIDEBAR */}
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
                item.path === '/school/settings' ? 'sad-nav-item--active' : ''
              }`}
            >
              <span className="sad-nav-item__icon">{item.icon}</span>
              <span className="sad-nav-item__label">{item.label}</span>
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
            <span className={`sad-sidebar__status sad-sidebar__status--${school.verification_status}`}>
              {school.verification_status}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="sad-main">
        <div className="sad-topbar">
          <div className="sad-topbar__left">
            <h1 className="sad-topbar__title">School Settings</h1>
          </div>

          <div
            className="sad-topbar__user"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="sad-topbar__avatar">
              {(school.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="sad-topbar__info">
              <div className="sad-topbar__name">{school.name}</div>
              <div className="sad-topbar__role">School Admin</div>
            </div>
            <span className="sad-topbar__chevron">▾</span>

            {menuOpen && (
              <div className="sad-topbar__menu">
                <button onClick={handleLogout}>🚪 Log out</button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="ss-error">{error}</div>}
        {saved && <div className="ss-success">✓ Settings saved successfully</div>}

        <form onSubmit={handleSave} className="ss-form">
          <section className="sad-card">
            <div className="sad-card__header">
              <h3 className="sad-card__title">Basic Information</h3>
            </div>

            <div className="ss-field">
              <label className="ss-label">School Name</label>
              <input
                type="text"
                className="ss-input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="ss-field">
              <label className="ss-label">Location</label>
              <input
                type="text"
                className="ss-input"
                placeholder="e.g. Cape Town, Western Cape"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
              <p className="ss-hint">
                This is what parents see when searching for schools near them.
              </p>
            </div>

            <div className="ss-field">
              <label className="ss-label">Description</label>
              <textarea
                className="ss-input"
                rows="4"
                placeholder="Tell parents about your school..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </section>

          <section className="sad-card">
            <div className="sad-card__header">
              <h3 className="sad-card__title">Applications</h3>
            </div>

            <div className="ss-row">
              <div className="ss-field ss-field--grow">
                <label className="ss-label">Application Deadline</label>
                <input
                  type="datetime-local"
                  className="ss-input"
                  value={form.application_deadline}
                  onChange={(e) => handleChange('application_deadline', e.target.value)}
                />
              </div>

              <div className="ss-field">
                <label className="ss-label">Status</label>
                <button
                  type="button"
                  className={`ss-toggle ${form.open_applications ? 'ss-toggle--on' : ''}`}
                  onClick={() => handleChange('open_applications', !form.open_applications)}
                >
                  <span className="ss-toggle__dot" />
                  <span>{form.open_applications ? 'Open' : 'Closed'}</span>
                </button>
              </div>
            </div>

            <div className="ss-field">
              <label className="ss-label">Requirements</label>
              <textarea
                className="ss-input"
                rows="3"
                placeholder="e.g. Birth certificate, proof of address, latest report card"
                value={form.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
              />
            </div>
          </section>

          <section className="sad-card">
            <div className="sad-card__header">
              <h3 className="sad-card__title">Contact Information</h3>
            </div>

            <div className="ss-row">
              <div className="ss-field ss-field--grow">
                <label className="ss-label">Email</label>
                <input
                  type="email"
                  className="ss-input"
                  placeholder="admin@school.co.za"
                  value={form.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                />
              </div>

              <div className="ss-field ss-field--grow">
                <label className="ss-label">Phone</label>
                <input
                  type="tel"
                  className="ss-input"
                  placeholder="+27 21 000 0000"
                  value={form.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="ss-actions">
            <button
              type="button"
              className="ss-btn ss-btn--ghost"
              onClick={() => navigate('/school')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ss-btn ss-btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}