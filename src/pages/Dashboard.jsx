import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ParentDashboard } from '../components/parent/ParentDashboard'
import { SchoolAdminDashboard } from '../components/school/SchoolAdminDashboard'
import './Auth.css'

export function Dashboard() {
  const { userRole, user, loading: authLoading } = useAuth()

  const [userType, setUserType] = useState('parent')
  const [schoolName, setSchoolName] = useState('')
  const [emisNumber, setEmisNumber] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [roleJustSet, setRoleJustSet] = useState(null)

  // If the user already has a role, show the right dashboard
  if (userRole === 'parent' || roleJustSet === 'parent') {
    return <ParentDashboard />
  }
  if (userRole === 'school_admin' || roleJustSet === 'school_admin') {
    return <SchoolAdminDashboard />
  }

  if (authLoading) {
    return <div className="loading-state">Loading...</div>
  }

  if (!user) {
    return null
  }

  // No role yet → show the role picker inline
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (userType === 'school' && (!schoolName || !emisNumber)) {
      setError('Please fill in all school details')
      return
    }

    setSaving(true)

    try {
      const meta = user.user_metadata || {}
      const fullName = meta.full_name || meta.name || ''
      const parts = fullName.split(' ').filter(Boolean)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ')

      if (userType === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert([{
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
          }])

        if (parentError) throw parentError
        setRoleJustSet('parent')
      } else {
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .insert([{
            name: schoolName,
            emis_number: emisNumber,
            verification_status: 'pending',
          }])
          .select()
          .single()

        if (schoolError) throw schoolError

        const { error: adminError } = await supabase
          .from('school_admins')
          .insert([{
            user_id: user.id,
            school_id: school.id,
            first_name: firstName,
            last_name: lastName,
          }])

        if (adminError) throw adminError
        setRoleJustSet('school_admin')
      }
    } catch (err) {
      console.error('Role setup error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">One Last Step</h1>
        <p className="auth-subtitle">
          Tell us how you'll use the platform so we can set up your dashboard
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="form-select"
            >
              <option value="parent">Parent</option>
              <option value="school">School Administrator</option>
            </select>
          </div>

          {userType === 'school' && (
            <>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">EMIS Number</label>
                <input
                  type="text"
                  value={emisNumber}
                  onChange={(e) => setEmisNumber(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-secondary btn-full"
          >
            {saving ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}