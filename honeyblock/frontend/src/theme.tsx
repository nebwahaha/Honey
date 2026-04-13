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
  // Neutral charcoal gray base with lighter orange accents
  pageBg: '#1c1c1c',
  text: '#c0c0c0',
  scrollbarThumb: '#363636',
  sidebarBg: '#151515',
  sidebarBorder: '#2a2a2a',
  brand: '#f0ac4c',
  navText: '#7a7a7a',
  navActiveBg: '#2a2a2a',
  navActiveText: '#f0ac4c',
  cardBg: '#242424',
  cardBorder: '#303030',
  cardHoverBg: '#2c2c2c',
  cardHoverBorder: '#424242',
  iconAccentBg: '#282828',
  iconAccent: '#f0ac4c',
  heading: '#ececec',
  textPrimary: '#c8c8c8',
  textSecondary: '#6e6e6e',
  textTertiary: '#929292',
  axisTick: '#7a7a7a',
  tooltipBg: '#272727',
  tooltipBorder: '#363636',
  success: '#3fb950',
  error: '#f85149',
  badgeRed: '#e74c3c',
  bluePrimary: '#303030',
  blueLink: '#f0ac4c',
  amber: '#f0ac4c',
  orange: '#f5b860',
  blockBtn: '#d32f2f',
  unblockBtn: '#2e7d32',
  tableHeaderBg: '#1e1e1e',
  tableRowEven: '#242424',
  tableRowOdd: '#202020',
  feedBg: '#202020',
  feedBorder: '#303030',
  arrow: '#4a4a4a',
  mapFill: '#2a2a2a',
  mapStroke: '#363636',
  mapMarker: '#f5b860',
  modalOverlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
  dropdownShadow: 'rgba(0,0,0,0.5)',
  barCursor: 'rgba(240, 172, 76, 0.08)',
  sessionClosed: '#7a7a7a',
  tcpTunnel: '#d4b070',
  fileDownload: '#ff7b72',
  blockStatusActiveBg: '#2d1b1b',
  blockStatusInactiveBg: '#242424',
  notifItemBg: '#202020',
  toggleActiveBorder: '#f0ac4c',
  toggleActiveText: '#f0ac4c',
  toggleInactiveBorder: '#424242',
  toggleInactiveText: '#6e6e6e',
  toggleDisabledBg: '#303030',
  messageBgError: '#2d1b1b',
  messageBgSuccess: '#1b2d1b',
  pieStroke: '#242424',
  btnBg: '#282828',
  btnBorder: '#363636',
  btnText: '#929292',
}

export const softLightTheme: Theme = {
  name: 'soft-light',
  // Warm cream base with terracotta/earthy accents
  pageBg: '#f7f3ed',
  text: '#4a3f34',
  scrollbarThumb: '#c8bfb2',
  sidebarBg: '#ece6de',
  sidebarBorder: '#dbd3c7',
  brand: '#b06840',
  navText: '#8a7e70',
  navActiveBg: '#ddd4c6',
  navActiveText: '#2c2418',
  cardBg: '#efe9e1',
  cardBorder: '#dbd3c7',
  cardHoverBg: '#e4ddd3',
  cardHoverBorder: '#c0a88e',
  iconAccentBg: '#e4ddd3',
  iconAccent: '#b06840',
  heading: '#2c2418',
  textPrimary: '#4a3f34',
  textSecondary: '#8a7e70',
  textTertiary: '#9b8f80',
  axisTick: '#8a7e70',
  tooltipBg: '#efe9e1',
  tooltipBorder: '#c8bfb2',
  success: '#5a8a4a',
  error: '#c0453a',
  badgeRed: '#c0453a',
  bluePrimary: '#8a6a3e',
  blueLink: '#926f3e',
  amber: '#b8860b',
  orange: '#c47a2a',
  blockBtn: '#c0453a',
  unblockBtn: '#5a8a4a',
  tableHeaderBg: '#e4ddd3',
  tableRowEven: '#efe9e1',
  tableRowOdd: '#e9e2d8',
  feedBg: '#e9e2d8',
  feedBorder: '#dbd3c7',
  arrow: '#9b8f80',
  mapFill: '#dbd3c7',
  mapStroke: '#c0b5a5',
  mapMarker: '#b06840',
  modalOverlay: 'rgba(0,0,0,0.3)',
  shadow: 'rgba(0,0,0,0.08)',
  dropdownShadow: 'rgba(0,0,0,0.15)',
  barCursor: 'rgba(176, 104, 64, 0.1)',
  sessionClosed: '#8a7e70',
  tcpTunnel: '#7a5a3a',
  fileDownload: '#c0453a',
  blockStatusActiveBg: '#f5ddd5',
  blockStatusInactiveBg: '#e9e2d8',
  notifItemBg: '#e9e2d8',
  toggleActiveBorder: '#b06840',
  toggleActiveText: '#b06840',
  toggleInactiveBorder: '#c0b5a5',
  toggleInactiveText: '#9b8f80',
  toggleDisabledBg: '#c0b5a5',
  messageBgError: '#f5ddd5',
  messageBgSuccess: '#dde8d5',
  pieStroke: '#efe9e1',
  btnBg: '#e4ddd3',
  btnBorder: '#c8bfb2',
  btnText: '#8a7e70',
}

