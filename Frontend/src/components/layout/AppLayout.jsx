import { Outlet } from 'react-router-dom'
import '../../css/components/app-layout.css'
import AppFooter from './AppFooter'
import AppHeader from './AppHeader'

function AppLayout() {
  return (
    <div className="app-layout">
      <AppHeader />

      <main className="app-layout__main">
        <div className="app-layout__content">
          <Outlet />
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export default AppLayout