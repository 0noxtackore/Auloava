// ============================================================
// AULOAVA · Ads
// Carga el script de AdSense SOLO en páginas interiores
// (fuera de la portada) para no lastrar el rendimiento del aterrizaje.
// ============================================================

const ADS_CLIENT = 'ca-pub-6638994988863080'
const SCRIPT_ID = 'adsbygoogle-script'

let requested = false

export function loadAds() {
  if (requested || typeof window === 'undefined') return
  requested = true
  if (document.getElementById(SCRIPT_ID)) return
  const s = document.createElement('script')
  s.id = SCRIPT_ID
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`
  document.head.appendChild(s)
}