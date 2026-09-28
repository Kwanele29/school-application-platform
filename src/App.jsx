import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { MyChildren } from './components/parent/MyChildren'
import { MyApplications } from './components/parent/MyApplications'
import { FindSchools } from './components/parent/FindSchools'
import { AddChild } from './components/parent/AddChild'
import { SchoolSettings } from './components/school/SchoolSettings'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-children"
            element={
              <ProtectedRoute>
                <MyChildren />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-child"
            element={
              <ProtectedRoute>
                <AddChild />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schools"
            element={
              <ProtectedRoute>
                <FindSchools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/school/settings"
            element={
              <ProtectedRoute>
                <SchoolSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App