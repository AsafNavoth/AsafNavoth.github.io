import {
  AppBar,
  Paper,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Container,
  styled,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from './contexts/theme/themeContext'
import { AnkiConnectBar } from './components/anki/AnkiConnectBar'
import { SearchView } from './components/search/SearchView'
import { PasteLyricsView } from './components/pasteLyrics/PasteLyricsView'

const AppLayout = styled(Box)({
  height: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

const MainContainer = styled(Container)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(2),
  minHeight: 0,
}))

const MainPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}))

const ContentBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(2),
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  marginTop: theme.spacing(2),
}))

export const App = () => {
  const { mode, toggleColorMode } = useThemeMode()

  return (
    <AppLayout>
      <AppBar position="fixed" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h1">
            Utanki
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <AnkiConnectBar />
            <IconButton
              onClick={toggleColorMode}
              aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
              size="small"
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <MainContainer maxWidth={false}>
        <MainPaper>
          <ContentBox>
            <SearchView />
            <PasteLyricsView />
          </ContentBox>
        </MainPaper>
      </MainContainer>
    </AppLayout>
  )
}
