import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'
import { LangProvider, useLang } from './context/LangContext'
import type { Screen } from './types'
import { t } from './i18n/translations'
import { LandingPage } from './pages/LandingPage'
import { CompanySignupPage } from './pages/CompanySignupPage'
import { LoginPage } from './pages/LoginPage'
import { TechnicianLoginPage } from './pages/TechnicianLoginPage'
import { TechnicianPortal } from './pages/TechnicianPortal'
import { AdminPortal } from './pages/AdminPortal'
import { StaffPortal } from './pages/StaffPortal'
import { ResidentPortal } from './pages/ResidentPortal'

function AppLoading() {
  const { lang } = useLang()
  return (
    <div className="app-loading">
      <p>{t(lang, 'loadingData')}</p>
    </div>
  )
}

function AppWithData() {
  const { ready } = useData()
  if (!ready) return <AppLoading />
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user, logout } = useAuth()
  const [screen, setScreen] = useState<Screen>('landing')

  useEffect(() => {
    if (!user) return
    if (user.role === 'technician') setScreen('technician-portal')
    if (user.role === 'admin') setScreen('admin-portal')
    if (user.role === 'staff') setScreen('staff-portal')
    if (user.role === 'resident') setScreen('resident-portal')
  }, [user])

  const handleLogout = () => {
    logout()
    setScreen('landing')
  }

  if (user?.role === 'technician' && screen === 'technician-portal') {
    return <TechnicianPortal onLogout={handleLogout} />
  }
  if (user?.role === 'admin' && screen === 'admin-portal') {
    return <AdminPortal onLogout={handleLogout} />
  }
  if (user?.role === 'staff' && screen === 'staff-portal') {
    return <StaffPortal onLogout={handleLogout} />
  }
  if (user?.role === 'resident' && screen === 'resident-portal') {
    return <ResidentPortal onLogout={handleLogout} />
  }

  switch (screen) {
    case 'signup':
      return <CompanySignupPage onBack={() => setScreen('landing')} />
    case 'login':
      return <LoginPage onBack={() => setScreen('landing')} onSuccess={() => undefined} />
    case 'technician-login':
      return (
        <TechnicianLoginPage
          onBack={() => setScreen('landing')}
          onSuccess={() => setScreen('technician-portal')}
        />
      )
    default:
      return (
        <LandingPage
          onSignup={() => setScreen('signup')}
          onLogin={() => setScreen('login')}
          onTechnicianLogin={() => setScreen('technician-login')}
        />
      )
  }
}

export default function App() {
  return (
    <LangProvider>
      <DataProvider>
        <AppWithData />
      </DataProvider>
    </LangProvider>
  )
}
