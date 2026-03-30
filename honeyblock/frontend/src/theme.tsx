import { createContext, useContext, useState, useEffect } from 'react'

export interface Theme {
  name: string
  // Page
  pageBg: string
  text: string
  scrollbarThumb: string
  // Sidebar
  sidebarBg: string
  sidebarBorder: string
  brand: string
  navText: string
  navActiveBg: string
  navActiveText: string
  // Cards
  cardBg: string
  cardBorder: string
  cardHoverBg: string
  cardHoverBorder: string
  iconAccentBg: string
  iconAccent: string
  // Text
  heading: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  axisTick: string
  // Tooltip
  tooltipBg: string
  tooltipBorder: string
  // Status
  success: string
  error: string
  badgeRed: string
  bluePrimary: string
  blueLink: string
  amber: string
  orange: string
  blockBtn: string
  unblockBtn: string
  // Tables
  tableHeaderBg: string
  tableRowEven: string
  tableRowOdd: string
  // Feed
  feedBg: string
  feedBorder: string
  arrow: string
  // Map
  mapFill: string
  mapStroke: string
  mapMarker: string
  // Overlays
  modalOverlay: string
  shadow: string
  dropdownShadow: string
  barCursor: string
  // Live feed action colors
  sessionClosed: string
  tcpTunnel: string
  fileDownload: string
  // Notification
  blockStatusActiveBg: string
  blockStatusInactiveBg: string
  notifItemBg: string
  // Config toggles
  toggleActiveBorder: string
  toggleActiveText: string
  toggleInactiveBorder: string
  toggleInactiveText: string
  toggleDisabledBg: string
  // Messages
  messageBgError: string
  messageBgSuccess: string
  // Pie chart stroke
  pieStroke: string
  // Button
  btnBg: string
  btnBorder: string
  btnText: string
}

export const darkTheme: Theme = {
  name: 'dark',
  pageBg: '#0b0e14',
  text: '#c9d1d9',
  scrollbarThumb: '#2a3040',
  sidebarBg: '#111521',
  sidebarBorder: '#1e2433',
  brand: '#7b8cde',
  navText: '#8b8fa8',
  navActiveBg: '#2a3558',
  navActiveText: '#ffffff',
  cardBg: '#151a28',
  cardBorder: '#1e2a3a',
  cardHoverBg: '#1c2540',
  cardHoverBorder: '#3a4a6a',
  iconAccentBg: '#1c2540',
  iconAccent: '#7b8cde',
  heading: '#ffffff',
  textPrimary: '#c9d1d9',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  axisTick: '#8b95a5',
  tooltipBg: '#1c2540',
  tooltipBorder: '#2a3558',
  success: '#3fb950',
  error: '#f85149',
  badgeRed: '#e74c3c',
  bluePrimary: '#2563eb',
  blueLink: '#58a6ff',
  amber: '#f59e0b',
  orange: '#f5a623',
  blockBtn: '#d32f2f',
  unblockBtn: '#2e7d32',
  tableHeaderBg: '#111521',
  tableRowEven: '#131824',
  tableRowOdd: '#111521',
  feedBg: '#0d1117',
  feedBorder: '#1a2030',
  arrow: '#484f58',
  mapFill: '#1e2a3a',
  mapStroke: '#2a3558',
  mapMarker: '#f5a623',
  modalOverlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
  dropdownShadow: 'rgba(0,0,0,0.5)',
  barCursor: 'rgba(123, 140, 222, 0.08)',
  sessionClosed: '#8b949e',
  tcpTunnel: '#d2a8ff',
  fileDownload: '#ff7b72',
  blockStatusActiveBg: '#2d1b1b',
  blockStatusInactiveBg: '#1a1f2e',
  notifItemBg: '#111521',
  toggleActiveBorder: '#f59e0b',
  toggleActiveText: '#f59e0b',
  toggleInactiveBorder: '#444',
  toggleInactiveText: '#888',
  toggleDisabledBg: '#555',
  messageBgError: '#2d1b1b',
  messageBgSuccess: '#1b2d1b',
  pieStroke: '#151a28',
  btnBg: '#1c2540',
  btnBorder: '#2a3558',
  btnText: '#9ca3af',
}

