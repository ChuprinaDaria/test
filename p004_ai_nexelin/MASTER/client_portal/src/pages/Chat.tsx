import { useState } from 'react'
import { api } from '../lib/api'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Chat(){
  const [text, setText] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useParams()
  const { i18n } = useTranslation()

  async function send(){
    if(!text) return
    setLoading(true); setReply('')
    try{
      const { data } = await api.post('/api/restaurant/chat/', { message: text, session_id: 'demo-session', language: i18n.language || 'uk' }, { headers: { 'X-API-Key': token || '' } })
      setReply(data?.response||'')
    }catch(e:any){
      setReply(e?.response?.data?.error || e.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>AI Waiter</h2>
        <textarea className="input" value={text} onChange={e=>setText(e.target.value)} />
        <div style={{marginTop:12}}>
          <button className="btn" onClick={send} disabled={loading}>{loading?'...':'Send'}</button>
        </div>
        {reply && <div style={{marginTop:12}}>{reply}</div>}
      </div>
    </div>
  )
}


