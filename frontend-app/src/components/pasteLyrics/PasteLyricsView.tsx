import { Box, TextField, Typography } from '@mui/material'
import { flexColumnHalf } from '../../utils/commonStyles'
import { useCallback, useMemo, useState } from 'react'
import { AddToAnkiDeckPicker } from '../anki/AddToAnkiDeckPicker'
import { AnkiExportButton } from '../anki/AnkiExportButton'
import { useAnkiConnect } from '../../hooks/useAnkiConnect'
import { useAnkiExport } from '../../hooks/useAnkiExport'

const MAX_LYRICS_CHARS = 5000
const DEFAULT_DECK_NAME = 'Pasted lyrics'

export const PasteLyricsView = () => {
  const [text, setText] = useState('')
  const [deckName, setDeckName] = useState('')
  const trimmedText = text.trim()
  const trimmedDeckName = deckName.trim()

  const payload = useMemo(() => {
    if (!trimmedText) return null
    return {
      plainLyrics: trimmedText,
      trackName: trimmedDeckName || DEFAULT_DECK_NAME,
      artistName: '',
    }
  }, [trimmedText, trimmedDeckName])

  const deckFileName = useMemo(
    () => `${trimmedDeckName || DEFAULT_DECK_NAME}.apkg`,
    [trimmedDeckName]
  )

  const {
    prepare,
    download,
    blob,
    isExporting,
    error: exportError,
  } = useAnkiExport({
    payload,
    filename: deckFileName,
  })

  const {
    addToAnki,
    getDeckNames,
    isAddingToAnki,
    error: ankiConnectError,
  } = useAnkiConnect(payload)

  const [deckPickerOpen, setDeckPickerOpen] = useState(false)

  const handleExport = useCallback(() => {
    if (!trimmedText) return
    prepare()
  }, [prepare, trimmedText])

  const charCount = text.length
  const isTooLong = charCount > MAX_LYRICS_CHARS
  const canExport = trimmedText.length > 0 && !isTooLong

  return (
    <Box sx={flexColumnHalf}>
      <Typography variant="h6">Paste lyrics</Typography>
      <Typography variant="body2" color="text.secondary">
        Paste song lyrics or any Japanese text to create an Anki deck from the
        vocabulary.
      </Typography>
      <TextField
        label="Deck name"
        placeholder="e.g. My Song"
        value={deckName}
        onChange={(e) => setDeckName(e.target.value)}
        size="small"
      />
      <Box
        sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <TextField
          label="Lyrics or text"
          placeholder="Paste or type Japanese text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          minRows={6}
          maxRows={20}
          fullWidth
          helperText={`${charCount}/${MAX_LYRICS_CHARS}`}
          error={isTooLong}
          slotProps={{
            htmlInput: {
              maxLength: MAX_LYRICS_CHARS,
            },
          }}
          sx={{
            flex: 1,
            minHeight: 0,
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
            },
            '& .MuiInputBase-input': {
              overflow: 'auto !important',
              height: '100% !important',
            },
          }}
        />
      </Box>
      <AnkiExportButton
        hasPreparedFile={!!blob}
        isExporting={isExporting}
        disabled={!canExport}
        error={exportError ?? ankiConnectError}
        onPrepare={handleExport}
        onDownload={download}
        onAddToAnki={() => setDeckPickerOpen(true)}
        isAddingToAnki={isAddingToAnki}
      />
      <AddToAnkiDeckPicker
        open={deckPickerOpen}
        onClose={() => setDeckPickerOpen(false)}
        getDeckNames={getDeckNames}
        onSelectDeck={(deckName) => addToAnki(deckName)}
      />
    </Box>
  )
}
