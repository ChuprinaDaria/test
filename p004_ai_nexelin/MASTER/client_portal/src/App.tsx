import { Routes, Route, useParams, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Menu from './pages/Menu'
import Orders from './pages/Orders'
import Tables from './pages/Tables'
import Chat from './pages/Chat'
import MenuCategories from './pages/MenuCategories'
import Settings from './pages/Settings'
import { useEffect } from 'react'
import { useAuthStore } from './stores/auth'
import './i18n'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'

function Shell(){
  const { branch, specialization, token } = useParams()
  const init = useAuthStore(s=>s.init)
  const auth = useAuthStore(s=>({ client: s.client }))
  const { t } = useTranslation()

  useEffect(()=>{
    if(branch && specialization && token){
      init({ branch, specialization, token })
    }
  },[branch, specialization, token, init])

  return (
    <div style={{display:'flex'}}>
      <aside className="sidebar">
        <div style={{fontWeight:700,marginBottom:16}}>Client Portal</div>
        <nav className="grid">
          <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="dashboard">{t('dashboard')}</NavLink>
          {(auth.client as any)?.client_type === 'restaurant' && (
            <>
              <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="menu">Dishes</NavLink>
              <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="menu-categories">menu-categories</NavLink>
              <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="orders">Orders</NavLink>
              <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="tables">Tables</NavLink>
            </>
          )}
          <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="chat">Chat</NavLink>
          <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="documents">{t('documents')}</NavLink>
          <NavLink className={({isActive})=>`link ${isActive?'active':''}`} to="settings">{t('settings')}</NavLink>
        </nav>
        <div style={{marginTop:16}}>
          <LanguageSwitcher/>
        </div>
      </aside>
      <main style={{flex:1}}>
        <div className="container">
          <Routes>
            <Route path="dashboard" element={<Dashboard/>} />
            <Route path="menu" element={<Menu/>} />
            <Route path="menu-categories" element={<MenuCategories/>} />
            <Route path="orders" element={<Orders/>} />
            <Route path="tables" element={<Tables/>} />
            <Route path="chat" element={<Chat/>} />
            <Route path="documents" element={<Documents/>} />
            <Route path="settings" element={<Settings/>} />
            <Route path="*" element={<Navigate to="dashboard" replace/>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App(){
  return (
    <Routes>
      <Route path=":branch/:specialization/:token/admin/*" element={<Shell/>} />
      <Route path="*" element={<Navigate to="demo/restaurant/demo-token/admin" replace/>} />
    </Routes>
  )
}
