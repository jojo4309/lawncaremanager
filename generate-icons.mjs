// Quick script to generate placeholder PWA icons using canvas-like SVG
// Run: node generate-icons.mjs
// In production replace with real icons

import { writeFileSync } from 'fs'

function svgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#16a34a"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="-apple-system, sans-serif" font-weight="bold" fill="white"
    font-size="${size * 0.45}">🌿</text>
</svg>`
}

writeFileSync('public/pwa-192x192.svg', svgIcon(192))
writeFileSync('public/pwa-512x512.svg', svgIcon(512))
console.log('SVG icons generated in public/')
