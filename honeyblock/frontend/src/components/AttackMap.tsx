import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import type { Attacker } from '../types'
import { useTheme } from '../theme'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Comprehensive country → [lng, lat] mapping (capitals / centroids)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // ── Africa ──
  'Algeria': [3, 28], 'Angola': [17, -12], 'Benin': [2, 9], 'Botswana': [24, -22],
  'Burkina Faso': [-2, 13], 'Burundi': [30, -3], 'Cabo Verde': [-24, 15], 'Cape Verde': [-24, 15],
  'Cameroon': [12, 6], 'Central African Republic': [21, 7], 'Chad': [19, 15],
  'Comoros': [44, -12], 'Congo': [16, -1], 'Republic of the Congo': [16, -1],
  'Democratic Republic of the Congo': [24, -3], 'DR Congo': [24, -3],
  "Côte d'Ivoire": [-5, 7], 'Ivory Coast': [-5, 7], 'Djibouti': [43, 12],
  'Egypt': [30, 27], 'Equatorial Guinea': [10, 2], 'Eritrea': [39, 15],
  'Eswatini': [31, -27], 'Swaziland': [31, -27], 'Ethiopia': [40, 9],
  'Gabon': [12, -1], 'Gambia': [-16, 13], 'Ghana': [-2, 8], 'Guinea': [-10, 11],
  'Guinea-Bissau': [-15, 12], 'Kenya': [38, 0], 'Lesotho': [29, -30],
  'Liberia': [-10, 6], 'Libya': [17, 27], 'Madagascar': [47, -19], 'Malawi': [34, -14],
  'Mali': [-4, 17], 'Mauritania': [-10, 20], 'Mauritius': [58, -20],
  'Morocco': [-6, 32], 'Mozambique': [35, -18], 'Namibia': [17, -22],
  'Niger': [8, 16], 'Nigeria': [8, 10], 'Rwanda': [30, -2],
  'São Tomé and Príncipe': [7, 1], 'Senegal': [-14, 14], 'Seychelles': [55, -5],
  'Sierra Leone': [-12, 9], 'Somalia': [46, 6], 'South Africa': [25, -29],
  'South Sudan': [32, 7], 'Sudan': [30, 16], 'Tanzania': [35, -6],
  'Togo': [1, 8], 'Tunisia': [9, 34], 'Uganda': [32, 1], 'Zambia': [28, -15],
  'Zimbabwe': [30, -20], 'Réunion': [55, -21],

  // ── Americas ──
  'Antigua and Barbuda': [-62, 17], 'Argentina': [-64, -34], 'Bahamas': [-77, 25],
  'Barbados': [-60, 13], 'Belize': [-89, 17], 'Bolivia': [-65, -17], 'Brazil': [-51, -14],
  'Canada': [-106, 56], 'Chile': [-71, -35], 'Colombia': [-74, 4], 'Costa Rica': [-84, 10],
  'Cuba': [-80, 22], 'Dominica': [-61, 15], 'Dominican Republic': [-70, 19],
  'Ecuador': [-78, -2], 'El Salvador': [-89, 14], 'Grenada': [-62, 12],
  'Guatemala': [-90, 15], 'Guyana': [-59, 5], 'Haiti': [-72, 19],
  'Honduras': [-87, 15], 'Jamaica': [-77, 18], 'Mexico': [-102, 23],
  'Nicaragua': [-85, 13], 'Panama': [-80, 9], 'Paraguay': [-58, -23],
  'Peru': [-76, -10], 'Puerto Rico': [-66, 18], 'Saint Kitts and Nevis': [-63, 17],
  'Saint Lucia': [-61, 14], 'Saint Vincent and the Grenadines': [-61, 13],
  'Suriname': [-56, 4], 'Trinidad and Tobago': [-61, 11], 'United States': [-95, 38],
  'Uruguay': [-56, -33], 'Venezuela': [-66, 7],

  // ── Asia ──
  'Afghanistan': [67, 33], 'Armenia': [45, 40], 'Azerbaijan': [50, 41],
  'Bahrain': [51, 26], 'Bangladesh': [90, 24], 'Bhutan': [90, 28],
  'Brunei': [115, 5], 'Brunei Darussalam': [115, 5], 'Cambodia': [105, 13],
  'China': [105, 35], 'Cyprus': [33, 35], 'Georgia': [44, 42],
  'Hong Kong': [114, 22], 'India': [78, 21], 'Indonesia': [120, -5],
  'Iran': [53, 33], 'Iran, Islamic Republic of': [53, 33], 'Iraq': [44, 33],
  'Israel': [35, 31], 'Japan': [138, 36], 'Jordan': [36, 31],
  'Kazakhstan': [67, 48], 'Kuwait': [48, 29], 'Kyrgyzstan': [75, 41],
  'Laos': [103, 18], "Lao People's Democratic Republic": [103, 18],
  'Lebanon': [36, 34], 'Macau': [114, 22], 'Macao': [114, 22],
  'Malaysia': [102, 4], 'Maldives': [73, 3], 'Mongolia': [104, 47],
  'Myanmar': [96, 20], 'Nepal': [84, 28], 'North Korea': [127, 40],
  "Korea, Democratic People's Republic of": [127, 40],
  'Oman': [56, 21], 'Pakistan': [70, 30], 'Palestine': [35, 32],
  'Palestinian Territory': [35, 32], 'Philippines': [122, 12], 'Qatar': [51, 25],
  'Saudi Arabia': [45, 24], 'Singapore': [104, 1], 'South Korea': [128, 36],
  'Korea': [128, 36], 'Republic of Korea': [128, 36], 'Korea, Republic of': [128, 36],
  'Sri Lanka': [81, 7], 'Syria': [38, 35], 'Syrian Arab Republic': [38, 35],
  'Taiwan': [121, 24], 'Taiwan, Province of China': [121, 24],
  'Tajikistan': [69, 39], 'Thailand': [101, 14], 'Timor-Leste': [126, -9],
  'Turkey': [35, 39], 'Türkiye': [35, 39], 'Turkmenistan': [59, 39],
  'United Arab Emirates': [54, 24], 'Uzbekistan': [64, 41],
  'Vietnam': [106, 16], 'Viet Nam': [106, 16], 'Yemen': [48, 15],

  // ── Europe ──
  'Albania': [20, 41], 'Andorra': [2, 43], 'Austria': [14, 47],
  'Belarus': [28, 54], 'Belgium': [4, 51], 'Bosnia and Herzegovina': [18, 44],
  'Bulgaria': [25, 43], 'Croatia': [16, 45], 'Czech Republic': [15, 50],
  'Czechia': [15, 50], 'Denmark': [10, 56], 'Estonia': [26, 59],
  'Finland': [26, 64], 'France': [2, 47], 'Germany': [10, 51],
  'Greece': [22, 39], 'Hungary': [20, 47], 'Iceland': [-19, 65],
  'Ireland': [-8, 53], 'Italy': [12, 42], 'Kosovo': [21, 43],
  'Latvia': [25, 57], 'Liechtenstein': [10, 47], 'Lithuania': [24, 56],
  'Luxembourg': [6, 50], 'Malta': [14, 36], 'Moldova': [29, 47],
  'Republic of Moldova': [29, 47], 'Monaco': [7, 44], 'Montenegro': [19, 43],
  'Netherlands': [5, 52], 'The Netherlands': [5, 52], 'North Macedonia': [22, 41],
  'Norway': [10, 62], 'Poland': [20, 52], 'Portugal': [-8, 40],
  'Romania': [25, 46], 'Russia': [90, 60], 'Russian Federation': [90, 60],
  'San Marino': [12, 44], 'Serbia': [21, 44], 'Slovakia': [19, 49],
  'Slovenia': [15, 46], 'Spain': [-4, 40], 'Sweden': [18, 62],
  'Switzerland': [8, 47], 'Ukraine': [32, 49], 'United Kingdom': [-2, 54],
  'Vatican City': [12, 42],

  // ── Oceania ──
  'Australia': [134, -25], 'Fiji': [178, -18], 'New Zealand': [174, -41],
  'Papua New Guinea': [147, -6], 'Samoa': [-172, -14], 'Solomon Islands': [160, -9],
  'Tonga': [-175, -21], 'Vanuatu': [167, -16],
}

