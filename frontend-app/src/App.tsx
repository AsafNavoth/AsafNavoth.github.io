import { Container, Paper, Typography, Box } from '@mui/material'
import { SearchView } from './components/SearchView'

export const App = () => (
  <Container sx={{ height: '80vh', width: '80vw' }}>
    <Paper sx={{ p: 2, height: '100%', overflow: 'hidden' }} component="div">
      <Typography variant="h4" textAlign="center">
        Utanki
      </Typography>
      <SearchView />
    </Paper>
  </Container>
)
