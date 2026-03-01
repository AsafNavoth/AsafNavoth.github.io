import { Box, Button, CircularProgress, Typography } from '@mui/material'

type AnkiExportButtonProps = {
  disabled?: boolean
  isLoading?: boolean
  error?: string | null
  onExport: () => void
}

export const AnkiExportButton = ({
  disabled = false,
  isLoading = false,
  error,
  onExport,
}: AnkiExportButtonProps) => {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
    >
      <Button
        variant="contained"
        size="medium"
        onClick={onExport}
        disabled={disabled || isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : undefined
        }
      >
        {isLoading ? 'Loading…' : 'Export'}
      </Button>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  )
}
