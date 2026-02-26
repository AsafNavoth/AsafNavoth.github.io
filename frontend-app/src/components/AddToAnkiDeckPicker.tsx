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
} from '@mui/material'

const EXCLUDED_DECKS = ['Default', 'デフォルト']

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
      .then((names) =>
        setDecks(names.filter((d) => !EXCLUDED_DECKS.includes(d)))
      )
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch decks'
        if (
          message.includes('fetch') ||
          message.includes('Failed to fetch') ||
          message.includes('NetworkError')
        ) {
          setError(
            'Cannot connect to Anki. Make sure Anki is running and AnkiConnect add-on is installed.'
          )
        } else {
          setError(message)
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
            {decks.map((deck) => (
              <ListItemButton
                key={deck}
                selected={selectedDeck === deck}
                onClick={() => setSelectedDeck(deck)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  minHeight: 0,
                  py: 1.5,
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                {deck}
              </ListItemButton>
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
