export interface Attacker {
  ip: string
  initial_detection: string
  last_detected: string
  country: string | null
  is_blocked: string | null
  chances_left: number | null
}

export interface SessionEntry {
  session_id: number
  ip: string
  session_duration: string
  event_type: string
  username_attempt: string | null
  password_attempt: string | null
  command_used: string | null
  timestamp: string
}

export interface Stats {
  total_attempts: number
  unique_ips: number
  blocked_ips: number
  attempts_last_24h: number
  top_ips: { ip: string; count: number }[]
  top_usernames: { username_attempt: string; count: number }[]
  top_passwords: { password_attempt: string; count: number }[]
}

export interface BlockEntry {
  block_id: number
  ip: string
  block_date: string
  blocked_by: string | null
  expiration_date: string | null
  is_active: string | null
}
