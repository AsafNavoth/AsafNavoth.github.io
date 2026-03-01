import type { Theme } from '@mui/material/styles'

export const onHoverStyle = (theme: Theme) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
})

export const flexCenter = {
  display: 'flex',
  justifyContent: 'center',
}

export const flexColumn = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

export const flexColumnHalf = {
  ...flexColumn,
  height: '100%',
  width: '50%',
  // Allow flex item to shrink below content width; prevents overflow in narrow viewports
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
}
