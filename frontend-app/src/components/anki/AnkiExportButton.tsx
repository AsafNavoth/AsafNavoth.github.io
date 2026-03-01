import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Typography,
} from '@mui/material'

type AnkiExportButtonProps = {
  hasPreparedFile: boolean
  isExporting: boolean
  disabled?: boolean
  error?: string | null
  onPrepare: () => void
  onDownload: () => void
  onAddToAnki: () => void
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
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
    >
      <ButtonGroup variant="contained" size="medium">
        <Button
          onClick={hasPreparedFile ? onDownload : onPrepare}
          disabled={disabled || isBusy}
          startIcon={
            isExporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isExporting
            ? 'Preparing…'
            : hasPreparedFile
              ? 'Download'
              : 'Get download link'}
        </Button>
        {showAddToAnki && (
          <Button
            onClick={onAddToAnki}
            disabled={disabled || isBusy}
            startIcon={
              isAddingToAnki ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {isAddingToAnki ? 'Adding…' : 'Add to Anki'}
          </Button>
        )}
      </ButtonGroup>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  )
}
