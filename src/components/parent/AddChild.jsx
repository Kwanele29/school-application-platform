import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ParentSidebar } from './ParentSidebar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './AddChild.css'

export function AddChild() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    grade: '',
    gender: '',
    school_name: '',
    special_needs: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim()) {
      setError('Please enter the child\'s full name')
      return
    }
    if (!form.date_of_birth) {
      setError('Please enter the date of birth')
      return
    }
    if (!form.grade) {
      setError('Please select a grade')
      return
    }

    setSaving(true)

    try {
      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!parent) throw new Error('Parent profile not found')

      const { error: insertError } = await supabase
        .from('children')
        .insert([
          {
            parent_id: parent.id,
            full_name: form.full_name.trim(),
            date_of_birth: form.date_of_birth,
            grade: parseInt(form.grade, 10),
            gender: form.gender || null,
            school_name: form.school_name.trim() || null,
            special_needs: form.special_needs.trim() || null,
          },
        ])

      if (insertError) throw insertError

      navigate('/my-children')
    } catch (err) {
      console.error('Add child error:', err)
      setError(err.message || 'Failed to add child')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pd-layout">
      <ParentSidebar />

      <main className="pd-main">
        {/* Topbar */}
        <div className="pd-topbar">
          <Link to="/my-children" className="ac-back">
            ← Back to My Children
          </Link>
        </div>

        {/* Hero */}
        <section className="ac-hero">
          <div className="ac-hero__icon">👶</div>
          <div>
            <h1 className="ac-hero__title">Add a Child</h1>
            <p className="ac-hero__sub">
              Create a reusable profile for your child. You can use it to
              apply to any school on the platform.
            </p>
          </div>
        </section>

        {error && <div className="ac-error">{error}</div>}

        <form onSubmit={handleSubmit} className="ac-form">
          <section className="ac-card">
            <h3 className="ac-card__title">Child Information</h3>

            <div className="ac-field">
              <label className="ac-label">
                Full Name <span className="ac-required">*</span>
              </label>
              <input
                type="text"
                className="ac-input"
                placeholder="e.g. Naledi Mokoena"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
            </div>

            <div className="ac-row">
              <div className="ac-field">
                <label className="ac-label">
                  Date of Birth <span className="ac-required">*</span>
                </label>
                <input
                  type="date"
                  className="ac-input"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    handleChange('date_of_birth', e.target.value)
                  }
                  required
                />
              </div>

              <div className="ac-field">
                <label className="ac-label">
                  Gender
                </label>
                <select
                  className="ac-input"
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="ac-field">
              <label className="ac-label">
                Grade <span className="ac-required">*</span>
              </label>
              <select
                className="ac-input"
                value={form.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                required
              >
                <option value="">Select a grade</option>
                <option value="0">Grade R</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="ac-card">
            <h3 className="ac-card__title">
              School Information <span className="ac-optional">(optional)</span>
            </h3>

            <div className="ac-field">
              <label className="ac-label">Current School</label>
              <input
                type="text"
                className="ac-input"
                placeholder="e.g. Riverside Primary School"
                value={form.school_name}
                onChange={(e) => handleChange('school_name', e.target.value)}
              />
            </div>

            <div className="ac-field">
              <label className="ac-label">Special Needs / Notes</label>
              <textarea
                className="ac-input"
                rows="3"
                placeholder="Any information schools should know..."
                value={form.special_needs}
                onChange={(e) => handleChange('special_needs', e.target.value)}
              />
              <p className="ac-hint">
                Only schools you apply to will see this.
              </p>
            </div>
          </section>

          <div className="ac-actions">
            <Link to="/my-children" className="ac-btn ac-btn--ghost">
              Cancel
            </Link>
            <button
              type="submit"
              className="ac-btn ac-btn--primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Add Child'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}