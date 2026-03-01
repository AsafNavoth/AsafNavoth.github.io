import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material'
import { DeckSelectSkeleton } from '../common/LoadingSkeletons'
import { useAnkiConnectContext } from '../../contexts/ankiconnect/ankiconnectContext'
import { onHoverStyle } from '../../utils/commonStyles'

export const AnkiConnectBar = () => {
  const {
    ankiConnectEnabled,
    setAnkiConnectEnabled,
    selectedDeck,
    setSelectedDeck,
    decks,
    decksError,
    refreshDecks,
  } = useAnkiConnectContext()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={ankiConnectEnabled}
            onChange={(_, checked) => setAnkiConnectEnabled(checked)}
            color="primary"
          />
        }
        label="Enable AnkiConnect integration"
      />
      {ankiConnectEnabled &&
        (decks === null ? (
          <DeckSelectSkeleton />
        ) : (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="ankiconnect-deck-label">Deck</InputLabel>
            <Select
              labelId="ankiconnect-deck-label"
              label="Deck"
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              onOpen={() => refreshDecks()}
              disabled={decks.length === 0}
            >
              {decks.map((deck) => (
                <MenuItem key={deck} value={deck} sx={(theme) => onHoverStyle(theme)}>
                  {deck}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      {decksError && ankiConnectEnabled && (
        <Typography color="error" variant="body2">
          {decksError}
        </Typography>
      )}
    </Box>
  )
}
