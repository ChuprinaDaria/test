import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const langs = [
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language || 'en'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelect = (lang: string) => {
    i18n.changeLanguage(lang)
    setOpen(false)
  }

  return (
    <div className="lang-wrapper" ref={ref}>
      <button
        className={`lang-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {langs.find(l => l.code === current)?.label || current.toUpperCase()}
        <span className="arrow">▼</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {langs.map(lang => (
            <div
              key={lang.code}
              className={`lang-option ${lang.code === current ? 'active' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
