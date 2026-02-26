export type LrclibSearchResult = {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics?: string
  syncedLyrics?: string
}

export type JamdictLookupResult = {
  entries: unknown[]
  names: unknown[]
  chars: unknown[]
  found: boolean
}

export type LrclibLyricsDetails = {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string
  syncedLyrics: string
}
