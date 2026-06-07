export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<{ lat: number; lng: number } | null> {
  const q = [address, city, state, zip].filter(Boolean).join(', ')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'MorganLawnServices/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
