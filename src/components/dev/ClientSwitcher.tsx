import * as React from 'react';
import {
  Box,
  Menu,
  MenuItem,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  getClientConfig,
  switchClient,
  clearClientOverride,
  CLIENT_CONFIGS,
  type ClientId,
} from '../../config/clients';

/**
 * Client Switcher Component
 * 
 * Developer tool for easily switching between clients.
 * Shows current client and provides menu to switch.
 * 
 * Usage:
 * - Add to header or footer during development
 * - Can be hidden in production via environment variable
 */
export default function ClientSwitcher() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const currentClient = getClientConfig();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClientSelect = (clientId: ClientId) => {
    handleClose();
    if (clientId !== currentClient.id) {
      switchClient(clientId);
    }
  };

  const handleClearOverride = () => {
    handleClose();
    clearClientOverride();
  };

  // Get URL parameter to show if client is overridden
  const urlParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : null;
  const hasUrlOverride = urlParams?.has('client');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={currentClient.branding.name}
        size="small"
        color={hasUrlOverride ? 'primary' : 'default'}
        variant={hasUrlOverride ? 'filled' : 'outlined'}
        icon={<SwapIcon />}
        onClick={handleClick}
        sx={{ cursor: 'pointer' }}
      />
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Switch Client Configuration
          </Typography>
        </Box>
        <Divider />
        
        {Object.entries(CLIENT_CONFIGS)
          .map(([id, config]) => (
            <MenuItem
              key={id}
              onClick={() => handleClientSelect(id as ClientId)}
              selected={currentClient.id === id}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    {config.branding.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {id}
                  </Typography>
                </Box>
                {currentClient.id === id && (
                  <CheckIcon fontSize="small" color="primary" />
                )}
              </Box>
            </MenuItem>
          ))}
        
        {hasUrlOverride && (
          <>
            <Divider />
            <MenuItem onClick={handleClearOverride}>
              <Typography variant="body2" color="error">
                Clear Override
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
}
