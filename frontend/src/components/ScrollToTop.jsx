import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Har safar yangi sahifaga o'tilganda tepaga qaytaradi.
   Aks holda oldingi sahifada pastga scroll qilingan holat
   yangi sahifada ham saqlanib qoladi. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
