import { Typography } from '@mui/material'

type SearchErrorMessageProps = {
  error: Error | null
}

export const SearchErrorMessage = ({ error }: SearchErrorMessageProps) =>
  error ? (
    <Typography color="error">
      {error instanceof Error ? error.message : 'Search failed'}
    </Typography>
  ) : null
