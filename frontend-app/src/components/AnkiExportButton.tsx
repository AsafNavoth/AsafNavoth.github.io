import { Box, Button, ButtonGroup, CircularProgress, Typography } from '@mui/material'

type AnkiExportButtonProps = {
  hasPreparedFile: boolean
  isExporting: boolean
  disabled?: boolean
  error?: string | null
  onPrepare: () => void
  onDownload: () => void
  /** Optional: Add to Anki via AnkiConnect (adds cards to existing deck) */
  onAddToAnki?: () => void
  isAddingToAnki?: boolean
}

export const AnkiExportButton = ({
  hasPreparedFile,
  isExporting,
  disabled = false,
  error,
  onPrepare,
  onDownload,
  onAddToAnki,
  isAddingToAnki = false,
}: AnkiExportButtonProps) => {
  const showAddToAnki = Boolean(onAddToAnki)
  const isBusy = isExporting || isAddingToAnki

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <ButtonGroup variant="outlined" size="medium">
        <Button
          onClick={hasPreparedFile ? onDownload : onPrepare}
          disabled={disabled || isBusy}
          startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isExporting ? 'Preparing…' : hasPreparedFile ? 'Download' : 'Export to Anki'}
        </Button>
        {showAddToAnki && (
          <Button
            onClick={onAddToAnki}
            disabled={disabled || isBusy}
            startIcon={isAddingToAnki ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isAddingToAnki ? 'Adding…' : 'Add to Anki'}
          </Button>
        )}
      </ButtonGroup>
      {error && (
        <Typography color="error" sx={{ fontSize: '0.875rem' }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
