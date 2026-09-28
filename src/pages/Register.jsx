import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './Auth.css'

export function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState('parent')
  const [schoolName, setSchoolName] = useState('')
  const [emisNumber, setEmisNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, refreshRole } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    })
    if (error) setError(error.message)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (userType === 'school' && (!schoolName || !emisNumber)) {
      setError('Please fill in all school details')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
      })

      if (result?.error) throw result.error

      const newUser = result?.data?.user
      if (!newUser) {
        throw new Error('Sign up failed — no user returned. Try a different email.')
      }

      // Supabase obfuscates existing emails: identities is empty array
      if (Array.isArray(newUser.identities) && newUser.identities.length === 0) {
        throw new Error('This email is already registered. Try signing in instead.')
      }

      const userId = newUser.id

      if (userType === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert([{
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
          }])

        if (parentError) throw parentError
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
            user_id: userId,
            school_id: school.id,
            first_name: firstName,
            last_name: lastName,
          }])

        if (adminError) throw adminError
      }

      await refreshRole()
      navigate('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)

      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.')
      } else {
        setError(error.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">← Back to Home</Link>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the platform in under a minute</p>

        {error && <div className="auth-error">{error}</div>}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn-google"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

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
            disabled={loading}
            className="btn-secondary btn-full"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}