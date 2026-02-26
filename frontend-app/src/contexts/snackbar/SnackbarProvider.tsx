import { useCallback, useState } from 'react'
import { Snackbar } from '@mui/material'
import { SnackbarContext } from './snackbarContext'

type SnackbarProviderProps = {
  children: React.ReactNode
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [message, setMessage] = useState<string | null>(null)

  const enqueueSnackbar = useCallback((msg: string) => {
    setMessage(msg)
  }, [])

  const handleClose = useCallback(() => {
    setMessage(null)
  }, [])

  return (
    <SnackbarContext.Provider value={{ enqueueSnackbar }}>
      {children}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        message={message}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </SnackbarContext.Provider>
  )
}
