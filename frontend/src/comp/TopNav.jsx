import React from 'react';
import { Box, Typography, Avatar, Menu, MenuItem, IconButton, Badge } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const TopNav = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: '#1565c0',
      color: 'white', 
      py: 1.5, 
      px: 3,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(21, 101, 192, 0.3)',
      flexDirection: { xs: 'column', sm: 'row' }
    }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 600, 
          letterSpacing: '-0.02em',
          fontSize: '1.25rem',
          fontFamily: '"Inter", "Poppins", "Roboto", sans-serif'
        }}
      >
        Financial Dashboard
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton color="inherit" size="small" sx={{ borderRadius: '10px' }}>
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
        <IconButton color="inherit" size="small" sx={{ borderRadius: '10px' }}>
          <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>
        <Avatar 
          onClick={handleMenu} 
          sx={{ 
            cursor: 'pointer', 
            bgcolor: 'white', 
            color: '#1565c0',
            width: 32,
            height: 32,
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }
          }}
        >
          T
        </Avatar>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              borderRadius: '10px',
              minWidth: 180,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <MenuItem onClick={handleClose} sx={{ py: 1.5, fontSize: '0.85rem' }}>Profile</MenuItem>
          <MenuItem onClick={handleClose} sx={{ py: 1.5, fontSize: '0.85rem' }}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default TopNav; 