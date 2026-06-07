function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function totalRouteDistance(
  jobs: Array<{ lat?: number | null; lng?: number | null }>
): number {
  let dist = 0
  for (let i = 0; i < jobs.length - 1; i++) {
    const a = jobs[i]
    const b = jobs[i + 1]
    if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
      dist += haversine(a.lat, a.lng, b.lat, b.lng)
    }
  }
  return Math.round(dist * 10) / 10
}

export function optimizeRoute<T extends { lat?: number | null; lng?: number | null }>(
  items: T[]
): T[] {
  const withCoords = items.filter(j => j.lat != null && j.lng != null)
  const withoutCoords = items.filter(j => j.lat == null || j.lng == null)

  if (withCoords.length < 2) return items

  const remaining = [...withCoords]
  const ordered: T[] = []
  let cur = remaining.splice(0, 1)[0]
  ordered.push(cur)

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    remaining.forEach((j, i) => {
      const d = haversine(cur.lat!, cur.lng!, j.lat!, j.lng!)
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    })
    cur = remaining.splice(nearestIdx, 1)[0]
    ordered.push(cur)
  }

  return [...ordered, ...withoutCoords]
}
