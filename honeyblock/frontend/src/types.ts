export interface Attacker {
  ip: string
  attempt_count: number
  country: string | null
  city: string | null
  first_seen: string
  last_seen: string
}

export interface Stats {
  total_attempts: number
  unique_ips: number
  blocked_ips: number
  attempts_last_24h: number
  top_ips: { ip: string; count: number }[]
  top_usernames: { username: string; count: number }[]
}
