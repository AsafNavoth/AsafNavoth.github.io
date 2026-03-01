import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material'

type DeckNameDialogProps = {
  open: boolean
  defaultName: string
  onClose: () => void
  onConfirm: (deckName: string) => void | Promise<void>
  isDownloading?: boolean
  error?: string | null
}

export const DeckNameDialog = ({
  open,
  defaultName,
  onClose,
  onConfirm,
  isDownloading = false,
  error = null,
}: DeckNameDialogProps) => {
  const [deckName, setDeckName] = useState(defaultName)

  useEffect(() => {
    if (open) setDeckName(defaultName)
  }, [open, defaultName])

  const handleConfirm = () => {
    const trimmed = deckName.trim() || defaultName
    onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Name your deck</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Deck name"
          placeholder={defaultName}
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          size="small"
          sx={{ mt: 1 }}
          slotProps={{
            htmlInput: {
              'aria-label': 'Deck name for the downloaded file',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDownloading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isDownloading}
        >
          {isDownloading ? 'Preparing…' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
