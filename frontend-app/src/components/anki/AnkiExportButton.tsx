import { Box, Button, CircularProgress } from '@mui/material'

type AnkiExportButtonProps = {
  disabled?: boolean
  isLoading?: boolean
  onExport: () => void
}

export const AnkiExportButton = ({
  disabled = false,
  isLoading = false,
  onExport,
}: AnkiExportButtonProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
    </Box>
)
