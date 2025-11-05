import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Category = { id:number; name:string; description?:string; sort_order?:number; is_active?:boolean }

export default function MenuCategories(){
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<{name:string; description:string; sort_order:string; is_active:boolean}>({name:'', description:'', sort_order:'0', is_active:true})
  const [editingId, setEditingId] = useState<number|undefined>(undefined)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function load(){ api.get('/api/restaurant/categories/').then(({data})=>setCategories(data||[])).catch(()=>{}) }
  useEffect(()=>{ load() },[])

  function startEdit(c:Category){
    setEditingId(c.id)
    setForm({ name:c.name||'', description:c.description||'', sort_order:String(c.sort_order||0), is_active:!!c.is_active })
  }

  async function submit(){
    setLoading(true); setMessage('')
    try{
      const payload:any = { name: form.name, description: form.description, sort_order: Number(form.sort_order), is_active: form.is_active }
      if(!payload.name){ setMessage('Вкажіть назву'); setLoading(false); return }
      if(editingId){ await api.patch(`/api/restaurant/categories/${editingId}/`, payload); setMessage('Оновлено') }
      else { await api.post('/api/restaurant/categories/', payload); setMessage('Створено') }
      setForm({name:'', description:'', sort_order:'0', is_active:true}); setEditingId(undefined); load()
    }catch(e:any){ setMessage(e?.response?.data?.error || e.message || 'Помилка') }
    finally{ setLoading(false) }
  }

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Menu-categories</h2>
        <div className="card">
          <div className="label">Назва</div>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <div className="label" style={{marginTop:8}}>Опис</div>
          <textarea className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <div className="label" style={{marginTop:8}}>Порядок</div>
          <input className="input" value={form.sort_order} onChange={e=>setForm({...form, sort_order:e.target.value})} />
          <div style={{marginTop:8}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active:e.target.checked})} />
              <span>Активна</span>
            </label>
          </div>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={submit} disabled={loading}>{loading?'...': (editingId? 'Оновити':'Створити')}</button>
            {message && <span style={{marginLeft:12}}>{message}</span>}
          </div>
        </div>
        <div className="grid" style={{gap:12, marginTop:12}}>
          {categories.map(c=> (
            <div key={c.id} className="card" style={{border:'1px solid #eee'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{fontWeight:600}}>{c.name}</div>
                <div>
                  <button className="btn" onClick={()=>startEdit(c)} style={{padding:'4px 8px'}}>Редагувати</button>
                </div>
              </div>
              {c.description && <div style={{opacity:0.8, marginTop:4}}>{c.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


