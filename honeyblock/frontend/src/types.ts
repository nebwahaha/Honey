export interface Attacker {
  ip: string
  initial_detection: string
  last_detected: string
  country: string | null
  is_blocked: string | null
}

export interface Stats {
  total_attempts: number
  unique_ips: number
  blocked_ips: number
  attempts_last_24h: number
  top_ips: { ip: string; count: number }[]
  top_usernames: { username_attempt: string; count: number }[]
}
