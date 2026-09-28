import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParentSidebar } from './ParentSidebar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './FindSchools.css'

const PHASES = [
  { value: '', label: 'All phases' },
  { value: 'foundation', label: 'Foundation Phase (R–3)' },
  { value: 'intermediate', label: 'Intermediate Phase (4–6)' },
  { value: 'senior', label: 'Senior Phase (7–9)' },
  { value: 'fet', label: 'FET Phase (10–12)' },
]

// School is OPEN when:
//  - deadline is in the future, OR
//  - no deadline, and open_applications = true
const isSchoolOpen = (school) => {
  if (school?.application_deadline) {
    return new Date(school.application_deadline) > new Date()
  }
  return school?.open_applications === true
}

export function FindSchools() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [schools, setSchools] = useState([])
  const [children, setChildren] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [cities, setCities] = useState([])

  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [applySchool, setApplySchool] = useState(null)
  const [detailSchool, setDetailSchool] = useState(null)
  const [selectedChild, setSelectedChild] = useState('')
  const [applyNotes, setApplyNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
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

        if (kids?.length) {
          const { data: apps } = await supabase
            .from('applications')
            .select('id, child_id, school_id, status')
            .in('child_id', kids.map((k) => k.id))
          setMyApplications(apps || [])
        }
      }

      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true })

      setSchools(schoolsData || [])

      const unique = Array.from(
        new Set(
          (schoolsData || [])
            .map((s) => s.location?.trim())
            .filter(Boolean)
        )
      ).sort()
      setCities(unique)
    } catch (err) {
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const hasApplied = (schoolId) =>
    myApplications.some((a) => a.school_id === schoolId)

  const openApply = (school) => {
    if (children.length === 0) {
      if (confirm('You need to add a child first. Go to My Children?')) {
        navigate('/my-children')
      }
      return
    }
    setApplySchool(school)
    setSelectedChild(children[0].id)
    setApplyNotes('')
    setApplyError('')
  }

  const submitApplication = async () => {
    if (!selectedChild || !applySchool) return
    setSubmitting(true)
    setApplyError('')

    try {
      const { error } = await supabase.from('applications').insert([
        {
          child_id: selectedChild,
          school_id: applySchool.id,
          status: 'pending',
          notes: applyNotes || null,
        },
      ])

      if (error) throw error

      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (parent) {
        await supabase.from('notifications').insert([
          {
            parent_id: parent.id,
            school_id: applySchool.id,
            type: 'update',
            subject: `Application sent to ${applySchool.name}`,
            message: `Your application has been submitted. You'll be notified when the school responds.`,
          },
        ])
      }

      setApplySchool(null)
      await loadData()
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Parent'

  const filtered = useMemo(() => {
    let list = [...schools]

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      )
    }

    if (cityFilter) {
      list = list.filter((s) => s.location === cityFilter)
    }

    if (phaseFilter && phaseFilter !== '') {
      list = list.filter(
        (s) => s.phase?.toLowerCase() === phaseFilter.toLowerCase()
      )
    }

    if (openOnly) list = list.filter((s) => isSchoolOpen(s))
    if (verifiedOnly) list = list.filter((s) => s.verification_status === 'verified')

    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else if (sortBy === 'deadline') {
      list.sort((a, b) => {
        const A = a.application_deadline ? new Date(a.application_deadline) : Infinity
        const B = b.application_deadline ? new Date(b.application_deadline) : Infinity
        return A - B
      })
    } else if (sortBy === 'recent') {
      list.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
    }

    return list
  }, [schools, search, cityFilter, phaseFilter, openOnly, verifiedOnly, sortBy])

  const totalCount = schools.length
  const openCount = schools.filter((s) => isSchoolOpen(s)).length

  const clearFilters = () => {
    setSearch('')
    setCityFilter('')
    setPhaseFilter('')
    setOpenOnly(false)
    setVerifiedOnly(false)
    setSortBy('name')
  }

  const hasActiveFilters =
    search || cityFilter || phaseFilter || openOnly || verifiedOnly

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
              placeholder="Search by school name, city or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                className="mc-search__clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
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

        {/* Hero */}
        <section className="fs-hero">
          <div className="fs-hero__text">
            <div className="fs-hero__icon">🏫</div>
            <div>
              <h1 className="fs-hero__title">Find Schools</h1>
              <p className="fs-hero__sub">
                {totalCount} schools on the platform · {openCount} with open
                applications right now.
              </p>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div className="fs-filterbar">
          <div className="fs-filterbar__row">
            <select
              className="fs-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">📍 All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="fs-select"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              className="fs-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort: Name (A–Z)</option>
              <option value="deadline">Sort: Deadline (soonest)</option>
              <option value="recent">Sort: Recently added</option>
            </select>

            <label className="fs-checkbox">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
              />
              <span>Open only</span>
            </label>

            <label className="fs-checkbox">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified only</span>
            </label>

            {hasActiveFilters && (
              <button className="fs-clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="fs-results">
            Showing <strong>{filtered.length}</strong> of {totalCount} schools
          </div>
        </div>

        {/* Schools list */}
        <div className="fs-list">
          {loading ? (
            <div className="fs-empty">Loading schools...</div>
          ) : filtered.length === 0 ? (
            <div className="fs-empty">
              <div className="fs-empty__icon">🔍</div>
              <p>No schools match your search.</p>
              {hasActiveFilters && (
                <button className="fs-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((school) => {
              const applied = hasApplied(school.id)
              const isVerified = school.verification_status === 'verified'
              const isOpen = isSchoolOpen(school)

              return (
                <article key={school.id} className="fs-card">
                  <div className="fs-card__grid">
                    {/* LEFT: school info */}
                    <div className="fs-card__info">
                      <div className="fs-card__header">
                        <div className="fs-card__avatar">🏫</div>
                        <div className="fs-card__headinfo">
                          <h3 className="fs-card__name">
                            {school.name}
                            {isVerified ? (
                              <span
                                className="fs-card__verified"
                                title="Verified"
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className="fs-card__pending"
                                title="Pending verification"
                              >
                                ⏳
                              </span>
                            )}
                          </h3>
                          <p className="fs-card__location">
                            📍 {school.location || 'Location not set'}
                          </p>
                          {!isVerified && (
                            <p className="fs-card__pending-note">
                              Pending platform verification
                            </p>
                          )}
                        </div>
                        {isOpen ? (
                          <span className="fs-card__status fs-card__status--open">
                            🟢 Open
                          </span>
                        ) : (
                          <span className="fs-card__status fs-card__status--closed">
                            ⚪ Closed
                          </span>
                        )}
                      </div>

                      {school.description && (
                        <p className="fs-card__desc">{school.description}</p>
                      )}

                      <div className="fs-card__meta">
                        {school.application_deadline && (
                          <div className="fs-meta">
                            <span className="fs-meta__label">Deadline</span>
                            <span className="fs-meta__value">
                              {new Date(
                                school.application_deadline
                              ).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {school.requirements && (
                          <div className="fs-meta fs-meta--wide">
                            <span className="fs-meta__label">Requirements</span>
                            <span className="fs-meta__value">
                              {school.requirements}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: actions — always visible */}
                    <div className="fs-card__side">
                      <button
                        className="fs-card__btn fs-card__btn--ghost"
                        onClick={() => setDetailSchool(school)}
                      >
                        View Details
                      </button>

                      {applied ? (
                        <button
                          className="fs-card__btn fs-card__btn--applied"
                          disabled
                        >
                          ✓ Already Applied
                        </button>
                      ) : !isOpen ? (
                        <button
                          className="fs-card__btn fs-card__btn--disabled"
                          disabled
                        >
                          Applications Closed
                        </button>
                      ) : (
                        <button
                          className="fs-card__btn fs-card__btn--primary"
                          onClick={() => openApply(school)}
                        >
                          Apply Now →
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </main>

      {/* ============= APPLY MODAL ============= */}
      {applySchool && (
        <div className="fs-modal-overlay" onClick={() => setApplySchool(null)}>
          <div className="fs-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="fs-modal__close"
              onClick={() => setApplySchool(null)}
            >
              ✕
            </button>

            <h2 className="fs-modal__title">Apply to {applySchool.name}</h2>
            <p className="fs-modal__sub">
              Choose which child you're applying for
            </p>

            {applyError && <div className="auth-error">{applyError}</div>}

            <div className="fs-modal__field">
              <label className="fs-modal__label">Select Child</label>
              <select
                className="form-select"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — Grade {c.grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="fs-modal__field">
              <label className="fs-modal__label">
                Notes for the school (optional)
              </label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Any special requests or information..."
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
              />
            </div>

            <div className="fs-modal__actions">
              <button
                className="fs-modal__btn fs-modal__btn--ghost"
                onClick={() => setApplySchool(null)}
              >
                Cancel
              </button>
              <button
                className="fs-modal__btn fs-modal__btn--primary"
                onClick={submitApplication}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============= DETAIL MODAL ============= */}
      {detailSchool && (
        <div className="fs-modal-overlay" onClick={() => setDetailSchool(null)}>
          <div
            className="fs-modal fs-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="fs-modal__close"
              onClick={() => setDetailSchool(null)}
            >
              ✕
            </button>

            <div className="fs-detail__hero">
              <div className="fs-detail__avatar">🏫</div>
              <div>
                <h2 className="fs-modal__title">{detailSchool.name}</h2>
                <p className="fs-modal__sub">
                  📍 {detailSchool.location || 'Location not set'}
                </p>
              </div>
            </div>

            <div className="fs-detail__badges">
              {detailSchool.verification_status === 'verified' && (
                <span className="fs-detail__badge fs-detail__badge--verified">
                  ✓ Verified School
                </span>
              )}
              {isSchoolOpen(detailSchool) ? (
                <span className="fs-detail__badge fs-detail__badge--open">
                  🟢 Applications Open
                </span>
              ) : (
                <span className="fs-detail__badge fs-detail__badge--closed">
                  ⚪ Applications Closed
                </span>
              )}
            </div>

            {detailSchool.description && (
              <div className="fs-detail__section">
                <div className="fs-detail__label">About</div>
                <p className="fs-detail__text">{detailSchool.description}</p>
              </div>
            )}

            <div className="fs-detail__grid">
              {detailSchool.emis_number && (
                <div className="fs-detail__cell">
                  <div className="fs-detail__label">EMIS Number</div>
                  <div className="fs-detail__value">
                    {detailSchool.emis_number}
                  </div>
                </div>
              )}
              {detailSchool.application_deadline && (
                <div className="fs-detail__cell">
                  <div className="fs-detail__label">Deadline</div>
                  <div className="fs-detail__value">
                    {new Date(
                      detailSchool.application_deadline
                    ).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )}
              {detailSchool.contact_email && (
                <div className="fs-detail__cell">
                  <div className="fs-detail__label">Email</div>
                  <div className="fs-detail__value">
                    <a href={`mailto:${detailSchool.contact_email}`}>
                      {detailSchool.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {detailSchool.contact_phone && (
                <div className="fs-detail__cell">
                  <div className="fs-detail__label">Phone</div>
                  <div className="fs-detail__value">
                    {detailSchool.contact_phone}
                  </div>
                </div>
              )}
            </div>

            {detailSchool.requirements && (
              <div className="fs-detail__section">
                <div className="fs-detail__label">Requirements</div>
                <p className="fs-detail__text">{detailSchool.requirements}</p>
              </div>
            )}

            <div className="fs-modal__actions">
              <button
                className="fs-modal__btn fs-modal__btn--ghost"
                onClick={() => setDetailSchool(null)}
              >
                Close
              </button>
              {hasApplied(detailSchool.id) ? (
                <button
                  className="fs-modal__btn fs-modal__btn--applied"
                  disabled
                >
                  ✓ Already Applied
                </button>
              ) : isSchoolOpen(detailSchool) ? (
                <button
                  className="fs-modal__btn fs-modal__btn--primary"
                  onClick={() => {
                    setDetailSchool(null)
                    openApply(detailSchool)
                  }}
                >
                  Apply Now →
                </button>
              ) : (
                <button
                  className="fs-modal__btn fs-modal__btn--disabled"
                  disabled
                >
                  Applications Closed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}