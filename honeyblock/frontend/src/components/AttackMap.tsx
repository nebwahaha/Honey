import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import type { Attacker } from '../types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Simple mapping of common countries to approximate coordinates
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United States': [-95, 38],
  'China': [105, 35],
  'Russia': [90, 60],
  'Germany': [10, 51],
  'France': [2, 47],
  'United Kingdom': [-2, 54],
  'Netherlands': [5, 52],
  'Brazil': [-51, -14],
  'India': [78, 21],
  'Japan': [138, 36],
  'South Korea': [128, 36],
  'Canada': [-106, 56],
  'Australia': [134, -25],
  'Philippines': [122, 12],
  'Vietnam': [106, 16],
  'Indonesia': [120, -5],
  'Singapore': [104, 1],
  'Taiwan': [121, 24],
  'Hong Kong': [114, 22],
  'Ukraine': [32, 49],
  'Poland': [20, 52],
  'Romania': [25, 46],
  'Turkey': [35, 39],
  'Iran': [53, 33],
  'Pakistan': [70, 30],
  'Bangladesh': [90, 24],
  'Thailand': [101, 14],
  'Mexico': [-102, 23],
  'Argentina': [-64, -34],
  'Colombia': [-74, 4],
  'South Africa': [25, -29],
  'Egypt': [30, 27],
  'Nigeria': [8, 10],
  'Kenya': [38, 0],
  'Italy': [12, 42],
  'Spain': [-4, 40],
  'Sweden': [18, 62],
  'Norway': [10, 62],
  'Finland': [26, 64],
  'Malaysia': [102, 4],
}

interface Props {
  attackers: Attacker[]
}

function AttackMap({ attackers }: Props) {
  // Build markers from attackers that have a known country
  const markers = attackers
    .filter(a => a.country && COUNTRY_COORDS[a.country])
    .reduce<{ country: string; coords: [number, number]; count: number }[]>((acc, a) => {
      const existing = acc.find(m => m.country === a.country)
      if (existing) {
        existing.count++
      } else {
        acc.push({
          country: a.country!,
          coords: COUNTRY_COORDS[a.country!],
          count: 1,
        })
      }
      return acc
    }, [])

  return (
    <div style={{ height: 280, position: 'relative' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [20, 20] }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e2a3a"
                stroke="#2a3558"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#2a3558', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {markers.map((m) => (
          <Marker key={m.country} coordinates={m.coords}>
            <circle
              r={Math.min(4 + m.count * 2, 14)}
              fill="#f5a623"
              opacity={0.85}
              stroke="#f5a623"
              strokeWidth={2}
              strokeOpacity={0.4}
            />
          </Marker>
        ))}
      </ComposableMap>

      {markers.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6b7280',
            fontSize: 13,
          }}
        >
          No geolocation data yet.
        </div>
      )}
    </div>
  )
}

export default AttackMap