interface Props {
  attackers: Attacker[]
}

function AttackMap({ attackers }: Props) {
  const { theme } = useTheme()
  const [zoom, setZoom] = useState(1.8)
  const [center, setCenter] = useState<[number, number]>([40, 25])
  const [tooltip, setTooltip] = useState<{ country: string; count: number; x: number; y: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const btnStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.btnBg,
    border: `1px solid ${theme.btnBorder}`,
    borderRadius: 4,
    color: theme.btnText,
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
  }

  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    const svg = el.querySelector('svg')
    if (!svg) return
    const blockZoom = (e: WheelEvent) => { e.stopPropagation() }
    svg.addEventListener('wheel', blockZoom, { passive: true, capture: true })
    return () => svg.removeEventListener('wheel', blockZoom, { capture: true })
  })

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.4, 8))
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.4, 1))

  const handleMoveEnd = ({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) => {
    const lng = Math.max(-180, Math.min(180, coordinates[0]))
    const lat = Math.max(-60, Math.min(75, coordinates[1]))
    setCenter([lng, lat])
    setZoom(z)
  }

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
    <div ref={mapRef} style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [0, 0] }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
          translateExtent={[[-800, -400], [800, 600]]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={theme.mapFill}
                  stroke={theme.mapStroke}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: theme.mapStroke, outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {markers.map((m) => (
            <Marker key={m.country} coordinates={m.coords}>
              <circle
                r={Math.min(4 + m.count * 2, 14) / Math.sqrt(zoom)}
                fill={theme.mapMarker}
                opacity={0.85}
                stroke={theme.mapMarker}
                strokeWidth={2 / Math.sqrt(zoom)}
                strokeOpacity={0.4}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGCircleElement).closest('div')?.getBoundingClientRect()
                  const svgRect = (e.target as SVGCircleElement).getBoundingClientRect()
                  if (rect) {
                    setTooltip({
                      country: m.country,
                      count: m.count,
                      x: svgRect.left - rect.left + svgRect.width / 2,
                      y: svgRect.top - rect.top - 8,
                    })
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: theme.tooltipBg,
            border: `1px solid ${theme.tooltipBorder}`,
            borderRadius: 6,
            padding: '6px 10px',
            color: theme.textPrimary,
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: `0 4px 12px ${theme.shadow}`,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: theme.heading }}>{tooltip.country}</div>
          <div>{tooltip.count} attacker{tooltip.count !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={handleZoomIn} style={btnStyle}>+</button>
        <button onClick={handleZoomOut} style={btnStyle}>-</button>
      </div>

      {markers.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: theme.textSecondary,
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
