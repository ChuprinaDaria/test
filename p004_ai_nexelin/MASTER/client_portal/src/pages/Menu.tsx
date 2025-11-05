import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'

type Category = { id:number; name:string }
type MenuT = { id:number; name:string }
type Item = { id:number; name:string; description?:string; price?:number; is_available?:boolean }

export default function Menu(){
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [menus, setMenus] = useState<MenuT[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [menuId, setMenuId] = useState<number|''>('')
  const [categoryId, setCategoryId] = useState<number|''>('')

  const [form, setForm] = useState<{menu:number|''; category:number|''; name:string; description:string; price:string; discount_price:string; currency:string; image?:File|null; image_url:string; calories:string; proteins:string; fats:string; carbs:string; allergens:string[]; dietary_labels:string[]; ingredients:string; cooking_time:string; spicy_level:string; wine_pairing:string; chef_recommendation:boolean; popular_item:boolean; tags:string[]; is_available:boolean; available_from:string; available_until:string; stock_quantity:string}>({menu:'', category:'', name:'', description:'', price:'', discount_price:'', currency:'UAH', image:null, image_url:'', calories:'', proteins:'', fats:'', carbs:'', allergens:[], dietary_labels:[], ingredients:'', cooking_time:'', spicy_level:'0', wine_pairing:'', chef_recommendation:false, popular_item:false, tags:[], is_available:true, available_from:'', available_until:'', stock_quantity:''})

  const ALLERGEN_OPTIONS = ['gluten','dairy','eggs','nuts','peanuts','soy','fish','shellfish','sesame','celery']
  const DIETARY_OPTIONS = ['vegetarian','vegan','gluten-free','halal','kosher','dairy-free','nut-free','keto','paleo','low-carb']
  const TAG_OPTIONS = ['signature','seasonal','new','spicy','kids','bestseller','chef','limited','healthy','dessert']
  const [editingId, setEditingId] = useState<number|undefined>(undefined)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadDeps(){
    try{
      const [{data:cats}, {data:menusData}] = await Promise.all([
        api.get('/api/restaurant/categories/'),
        api.get('/api/restaurant/menus/')
      ])
      setCategories(cats||[])
      setMenus(menusData||[])
      // якщо нічого не вибрано — виставляємо перший
      if ((!menuId || menuId==='') && Array.isArray(menusData) && menusData.length) {
        setMenuId(menusData[0].id)
      }
      if ((!categoryId || categoryId==='') && Array.isArray(cats) && cats.length) {
        setCategoryId(cats[0].id)
      }
    }catch(_e){}
  }
  function loadItems(){
    const params = new URLSearchParams()
    if(menuId) params.set('menu', String(menuId))
    if(categoryId) params.set('category', String(categoryId))
    const qs = params.toString()? `?${params}` : ''
    api.get(`/api/restaurant/menu-items/${qs}`).then(({data})=>setItems(data||[])).catch(()=>{})
  }

  useEffect(()=>{ loadDeps() },[])
  useEffect(()=>{ loadItems() },[menuId, categoryId])

  

async function submit(){
  setLoading(true); setMessage('')
  try{
    const payload:any = {
      menu: (form.menu || menuId) ? Number(form.menu || menuId) : undefined,
      category: (form.category || categoryId) ? Number(form.category || categoryId) : undefined,
      name: form.name,
      description: form.description,
      is_available: form.is_available,
    }

    if(!payload.name || !String(payload.name).trim()){
      setMessage('Вкажіть назву блюда')
      setLoading(false)
      return
    }

    // завжди multipart
    const fd = new FormData()
    for (const [k, v] of Object.entries(payload)) fd.append(k, String(v ?? ''))
    if(form.price) fd.set('price', String(Number(form.price)))
    if(form.discount_price) fd.set('discount_price', String(Number(form.discount_price)))
    if(form.currency) fd.set('currency', form.currency)

    if(form.image) fd.append('image', form.image)
    if(form.image_url) fd.set('image_url', form.image_url)
    if(form.calories) fd.set('calories', form.calories)
    if(form.proteins) fd.set('proteins', form.proteins)
    if(form.fats) fd.set('fats', form.fats)
    if(form.carbs) fd.set('carbs', form.carbs)
    if(form.allergens && form.allergens.length) fd.set('allergens', JSON.stringify(form.allergens))
    if(form.dietary_labels && form.dietary_labels.length) fd.set('dietary_labels', JSON.stringify(form.dietary_labels))
    if(form.ingredients) fd.set('ingredients', form.ingredients)
    if(form.cooking_time) fd.set('cooking_time', form.cooking_time)
    if(form.spicy_level) fd.set('spicy_level', form.spicy_level)
    if(form.wine_pairing) fd.set('wine_pairing', form.wine_pairing)
    fd.set('chef_recommendation', String(form.chef_recommendation))
    fd.set('popular_item', String(form.popular_item))
    if(form.tags && form.tags.length) fd.set('tags', JSON.stringify(form.tags))
    fd.set('is_available', String(form.is_available))
    if(form.available_from) fd.set('available_from', form.available_from)
    if(form.available_until) fd.set('available_until', form.available_until)
    if(form.stock_quantity) fd.set('stock_quantity', form.stock_quantity)

    if(editingId){
      await api.patch(`/api/restaurant/menu-items/${editingId}/`, fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      setMessage('Оновлено')
    } else {
      await api.post('/api/restaurant/menu-items/', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      setMessage('Створено')
    }

    setForm({...form, name:'', description:'', price:'', discount_price:'', image:null})
    setEditingId(undefined)
    loadItems()
  } catch(e:any){
    console.log('ERROR', e?.response?.data || e)
    setMessage(
      (e?.response?.data && JSON.stringify(e.response.data)) ||
      e?.response?.data?.error ||
      e.message || 'Помилка'
    )
  } finally {
    setLoading(false)
  }
}

function startEdit(it:Item){
    setEditingId(it.id)
    setForm(f=>({
      ...f,
      name: it.name||'',
      description: it.description||'',
      price: (it.price!=null? String(it.price):''),
      is_available: Boolean(it.is_available)
    }))
  }

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>{t('menu.dishes')}</h2>
        <div className="grid" style={{gap:12}}>
          <div>
            <select className="input" value={menuId} onChange={e=>setMenuId(e.target.value? Number(e.target.value) : '')} style={{maxWidth:240}}>
              <option value="">{t('menu.all_menus')}</option>
              {menus.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <select className="input" value={categoryId} onChange={e=>setCategoryId(e.target.value? Number(e.target.value) : '')} style={{maxWidth:240}}>
              <option value="">{t('menu.all_categories')}</option>
              {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <div className="label">{t('menu.name')}</div>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{maxWidth:480}} />
          <div className="label" style={{marginTop:8}}>{t('menu.description')}</div>
          <textarea className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} style={{minHeight:120}} />
          <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end', marginTop:8}}>
            <div>
              <div className="label">{t('menu.price')}</div>
              <input className="input" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder="0" style={{maxWidth:140}} />
            </div>
            <div>
              <div className="label">{t('menu.discount_price')}</div>
              <input className="input" value={form.discount_price} onChange={e=>setForm({...form, discount_price:e.target.value})} placeholder="0" style={{maxWidth:140}} />
            </div>
            <div>
              <div className="label">{t('menu.currency')}</div>
              <input className="input" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} placeholder="UAH" style={{maxWidth:120}} />
            </div>
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.image')}</div>
          <input type="file" onChange={e=>setForm({...form, image: e.target.files?.[0]||null})} />
          <div className="label" style={{marginTop:8}}>{t('menu.image_url')}</div>
          <input className="input" value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})} placeholder="https://..." style={{maxWidth:520}} />
          <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end', marginTop:8}}>
            <div>
              <div className="label">{t('menu.calories')}</div>
              <input className="input" value={form.calories} onChange={e=>setForm({...form, calories:e.target.value})} style={{maxWidth:140}} />
            </div>
            <div>
              <div className="label">{t('menu.proteins')}</div>
              <input className="input" value={form.proteins} onChange={e=>setForm({...form, proteins:e.target.value})} style={{maxWidth:140}} />
            </div>
            <div>
              <div className="label">{t('menu.fats')}</div>
              <input className="input" value={form.fats} onChange={e=>setForm({...form, fats:e.target.value})} style={{maxWidth:140}} />
            </div>
            <div>
              <div className="label">{t('menu.carbs')}</div>
              <input className="input" value={form.carbs} onChange={e=>setForm({...form, carbs:e.target.value})} style={{maxWidth:140}} />
            </div>
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.allergens')}</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {ALLERGEN_OPTIONS.map(opt=>{
              const active = form.allergens.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  className="btn"
                  aria-pressed={active}
                  onClick={()=>setForm({...form, allergens: active? form.allergens.filter(a=>a!==opt): [...form.allergens, opt]})}
                  style={{
                    background: active? '#ff8c00':'#f5f5f5',
                    color: active? '#fff':'#333',
                    border: `1px solid ${active? '#ff8c00':'#ddd'}`,
                    borderRadius: 16,
                    padding: '6px 10px'
                  }}
                >{t(`allergens.${opt}`)}</button>
              )
            })}
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.dietary_labels')}</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {DIETARY_OPTIONS.map(opt=>{
              const active = form.dietary_labels.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  className="btn"
                  aria-pressed={active}
                  onClick={()=>setForm({...form, dietary_labels: active? form.dietary_labels.filter(a=>a!==opt): [...form.dietary_labels, opt]})}
                  style={{
                    background: active? '#ff8c00':'#f5f5f5',
                    color: active? '#fff':'#333',
                    border: `1px solid ${active? '#ff8c00':'#ddd'}`,
                    borderRadius: 16,
                    padding: '6px 10px'
                  }}
                >{t(`dietary.${opt}`)}</button>
              )
            })}
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.ingredients')}</div>
          <textarea className="input" value={form.ingredients} onChange={e=>setForm({...form, ingredients:e.target.value})} style={{minHeight:120}} />
          <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end', marginTop:8}}>
            <div>
              <div className="label">{t('menu.cooking_time')}</div>
              <input className="input" value={form.cooking_time} onChange={e=>setForm({...form, cooking_time:e.target.value})} style={{maxWidth:160}} />
            </div>
            <div>
              <div className="label">{t('menu.spicy_level')}</div>
              <input className="input" value={form.spicy_level} onChange={e=>setForm({...form, spicy_level:e.target.value})} style={{maxWidth:120}} />
            </div>
            <div>
              <div className="label">{t('menu.stock_quantity')}</div>
              <input className="input" value={form.stock_quantity} onChange={e=>setForm({...form, stock_quantity:e.target.value})} style={{maxWidth:140}} />
            </div>
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.wine_pairing')}</div>
          <textarea className="input" value={form.wine_pairing} onChange={e=>setForm({...form, wine_pairing:e.target.value})} style={{minHeight:100, maxWidth:520}} />
          <div style={{marginTop:8, display:'flex', gap:12}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.chef_recommendation} onChange={e=>setForm({...form, chef_recommendation:e.target.checked})} />
              <span>{t('menu.chef_recommendation')}</span>
            </label>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.popular_item} onChange={e=>setForm({...form, popular_item:e.target.checked})} />
              <span>{t('menu.popular_item')}</span>
            </label>
          </div>
          <div className="label" style={{marginTop:8}}>{t('menu.tags')}</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
            {TAG_OPTIONS.map(opt=>{
              const active = form.tags.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  className="btn"
                  aria-pressed={active}
                  onClick={()=>setForm({...form, tags: active? form.tags.filter(a=>a!==opt): [...form.tags, opt]})}
                  style={{
                    background: active? '#ff8c00':'#f5f5f5',
                    color: active? '#fff':'#333',
                    border: `1px solid ${active? '#ff8c00':'#ddd'}`,
                    borderRadius: 16,
                    padding: '6px 10px'
                  }}
                >{t(`tags.${opt}`)}</button>
              )
            })}
          </div>
          <div style={{marginTop:8}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form, is_available:e.target.checked})} />
              <span>{t('menu.available')}</span>
            </label>
          </div>
          <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end', marginTop:8}}>
            <div>
              <div className="label">{t('menu.available_from')}</div>
              <input className="input" value={form.available_from} onChange={e=>setForm({...form, available_from:e.target.value})} placeholder="09:00:00" style={{maxWidth:160}} />
            </div>
            <div>
              <div className="label">{t('menu.available_until')}</div>
              <input className="input" value={form.available_until} onChange={e=>setForm({...form, available_until:e.target.value})} placeholder="21:00:00" style={{maxWidth:160}} />
            </div>
          </div>
          <div style={{marginTop:8}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form, is_available:e.target.checked})} />
              <span>Доступний</span>
            </label>
          </div>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={submit} disabled={loading}>{loading?'...': (editingId? 'Оновити':'Створити')}</button>
            {message && <span style={{marginLeft:12}}>{message}</span>}
          </div>
        </div>

        <div className="grid" style={{gap:12, marginTop:12}}>
          {items.map(it=> {
            const backend = (import.meta as any).env?.VITE_API_BASE_URL || ''
            const imgSrc = (it as any).image
              ? (((it as any).image as string).startsWith('http') ? (it as any).image : `${backend}${(it as any).image}`)
              : (it as any).image_url
            return (
            <div key={it.id} className="card" style={{border:'1px solid #eee'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{fontWeight:600}}>{it.name}</div>
                <div>
                  <button className="btn" onClick={()=>startEdit(it)} style={{padding:'4px 8px'}}>Редагувати</button>
                </div>
              </div>
              {it.description && <div style={{opacity:0.8, marginTop:4}}>{it.description}</div>}
              <div style={{display:'flex', gap:12, marginTop:8, alignItems:'center'}}>
                <div>
                  {typeof (it as any).display_price !== 'undefined' && (
                    <span style={{fontWeight:600}}>
                      {(it as any).currency || 'UAH'} {String((it as any).display_price)}
                    </span>
                  )}
                  {typeof (it as any).discount_price !== 'undefined' && (it as any).discount_price && (
                    <span style={{marginLeft:8, textDecoration:'line-through', opacity:0.7}}>
                      {(it as any).currency || 'UAH'} {String((it as any).discount_price)}
                    </span>
                  )}
                </div>
                {imgSrc && <img alt="" src={imgSrc} style={{width:64, height:64, objectFit:'cover', borderRadius:8}} />}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}


