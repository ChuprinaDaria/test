import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import uk from './locales/uk.json'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de }, fr: { translation: fr }, uk: { translation: uk } },
  lng: (typeof window !== 'undefined' && window.localStorage.getItem('lang')) || (typeof navigator !== 'undefined' ? (navigator.language||'en').split('-')[0] : 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n

// Persist language changes
if (typeof window !== 'undefined'){
  i18n.on('languageChanged', (lng)=>{
    try{ window.localStorage.setItem('lang', lng) }catch{}
  })
}
