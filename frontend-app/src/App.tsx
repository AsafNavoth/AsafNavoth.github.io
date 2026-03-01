import { Container, Paper, Typography, Box, IconButton } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from './contexts/theme/themeContext'
import { SearchView } from './components/search/SearchView'
import { PasteLyricsView } from './components/pasteLyrics/PasteLyricsView'

export const App = () => {
  const { mode, toggleColorMode } = useThemeMode()

  return (
    <Container sx={{ height: '80vh', width: '80vw' }}>
      <Paper
        sx={{
          p: 2,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        component="div"
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Typography variant="h4" textAlign="center">
            Utanki
          </Typography>
          <IconButton
            onClick={toggleColorMode}
            aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            size="small"
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            mt: 2,
          }}
        >
          <SearchView />
          <PasteLyricsView />
        </Box>
      </Paper>
    </Container>
  )
}