export const softLightTheme: Theme = {
  name: 'soft-light',
  pageBg: '#eef0f4',
  text: '#3d4350',
  scrollbarThumb: '#bfc3cc',
  sidebarBg: '#e0e3ea',
  sidebarBorder: '#cdd1da',
  brand: '#5b6abf',
  navText: '#6b7085',
  navActiveBg: '#cdd3e3',
  navActiveText: '#1a1e2e',
  cardBg: '#e4e7ed',
  cardBorder: '#cdd1da',
  cardHoverBg: '#d8dbe3',
  cardHoverBorder: '#b0b5c5',
  iconAccentBg: '#d8dbe3',
  iconAccent: '#5b6abf',
  heading: '#1a1e2e',
  textPrimary: '#3d4350',
  textSecondary: '#6b7280',
  textTertiary: '#7c8190',
  axisTick: '#6b7280',
  tooltipBg: '#e4e7ed',
  tooltipBorder: '#bfc3cc',
  success: '#2da44e',
  error: '#cf222e',
  badgeRed: '#cf222e',
  bluePrimary: '#2563eb',
  blueLink: '#0969da',
  amber: '#d4830b',
  orange: '#d4830b',
  blockBtn: '#cf222e',
  unblockBtn: '#2da44e',
  tableHeaderBg: '#d8dbe3',
  tableRowEven: '#e4e7ed',
  tableRowOdd: '#dfe2e9',
  feedBg: '#dfe2e9',
  feedBorder: '#cdd1da',
  arrow: '#7c8190',
  mapFill: '#cdd1da',
  mapStroke: '#b0b5c5',
  mapMarker: '#d4830b',
  modalOverlay: 'rgba(0,0,0,0.3)',
  shadow: 'rgba(0,0,0,0.08)',
  dropdownShadow: 'rgba(0,0,0,0.15)',
  barCursor: 'rgba(91, 106, 191, 0.1)',
  sessionClosed: '#6b7085',
  tcpTunnel: '#8250df',
  fileDownload: '#cf222e',
  blockStatusActiveBg: '#fce4e4',
  blockStatusInactiveBg: '#dfe2e9',
  notifItemBg: '#dfe2e9',
  toggleActiveBorder: '#d4830b',
  toggleActiveText: '#d4830b',
  toggleInactiveBorder: '#b0b5c5',
  toggleInactiveText: '#7c8190',
  toggleDisabledBg: '#b0b5c5',
  messageBgError: '#fce4e4',
  messageBgSuccess: '#ddf4e4',
  pieStroke: '#e4e7ed',
  btnBg: '#d8dbe3',
  btnBorder: '#bfc3cc',
  btnText: '#6b7085',
}

export const forestTheme: Theme = {
  name: 'forest',
  // Palette: #253D2C (darkest), #2E6F40 (mid-dark), #68BA7F (mid-light), #CFFFDC (lightest)
  pageBg: '#253D2C',
  text: '#c2e0cc',
  scrollbarThumb: '#2E6F40',
  sidebarBg: '#1e3328',
  sidebarBorder: '#2a4d38',
  brand: '#68BA7F',
  navText: '#7dab8c',
  navActiveBg: '#2a4d38',
  navActiveText: '#CFFFDC',
  cardBg: '#2E6F40',
  cardBorder: '#3a7d4d',
  cardHoverBg: '#3a7d4d',
  cardHoverBorder: '#4a8d5d',
  iconAccentBg: '#3a7d4d',
  iconAccent: '#CFFFDC',
  heading: '#CFFFDC',
  textPrimary: '#e0f5ec',
  textSecondary: '#a3d4b5',
  textTertiary: '#b5dfc5',
  axisTick: '#a3d4b5',
  tooltipBg: '#2E6F40',
  tooltipBorder: '#3a7d4d',
  success: '#68BA7F',
  error: '#e5634d',
  badgeRed: '#d94f3b',
  bluePrimary: '#2E6F40',
  blueLink: '#CFFFDC',
  amber: '#d4a14b',
  orange: '#d4a14b',
  blockBtn: '#c0453a',
  unblockBtn: '#2E6F40',
  tableHeaderBg: '#2a6038',
  tableRowEven: '#2E6F40',
  tableRowOdd: '#2a6038',
  feedBg: '#2a6038',
  feedBorder: '#3a7d4d',
  arrow: '#68BA7F',
  mapFill: '#2a4d38',
  mapStroke: '#3a7d4d',
  mapMarker: '#CFFFDC',
  modalOverlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
  dropdownShadow: 'rgba(0,0,0,0.5)',
  barCursor: 'rgba(104, 186, 127, 0.1)',
  sessionClosed: '#6b9a7a',
  tcpTunnel: '#CFFFDC',
  fileDownload: '#e5634d',
  blockStatusActiveBg: '#2d1b18',
  blockStatusInactiveBg: '#2a6038',
  notifItemBg: '#2a6038',
  toggleActiveBorder: '#68BA7F',
  toggleActiveText: '#68BA7F',
  toggleInactiveBorder: '#2E6F40',
  toggleInactiveText: '#6b9a7a',
  toggleDisabledBg: '#3a7d4d',
  messageBgError: '#2d1b18',
  messageBgSuccess: '#1e3d28',
  pieStroke: '#2E6F40',
  btnBg: '#3a7d4d',
  btnBorder: '#4a8d5d',
  btnText: '#CFFFDC',
}

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  'soft-light': softLightTheme,
  forest: forestTheme,
}

const THEME_KEY = 'hb_theme'

interface ThemeContextValue {
  theme: Theme
  themeName: string
  setThemeName: (name: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeName: 'dark',
  setThemeName: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem(THEME_KEY) ?? 'dark'
  })

  const theme = themes[themeName] ?? darkTheme

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeName)
    // Set CSS variables for body-level styles
    const root = document.documentElement
    root.style.setProperty('--page-bg', theme.pageBg)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--scrollbar-thumb', theme.scrollbarThumb)
  }, [themeName, theme])

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
