import { IconButton, Tooltip } from '@mui/material';
import { githubRepoUrl } from '../../env';
import githubSvg from '../../assets/github.svg?raw';

export const GitHubIconLink = () => (
  <Tooltip title="View source on GitHub">
    <IconButton
      component="a"
      href={githubRepoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View source on GitHub"
      size="small"
      sx={{ padding: (t) => t.spacing(0.5) }}
    >
      <span
        style={{
          display: 'inline-flex',
          color: 'inherit',
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: githubSvg }}
        aria-hidden
      />
    </IconButton>
  </Tooltip>
);
