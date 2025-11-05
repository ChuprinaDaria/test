import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Table = { id:number; table_number:number; display_name?:string; capacity?:number; qr_code_url?:string; qr_code?:string; location?:string; is_active?:boolean; is_occupied?:boolean }

export default function Tables(){
  const [tables, setTables] = useState<Table[]>([])
  const [form, setForm] = useState<{table_number:string; display_name:string; capacity:string; location:string; is_active:boolean; is_occupied:boolean}>({table_number:'', display_name:'', capacity:'', location:'', is_active:true, is_occupied:false})
  const [editingId, setEditingId] = useState<number|undefined>(undefined)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function load(){
    api.get('/api/restaurant/tables/').then(({data})=>setTables(data||[])).catch(()=>{})
  }
  useEffect(()=>{ load() },[])

  function startEdit(t:Table){
    setEditingId(t.id)
    setForm({ table_number:String(t.table_number||''), display_name:t.display_name||'', capacity:String(t.capacity||''), location:t.location||'', is_active:!!t.is_active, is_occupied:!!t.is_occupied })
  }

  async function submit(){
    setLoading(true); setMessage('')
    try{
      const payload:any = {
        table_number: Number(form.table_number),
        display_name: form.display_name || null,
        capacity: form.capacity? Number(form.capacity): null,
        location: form.location || '',
        is_active: form.is_active,
        is_occupied: form.is_occupied,
      }
      if(!payload.table_number){ setMessage('Вкажіть номер столу'); setLoading(false); return }
      if(editingId){
        await api.patch(`/api/restaurant/tables/${editingId}/`, payload)
        setMessage('Оновлено')
      }else{
        await api.post('/api/restaurant/tables/', payload)
        setMessage('Створено')
      }
      setForm({table_number:'', display_name:'', capacity:'', location:'', is_active:true, is_occupied:false})
      setEditingId(undefined)
      load()
    }catch(e:any){
      setMessage(e?.response?.data?.error || e.message || 'Помилка')
    }finally{ setLoading(false) }
  }

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Столи</h2>
        <div className="card">
          <div className="label">Номер столу</div>
          <input className="input" value={form.table_number} onChange={e=>setForm({...form, table_number:e.target.value})} />
          <div className="label" style={{marginTop:8}}>Назва</div>
          <input className="input" value={form.display_name} onChange={e=>setForm({...form, display_name:e.target.value})} />
          <div className="label" style={{marginTop:8}}>Місткість</div>
          <input className="input" value={form.capacity} onChange={e=>setForm({...form, capacity:e.target.value})} />
          <div className="label" style={{marginTop:8}}>Локація</div>
          <input className="input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder='e.g., "Main Hall", "Terrace"' />
          <div style={{display:'flex', gap:12, marginTop:8}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active:e.target.checked})} />
              <span>Активний</span>
            </label>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.is_occupied} onChange={e=>setForm({...form, is_occupied:e.target.checked})} />
              <span>Зайнятий</span>
            </label>
          </div>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={submit} disabled={loading}>{loading?'...': (editingId? 'Оновити':'Створити')}</button>
            {message && <span style={{marginLeft:12}}>{message}</span>}
          </div>
        </div>
        <div className="grid" style={{gap:12, marginTop:12}}>
          {tables.map(t=> {
            const backend = (import.meta as any).env?.VITE_API_BASE_URL || ''
            const imgSrc = t.qr_code ? (t.qr_code.startsWith('http') ? t.qr_code : `${backend}${t.qr_code}`) : undefined
            const downloadHref = imgSrc || undefined
            return (
            <div key={t.id} className="card" style={{border:'1px solid #eee'}}>
              <div style={{display:'flex', gap:12, alignItems:'flex-start', justifyContent:'space-between'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontWeight:600}}>#{t.table_number} {t.display_name||''}</div>
                    <div>
                      <button className="btn" onClick={()=>startEdit(t)} style={{padding:'6px 10px'}}>Редагувати</button>
                    </div>
                  </div>
                  {t.capacity && <div style={{opacity:0.8, marginTop:4}}>Місткість: {t.capacity}</div>}
                  {t.location && <div style={{opacity:0.8, marginTop:4}}>Локація: {t.location}</div>}
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <span style={{padding:'2px 8px', borderRadius:8, background: t.is_active? '#e6ffed':'#ffecec', color: t.is_active? '#137333':'#a00'}}>{t.is_active? 'Active':'Inactive'}</span>
                    <span style={{padding:'2px 8px', borderRadius:8, background: t.is_occupied? '#fff7d6':'#eef7ff', color: t.is_occupied? '#9a6':'#1677ff'}}>{t.is_occupied? 'Occupied':'Free'}</span>
                  </div>
                  <div style={{marginTop:8, display:'flex', gap:8}}>
                    <button className="btn" style={{padding:'6px 10px'}} onClick={async()=>{ try{ await api.post(`/api/restaurant/tables/${t.id}/regenerate_qr/`); load() }catch{} }}>Regenerate QR</button>
                    {downloadHref && (
                      <a className="btn" style={{padding:'6px 10px'}} href={downloadHref} download target="_blank" rel="noreferrer">Завантажити QR</a>
                    )}
                  </div>
                </div>
                {imgSrc && (
                  <div style={{minWidth:110, textAlign:'right'}}>
                    <img alt="QR" src={imgSrc} style={{width:100, height:100, objectFit:'contain', border:'1px solid #eee', borderRadius:8}} />
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}


