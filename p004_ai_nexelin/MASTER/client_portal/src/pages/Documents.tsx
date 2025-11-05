import { useState } from 'react'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'

export default function Documents(){
  const [file, setFile] = useState<File|null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const onUpload = async ()=>{
    if(!file){ setMessage(t('file_not_selected')); return }
    setLoading(true); setMessage('')
    try{
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title || file.name)
      const { data } = await api.post('/api/rag/upload/', fd, { headers: { 'Content-Type':'multipart/form-data' } })
      setMessage(`Uploaded: ${data.document_id}`)
    }catch(e:any){
      setMessage(e?.response?.data?.error || e.message || 'Upload error')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="grid" style={{gap:20}}>
      <div className="card">
        <h2 style={{marginTop:0}}>{t('documents')}</h2>

        <div className="label">{t('title')}</div>
        <input
          className="input"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder={t('title')}
        />

        <div className="label" style={{marginTop:12}}>{t('file')}</div>

        <div className="file-actions">
          <label className="btn btn--secondary" style={{ cursor: 'pointer' }}>
            {file ? file.name : t('choose_file')}
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </label>
          
          <button
            className="btn btn--primary"
            onClick={onUpload}
            disabled={loading}
          >
            {loading ? t('loading') : t('upload')}
          </button>
        </div>


        {message && <div style={{marginTop:12}}>{message}</div>}
      </div>
    </div>
  )
}
