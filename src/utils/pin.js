// ============================================================
// AULOAVA · Generador de pines Pinterest (1000x1500, ratio 2:3)
// Dibuja el pin en un <canvas> en el navegador y descarga la PNG.
// Las imágenes de Amazon responden Access-Control-Allow-Origin: *,
// así que no hacen falta servidores ni librerías externas.
// ============================================================
import { decodeHtml, formatPrice } from './formatters'
import { optimizeProductImage } from './images'

const W = 1000
const H = 1500

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('no se pudo cargar la imagen'))
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function saveCanvas(canvas, name) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

export async function downloadPin(product) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fondo: degradado verde de marca
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#065f46')
  bg.addColorStop(0.55, '#0a7a4f')
  bg.addColorStop(1, '#16a34a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Círculos decorativos tenues
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath()
  ctx.arc(140, 120, 180, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(940, 1410, 220, 0, Math.PI * 2)
  ctx.fill()

  // Foto del producto (recorte cuadrado redondeado)
  const imgSize = 868
  const imgX = (W - imgSize) / 2
  const imgY = 64
  try {
    const img = await loadImage(optimizeProductImage(product.image, 800))
    roundRect(ctx, imgX, imgY, imgSize, imgSize, 30)
    ctx.save()
    ctx.clip()
    ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
    ctx.restore()
  } catch {
    /* si la foto falla, el pin sale solo con el texto */
  }

  const title = decodeHtml(product.title)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 54px Arial, sans-serif'
  const lines = wrapText(ctx, title, W - 140).slice(0, 3)
  let ty = imgY + imgSize + 96
  for (const line of lines) {
    ctx.fillText(line, 70, ty)
    ty += 66
  }

  // Precio + original tachado + % de descuento
  const raw = Number(product.price)
  if (Number.isFinite(raw) && raw > 0) {
    const price = formatPrice(raw)
    const original = Number(product.originalPrice)

    let px = 70
    ctx.font = '800 66px Arial, sans-serif'
    ctx.fillStyle = '#fef08a'
    ctx.textAlign = 'left'
    ctx.fillText(price, px, ty + 16)

    if (Number.isFinite(original) && original > raw) {
      ctx.font = '600 44px Arial, sans-serif'
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 3
      ctx.strokeText(formatPrice(original), px + ctx.measureText(price).width + 34, ty + 12)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(formatPrice(original), px + ctx.measureText(price).width + 34, ty + 12)

      const discount = Math.round((1 - raw / original) * 100)
      if (discount > 0) {
        ctx.font = '800 44px Arial, sans-serif'
        const badge = `-${discount}%`
        const bw = ctx.measureText(badge).width + 44
        const bx = px + ctx.measureText(price).width + ctx.measureText(formatPrice(original)).width + 92
        ctx.fillStyle = '#f43f5e'
        roundRect(ctx, bx, ty - 30, bw, 56, 28)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.font = '800 38px Arial, sans-serif'
        ctx.fillText(badge, bx + 22, ty + 8)
      }
    }
  }

  // Marca + enlace
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '700 34px Arial, sans-serif'
  ctx.fillText('AULOAVA', 70, H - 74)
  ctx.font = '600 30px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('Ofertas verificadas · auloava.netlify.app', 70, H - 40)

  saveCanvas(canvas, `auloava-pin-${slugify(title)}.png`)
}