export const forestTheme: Theme = {
  name: 'forest',
  // Dark forest — deep green bg, lighter green cards, cohesive palette
  pageBg: '#0c1f16',
  text: '#93b8a0',
  scrollbarThumb: '#1a3f2e',
  sidebarBg: '#0a2017',
  sidebarBorder: '#163222',
  brand: '#5c8a6e',
  navText: '#4d7a60',
  navActiveBg: '#1a3f2e',
  navActiveText: '#b8d8c4',
  cardBg: '#1a3f2e',
  cardBorder: '#2a5540',
  cardHoverBg: '#224a38',
  cardHoverBorder: '#347050',
  iconAccentBg: '#224a38',
  iconAccent: '#5c8a6e',
  heading: '#d0e8da',
  textPrimary: '#93b8a0',
  textSecondary: '#4d7a60',
  textTertiary: '#5c8a6e',
  axisTick: '#4d7a60',
  tooltipBg: '#1a3f2e',
  tooltipBorder: '#2a5540',
  success: '#5c8a6e',
  error: '#d94f3b',
  badgeRed: '#c0453a',
  bluePrimary: '#2a5540',
  blueLink: '#93b8a0',
  amber: '#d4a14b',
  orange: '#d4a14b',
  blockBtn: '#c0453a',
  unblockBtn: '#2a5540',
  tableHeaderBg: '#163222',
  tableRowEven: '#1a3f2e',
  tableRowOdd: '#163222',
  feedBg: '#163222',
  feedBorder: '#2a5540',
  arrow: '#2a5540',
  mapFill: '#163222',
  mapStroke: '#2a5540',
  mapMarker: '#d0e8da',
  modalOverlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.4)',
  dropdownShadow: 'rgba(0,0,0,0.5)',
  barCursor: 'rgba(92, 138, 110, 0.1)',
  sessionClosed: '#4d7a60',
  tcpTunnel: '#93b8a0',
  fileDownload: '#d94f3b',
  blockStatusActiveBg: '#2d1b18',
  blockStatusInactiveBg: '#163222',
  notifItemBg: '#163222',
  toggleActiveBorder: '#5c8a6e',
  toggleActiveText: '#5c8a6e',
  toggleInactiveBorder: '#2a5540',
  toggleInactiveText: '#4d7a60',
  toggleDisabledBg: '#1a3f2e',
  messageBgError: '#2d1b18',
  messageBgSuccess: '#163222',
  pieStroke: '#1a3f2e',
  btnBg: '#224a38',
  btnBorder: '#2a5540',
  btnText: '#93b8a0',
}

