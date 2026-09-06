import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('en')

  const toggleLanguage = () => setLanguage(l => l === 'en' ? 'hi' : 'en')
  const t = (en, hi) => language === 'hi' ? hi : en

  return (
    <AppContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
