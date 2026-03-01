import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  Button,
  CircularProgress,
  Typography,
  Box,
  styled,
} from '@mui/material'
import { flexCenter, onHoverStyle } from '../../utils/commonStyles'
import {
  ANKI_CONNECTION_ERROR_MESSAGE,
  isAnkiConnectionError,
} from '../../utils/commonStringUtils'

const EXCLUDED_DECKS = ['Default', 'デフォルト']

const DeckListItemButton = styled(ListItemButton)(({ theme }) => ({
  ...onHoverStyle(theme),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.5),
  minHeight: 0,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  transition: 'background-color 0.15s ease',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}))

type AddToAnkiDeckPickerProps = {
  open: boolean
  onClose: () => void
  getDeckNames: () => Promise<string[]>
  onSelectDeck: (deckName: string) => void
}

export const AddToAnkiDeckPicker = ({
  open,
  onClose,
  getDeckNames,
  onSelectDeck,
}: AddToAnkiDeckPickerProps) => {
  const [decks, setDecks] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDecks(null)
    setError(null)
    setSelectedDeck(null)
    getDeckNames()
      .then((deckNames) =>
        setDecks(
          // Default deck appears in the decks query even if it doesn't show up
          // in the Anki UI, so we filter it out here.
          deckNames.filter((deckName) => !EXCLUDED_DECKS.includes(deckName))
        )
      )
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch decks'
        if (isAnkiConnectionError(errorMessage)) {
          setError(ANKI_CONNECTION_ERROR_MESSAGE)
        } else {
          setError(errorMessage)
        }
      })
  }, [open, getDeckNames])

  const handleConfirm = () => {
    if (selectedDeck) {
      onSelectDeck(selectedDeck)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedDeck(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Choose deck</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {!decks && !error && (
          <Box sx={{ ...flexCenter, py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {decks && decks.length === 0 && (
          <Typography color="text.secondary">
            No decks found. Create a deck in Anki first.
          </Typography>
        )}
        {decks && decks.length > 0 && (
          <List dense disablePadding sx={{ mb: 1 }}>
            {decks.map((singleDeck) => (
              <DeckListItemButton
                key={singleDeck}
                selected={selectedDeck === singleDeck}
                onClick={() => setSelectedDeck(singleDeck)}
              >
                {singleDeck}
              </DeckListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      {decks && decks.length > 0 && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedDeck}
          >
            Add to deck
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
