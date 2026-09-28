import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './ParentSidebar.css'

const NAV = [
  { icon: '🏠', label: 'Dashboard',     path: '/dashboard' },
  { icon: '👥', label: 'My Children',   path: '/my-children' },
  { icon: '📄', label: 'Applications',  path: '/applications' },
  { icon: '✉️', label: 'Messages',      path: '/messages', badge: 2 },
  { icon: '🔔', label: 'School Updates', path: '/updates' },
  { icon: '📁', label: 'Documents',     path: '/documents' },
  { icon: '👤', label: 'Profile',       path: '/profile' },
  { icon: '🎧', label: 'Support',       path: '/support' },
]

export function ParentSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="pd-sidebar">
      <div className="pd-sidebar__brand">
        <div className="pd-sidebar__brand-icon">🎓</div>
        <div className="pd-sidebar__brand-text">
          School
          <br />
          Application Platform
        </div>
      </div>

      <nav className="pd-sidebar__nav">
        {NAV.map((item) => {
          const active = pathname === item.path
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`pd-nav-item ${active ? 'pd-nav-item--active' : ''}`}
            >
              <span className="pd-nav-item__icon">{item.icon}</span>
              <span className="pd-nav-item__label">{item.label}</span>
              {item.badge && (
                <span className="pd-nav-item__badge">{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <button className="pd-sidebar__logout" onClick={handleLogout}>
        <span className="pd-sidebar__logout-icon">🚪</span>
        <span>Log out</span>
      </button>

      <div className="pd-sidebar__tagline">
        Better Access.
        <br />
        Brighter Futures.
        <span className="pd-sidebar__tagline-underline" />
      </div>

      <div className="pd-sidebar__wave" aria-hidden="true" />
    </aside>
  )
}