export const oceanTheme: Theme = {
  name: 'ocean',
  // Palette: #1B262C (bg), #0F4C75 (cards), #3282B8 (accents), #BBE1FA (highlights)
  pageBg: '#111d22',
  text: '#94c8e0',
  scrollbarThumb: '#0F4C75',
  sidebarBg: '#0e1920',
  sidebarBorder: '#1a3a4d',
  brand: '#3282B8',
  navText: '#4a8aaa',
  navActiveBg: '#1a3a4d',
  navActiveText: '#BBE1FA',
  cardBg: '#0F4C75',
  cardBorder: '#1a6a9a',
  cardHoverBg: '#16598a',
  cardHoverBorder: '#3282B8',
  iconAccentBg: '#1a3a4d',
  iconAccent: '#3282B8',
  heading: '#daf0fc',
  textPrimary: '#BBE1FA',
  textSecondary: '#4a8aaa',
  textTertiary: '#5e9bba',
  axisTick: '#4a8aaa',
  tooltipBg: '#0F4C75',
  tooltipBorder: '#1a6a9a',
  success: '#3282B8',
  error: '#d94f3b',
  badgeRed: '#c0453a',
  bluePrimary: '#3282B8',
  blueLink: '#BBE1FA',
  amber: '#d4a14b',
  orange: '#d4a14b',
  blockBtn: '#c0453a',
  unblockBtn: '#1a6a9a',
  tableHeaderBg: '#0c3d5e',
  tableRowEven: '#0F4C75',
  tableRowOdd: '#0c3d5e',
  feedBg: '#0c3d5e',
  feedBorder: '#1a6a9a',
  arrow: '#3282B8',
  mapFill: '#1a3a4d',
  mapStroke: '#1a6a9a',
  mapMarker: '#BBE1FA',
  modalOverlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.4)',
  dropdownShadow: 'rgba(0,0,0,0.5)',
  barCursor: 'rgba(50, 130, 184, 0.12)',
  sessionClosed: '#4a8aaa',
  tcpTunnel: '#BBE1FA',
  fileDownload: '#d94f3b',
  blockStatusActiveBg: '#2d1b18',
  blockStatusInactiveBg: '#0c3d5e',
  notifItemBg: '#0c3d5e',
  toggleActiveBorder: '#3282B8',
  toggleActiveText: '#3282B8',
  toggleInactiveBorder: '#1a6a9a',
  toggleInactiveText: '#4a8aaa',
  toggleDisabledBg: '#1a3a4d',
  messageBgError: '#2d1b18',
  messageBgSuccess: '#0c3d5e',
  pieStroke: '#0F4C75',
  btnBg: '#1a3a4d',
  btnBorder: '#1a6a9a',
  btnText: '#BBE1FA',
}

export const skyTheme: Theme = {
  name: 'sky',
  // Palette: #27374D (dark), #526D82 (mid), #9DB2BF (light), #DDE6ED (lightest)
  pageBg: '#DDE6ED',
  text: '#27374D',
  scrollbarThumb: '#9DB2BF',
  sidebarBg: '#cdd8e2',
  sidebarBorder: '#b8c8d6',
  brand: '#526D82',
  navText: '#526D82',
  navActiveBg: '#b8c8d6',
  navActiveText: '#27374D',
  cardBg: '#c4d2de',
  cardBorder: '#9DB2BF',
  cardHoverBg: '#b8c8d6',
  cardHoverBorder: '#526D82',
  iconAccentBg: '#b8c8d6',
  iconAccent: '#27374D',
  heading: '#1a2636',
  textPrimary: '#27374D',
  textSecondary: '#526D82',
  textTertiary: '#6a8295',
  axisTick: '#526D82',
  tooltipBg: '#c4d2de',
  tooltipBorder: '#9DB2BF',
  success: '#2da44e',
  error: '#cf222e',
  badgeRed: '#cf222e',
  bluePrimary: '#526D82',
  blueLink: '#27374D',
  amber: '#b8860b',
  orange: '#b8860b',
  blockBtn: '#cf222e',
  unblockBtn: '#2da44e',
  tableHeaderBg: '#b8c8d6',
  tableRowEven: '#c4d2de',
  tableRowOdd: '#b8c8d6',
  feedBg: '#b8c8d6',
  feedBorder: '#9DB2BF',
  arrow: '#6a8295',
  mapFill: '#9DB2BF',
  mapStroke: '#526D82',
  mapMarker: '#27374D',
  modalOverlay: 'rgba(0,0,0,0.3)',
  shadow: 'rgba(0,0,0,0.08)',
  dropdownShadow: 'rgba(0,0,0,0.15)',
  barCursor: 'rgba(82, 109, 130, 0.12)',
  sessionClosed: '#6a8295',
  tcpTunnel: '#27374D',
  fileDownload: '#cf222e',
  blockStatusActiveBg: '#f5d5d5',
  blockStatusInactiveBg: '#b8c8d6',
  notifItemBg: '#b8c8d6',
  toggleActiveBorder: '#27374D',
  toggleActiveText: '#27374D',
  toggleInactiveBorder: '#9DB2BF',
  toggleInactiveText: '#6a8295',
  toggleDisabledBg: '#9DB2BF',
  messageBgError: '#f5d5d5',
  messageBgSuccess: '#d5f0dc',
  pieStroke: '#c4d2de',
  btnBg: '#b8c8d6',
  btnBorder: '#9DB2BF',
  btnText: '#27374D',
}

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  'soft-light': softLightTheme,
  forest: forestTheme,
  ocean: oceanTheme,
  sky: skyTheme,
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
