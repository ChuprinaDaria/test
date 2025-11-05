import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Order = { id:number; status:string; created_at:string; table?:{ id:number; table_number:number } }

export default function Orders(){
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(()=>{
    api.get('/api/restaurant/orders/').then(({data})=>setOrders(data||[])).catch(()=>{})
  },[])

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Orders</h2>
        <div className="grid" style={{gap:12}}>
          {orders.map(o=> (
            <div key={o.id} className="card" style={{border:'1px solid #eee'}}>
              <div style={{fontWeight:600}}>#{o.id} — {o.status}</div>
              <div style={{opacity:0.8, marginTop:4}}>{new Date(o.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


