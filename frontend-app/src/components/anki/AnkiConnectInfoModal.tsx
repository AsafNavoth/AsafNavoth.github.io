import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ankiconnectExtensionUrl } from '../../env';
import { DARK_THEME_PAPER } from '../../contexts/theme/themeContext';

const ANKICONNECT_ADDON_NUMBER = '2055492159';
const COPY_RESET_MS = 2000;
const CHROME_WEB_STORE_ICON_URL =
  'https://upload.wikimedia.org/wikipedia/commons/0/0c/Google_Chrome_Web_Store_icon_2022.svg';

type AnkiConnectInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

type CopyableAddonNumberProps = {
  copied: boolean;
  onCopy: () => void;
};

const ChromeWebStoreIconLink = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  lineHeight: 1,
  backgroundColor: DARK_THEME_PAPER,
  borderRadius: theme.spacing(0.5),
  padding: theme.spacing(0.25),
})) as typeof Box;

const ChromeWebStoreLink = () => (
  <ChromeWebStoreIconLink
    component="a"
    href={ankiconnectExtensionUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src={CHROME_WEB_STORE_ICON_URL}
      alt="Chrome Web Store"
      width={24}
      height={24}
    />
  </ChromeWebStoreIconLink>
);

const CopyableAddonNumber = ({ copied, onCopy }: CopyableAddonNumberProps) => (
  <Tooltip title={copied ? 'Copied!' : 'Click to copy'}>
    <Typography
      component="span"
      fontWeight={600}
      onClick={onCopy}
      sx={{
        cursor: 'pointer',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
      }}
    >
      {ANKICONNECT_ADDON_NUMBER}
    </Typography>
  </Tooltip>
);

export const AnkiConnectInfoModal = ({
  open,
  onClose,
}: AnkiConnectInfoModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ANKICONNECT_ADDON_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_RESET_MS);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>How to enable AnkiConnect integration</DialogTitle>
      <DialogContent>
        <List dense>
          <ListItem>
            <ListItemText
              primary="1. Install AnkiConnect in Anki"
              secondary={
                <>
                  In Anki, go to Tools → Add-ons → Get Add-ons. Enter code{' '}
                  <CopyableAddonNumber copied={copied} onCopy={handleCopy} />{' '}
                  and restart Anki.
                </>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="2. Install the Utanki AnkiConnect extension"
              secondary={
                <Box
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  Install from Chrome Web Store:
                  <ChromeWebStoreLink />
                </Box>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="3. Have Anki running"
              secondary="Keep Anki open with AnkiConnect installed."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="4. Choose a deck"
              secondary="Select your target deck from the dropdown list above."
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};
