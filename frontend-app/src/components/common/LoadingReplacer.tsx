import { Box, CircularProgress } from '@mui/material'
import { flexCenter } from '../../utils/commonStyles'

type LoadingReplacerProps = {
  isLoading: boolean
}

export const LoadingReplacer = ({ isLoading }: LoadingReplacerProps) =>
  isLoading ? (
    <Box sx={{ ...flexCenter, p: 2 }}>
      <CircularProgress size={24} />
    </Box>
  ) : null
