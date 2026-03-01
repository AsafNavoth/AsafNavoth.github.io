import { List, ListItem, ListItemButton, ListItemText } from '@mui/material'
import type { LrclibSearchResult } from '../../types/lrclib'
import { onHoverStyle } from '../../utils/commonStyles'

type SearchResultsListProps = {
  results: LrclibSearchResult[]
  onTrackClick: (track: LrclibSearchResult) => void
}

export const SearchResultsList = ({
  results,
  onTrackClick,
}: SearchResultsListProps) => (
  <List sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
    {results.map((track) => (
      <ListItem key={track.id} divider disablePadding>
        <ListItemButton
          onClick={() => onTrackClick(track)}
          sx={(theme) => ({ ...onHoverStyle(theme) })}
        >
          <ListItemText
            primary={track.trackName}
            secondary={`${track.artistName} • ${track.albumName}`}
          />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
)
