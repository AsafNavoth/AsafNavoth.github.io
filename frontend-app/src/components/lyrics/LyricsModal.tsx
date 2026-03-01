import { useCallback, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
} from '@mui/material'
import { useReactQuery } from '../../hooks/useReactQuery'
import { useAnkiConnect } from '../../hooks/useAnkiConnect'
import { useAnkiExport } from '../../hooks/useAnkiExport'
import { useAnkiNotes } from '../../hooks/useAnkiNotes'
import type { LrclibLyricsDetails } from '../../types/lrclib'
import { AddToAnkiDeckPicker } from '../anki/AddToAnkiDeckPicker'
import { DeckNameDialog } from '../anki/DeckNameDialog'
import { LyricsSkeleton } from '../common/LoadingSkeletons'
import { AnkiExportButton } from '../anki/AnkiExportButton'
import { NotesChecklistModal } from '../anki/NotesChecklistModal'

type LyricsModalProps = {
  open: boolean
  lyricsId: number | null
  trackName: string
  artistName: string
  albumName: string
  onClose: () => void
}

export const LyricsModal = ({
  open,
  lyricsId,
  trackName,
  artistName,
  albumName,
  onClose,
}: LyricsModalProps) => {
  const { data, isLoading, error } = useReactQuery<LrclibLyricsDetails>({
    queryKey: ['lyrics', lyricsId],
    url: `/api/lyrics/${lyricsId}`,
    enabled: open && lyricsId !== null,
  })

  const lyricsToShow = data?.plainLyrics ?? data?.syncedLyrics ?? ''
  const payload = data ?? null

  const {
    fetchNotes,
    abortFetch,
    notesData,
    isLoading: isNotesLoading,
    error: notesError,
  } = useAnkiNotes(payload)
  const {
    buildDeck,
    download,
    isExporting,
    error: exportError,
  } = useAnkiExport()
  const {
    addToAnki,
    getDeckNames,
    isAddingToAnki,
    error: ankiConnectError,
    clearError: clearAnkiConnectError,
  } = useAnkiConnect()

  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [deckPickerOpen, setDeckPickerOpen] = useState(false)
  const [deckNameDialogOpen, setDeckNameDialogOpen] = useState(false)
  const [pendingNotes, setPendingNotes] = useState<
    { fields: Record<string, string> }[] | null
  >(null)
  const [pendingDownloadNotes, setPendingDownloadNotes] = useState<
    { fields: Record<string, string> }[] | null
  >(null)

  const handleExportClick = useCallback(async () => {
    setNotesModalOpen(true)
    await fetchNotes()
  }, [fetchNotes])

  const handleDownloadClick = useCallback(
    (selectedNotes: { fields: Record<string, string> }[]) => {
      setPendingDownloadNotes(selectedNotes)
      setDeckNameDialogOpen(true)
    },
    []
  )

  const handleDeckNameConfirm = useCallback(
    async (deckName: string) => {
      if (!notesData || !pendingDownloadNotes) return
      const blob = await buildDeck({
        deckName,
        modelName: notesData.modelName,
        notes: pendingDownloadNotes,
      })
      if (blob) {
        download(blob, `${deckName.replace(/\//g, '-')}.apkg`)
        setDeckNameDialogOpen(false)
        setPendingDownloadNotes(null)
        setNotesModalOpen(false)
      }
    },
    [notesData, pendingDownloadNotes, buildDeck, download]
  )

  const handleAddToDeck = useCallback(
    (selectedNotes: { fields: Record<string, string> }[]) => {
      setNotesModalOpen(false)
      setPendingNotes(selectedNotes)
      setDeckPickerOpen(true)
    },
    []
  )

  const handleSelectDeck = useCallback(
    async (deckName: string) => {
      if (!pendingNotes || !notesData) return

      await addToAnki(deckName, pendingNotes, notesData.modelName)
      setPendingNotes(null)
      setDeckPickerOpen(false)
    },
    [addToAnki, pendingNotes, notesData]
  )

  const dialogTitle = [trackName, artistName, albumName]
    .filter(Boolean)
    .join(' - ')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          component="span"
          variant="h6"
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {dialogTitle || 'Lyrics'}
        </Typography>
        {data && (
          <>
            <Box sx={{ flexShrink: 0 }}>
              <AnkiExportButton
                disabled={!lyricsToShow}
                isLoading={isNotesLoading}
                error={notesError ?? exportError ?? ankiConnectError}
                onExport={handleExportClick}
              />
            </Box>
          </>
        )}
      </DialogTitle>
      <DialogContent>
        {isLoading && <LyricsSkeleton />}
        {error && (
          <Typography color="error">
            {error instanceof Error ? error.message : 'Failed to load lyrics'}
          </Typography>
        )}
        {data && !lyricsToShow && data.instrumental && (
          <Typography color="text.secondary">Instrumental track</Typography>
        )}
        {lyricsToShow && (
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
            }}
          >
            {lyricsToShow}
          </Typography>
        )}
        <NotesChecklistModal
          open={notesModalOpen}
          onClose={() => {
            abortFetch()
            setNotesModalOpen(false)
          }}
          notesData={notesData}
          isLoading={isNotesLoading}
          error={notesError}
          onDownload={handleDownloadClick}
          onAddToDeck={handleAddToDeck}
          isDownloading={isExporting}
          isAdding={isAddingToAnki}
        />
        <DeckNameDialog
          open={deckNameDialogOpen}
          defaultName={trackName}
          onClose={() => {
            setDeckNameDialogOpen(false)
            setPendingDownloadNotes(null)
          }}
          onConfirm={handleDeckNameConfirm}
          isDownloading={isExporting}
          error={deckNameDialogOpen ? exportError : null}
        />
        <AddToAnkiDeckPicker
          open={deckPickerOpen}
          onClose={() => {
            setDeckPickerOpen(false)
            setPendingNotes(null)
            clearAnkiConnectError()
          }}
          onBack={() => {
            setDeckPickerOpen(false)
            setNotesModalOpen(true)
            clearAnkiConnectError()
          }}
          getDeckNames={getDeckNames}
          onSelectDeck={handleSelectDeck}
          isAdding={isAddingToAnki}
          addError={ankiConnectError}
        />
      </DialogContent>
    </Dialog>
  )
}
