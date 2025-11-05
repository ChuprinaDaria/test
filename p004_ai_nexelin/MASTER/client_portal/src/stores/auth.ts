import { create } from 'zustand'
import { api, setAuthToken } from '../lib/api'

interface InitParams{ branch:string; specialization:string; token:string }
interface AuthState{
  access?:string
  refresh?:string
  client?:{ id:number; username:string; email:string }
  loading:boolean
  error?:string
  init:(p:InitParams)=>Promise<void>
}

export const useAuthStore = create<AuthState>((set)=>({
  loading:false,
  async init({ branch, specialization, token }){
    set({ loading:true, error:undefined })
    try{
      // 1) Bootstrap (idempotent)
      await api.post(`/api/rag/bootstrap/${branch}/${specialization}/${token}/`)
      // 2) JWT by client token
      const { data } = await api.post('/api/rag/auth/token-by-client-token/', { client_token: token })
      setAuthToken(data.access)
      set({ access:data.access, refresh:data.refresh, client:data.client, loading:false })
    }catch(e:any){
      set({ error: e?.response?.data?.error || e.message || 'Auth error', loading:false })
    }
  }
}))
