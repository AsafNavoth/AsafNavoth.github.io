import { Box, CircularProgress } from '@mui/material'

type LoadingReplacerProps = {
  isLoading: boolean
}

export const LoadingReplacer = ({ isLoading }: LoadingReplacerProps) =>
  isLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <CircularProgress size={24} />
    </Box>
  ) : null
