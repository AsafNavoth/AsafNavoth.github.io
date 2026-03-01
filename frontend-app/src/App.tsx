import {
  Paper,
  Typography,
  Box,
  IconButton,
  Container,
  styled,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from './contexts/theme/themeContext'
import { SearchView } from './components/search/SearchView'
import { PasteLyricsView } from './components/pasteLyrics/PasteLyricsView'

const CenteringWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}))

const MainContainer = styled(Container)({
  height: '80vh',
  width: '90vw',
  minHeight: '50vh',
  minWidth: '85vw',
})

const MainPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}))

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  flexShrink: 0,
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
    <CenteringWrapper>
      <MainContainer maxWidth={false}>
        <MainPaper>
          <HeaderBox>
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
          </HeaderBox>
          <ContentBox>
            <SearchView />
            <PasteLyricsView />
          </ContentBox>
        </MainPaper>
      </MainContainer>
    </CenteringWrapper>
  )
}
