import { useAuthStore } from '../stores/auth'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type Section = { key:string; title:string; description:string }

export default function Dashboard(){
  const { client, loading, error } = useAuthStore()
  const auth = useAuthStore(s=>({ access: s.access, loading: s.loading }))
  const { t, i18n } = useTranslation()
  const [sections, setSections] = useState<Section[]>([])
  const navigate = useNavigate()

  const routeByKey: Record<string, string> = {
    documents: 'documents',
    menu: 'menu',
    orders: 'orders',
    tables: 'tables',
    chat: 'chat',
  }

  useEffect(()=>{
    if(!auth.access || auth.loading) return
    api.get(`/api/client/features/overview/?lang=${i18n.language || 'en'}`).then(({data})=>{
      setSections((data?.sections||[]) as Section[])
    }).catch(()=>{})
  },[i18n.language, auth.access, auth.loading])
  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>{t('dashboard')}</h2>
        {loading && <div>{t('loading')}</div>}
        {error && <div style={{color:'#f66'}}>{error}</div>}
        {client && (
          <div>
            <div className="label">Username</div>
            <div>{client.username}</div>
            <div className="label" style={{marginTop:12}}>Email</div>
            <div>{client.email}</div>
            {sections.length>0 && (
              <div style={{marginTop:16}}>
                <div className="label">Features</div>
                <div className="grid" style={{gap:12}}>
                  {sections.map(s=> {
                    const to = routeByKey[s.key] || 'dashboard'
                    return (
                      <div
                        key={s.key}
                        className="card"
                        role="button"
                        onClick={()=>navigate(to)}
                        style={{border:'1px solid #eee', cursor:'pointer'}}
                      >
                        <div style={{fontWeight:600}}>{s.title}</div>
                        <div style={{opacity:0.8, marginTop:4}}>{s.description}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
