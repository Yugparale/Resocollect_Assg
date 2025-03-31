import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GavelIcon from '@mui/icons-material/Gavel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';

function Sidebar({ activePage, onPageChange }) {
  const menuItems = [
    { name: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Portfolio', icon: <FolderIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Notifications', icon: <NotificationsIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Auction', icon: <GavelIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Data Upload', icon: <CloudUploadIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Control Panel', icon: <SettingsIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'User Management', icon: <PeopleIcon sx={{ fontSize: '1.2rem' }} /> },
    { name: 'Permissions', icon: <LockIcon sx={{ fontSize: '1.2rem' }} /> }
  ];

  const handleItemClick = (itemName) => {
    onPageChange(itemName);
  };

  return (
    <Box sx={{ 
      width: { xs: '100%', sm: '220px' },
      bgcolor: '#f8f9fa', 
      color: '#333', 
      p: 2, 
      height: 'calc(100vh - 64px)',
      overflow: 'auto',
      borderRight: '1px solid #e0e0e0'
    }}>
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.name}
            onClick={() => handleItemClick(item.name)}
            sx={{
              bgcolor: activePage === item.name ? '#1565c0' : 'transparent',
              color: activePage === item.name ? 'white' : '#555',
              borderRadius: '10px',
              mb: 0.8,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: activePage === item.name ? '#0d47a1' : '#e9ecef',
                transform: 'translateX(4px)'
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: activePage === item.name ? 'white' : '#1565c0',
              minWidth: '36px'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography 
                  sx={{ 
                    fontWeight: activePage === item.name ? 500 : 400,
                    fontSize: '0.85rem',
                    fontFamily: '"Inter", "Poppins", "Roboto", sans-serif'
                  }}
                >
                  {item.name}
                </Typography>
              } 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar; 