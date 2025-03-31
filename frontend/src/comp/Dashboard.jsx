import React, { useState } from 'react';
import { Box, Button, Typography, Divider } from '@mui/material';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import LoanTable from './LoanTable';
import FileUploadModal from './FileUploadModal';

const Dashboard = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [activePage, setActivePage] = useState('Portfolio');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleUploadSuccess = () => {
    // Trigger a refresh of the loan table by incrementing the refreshTrigger
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePageChange = (pageName) => {
    setActivePage(pageName);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'Portfolio':
        return (
          <>
            <Box sx={{ 
              mb: 4, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1a1a1a',
                    fontSize: '1.5rem',
                    letterSpacing: '-0.01em',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                  }}
                >
                  Portfolio
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    mt: 0.5,
                    fontWeight: 400,
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                  }}
                >
                  Manage and view all loan portfolios
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleOpenModal} 
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 0.75,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  backgroundColor: '#1565c0',
                  '&:hover': {
                    backgroundColor: '#0d47a1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Upload File
              </Button>
            </Box>
            <Divider sx={{ mt: 1, mb: 3, opacity: 0.6 }} />
            <LoanTable refreshTrigger={refreshTrigger} />
          </>
        );
      default:
        return (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  fontSize: '1.75rem',
                  letterSpacing: '-0.01em',
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                {activePage}
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '0.95rem',
                  mt: 0.5,
                  fontWeight: 400,
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                {getSubtitleForPage(activePage)}
              </Typography>
              <Divider sx={{ mt: 2.5, mb: 1, opacity: 0.6 }} />
            </Box>
            
            <Box sx={{ 
              p: 5, 
              bgcolor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: '1rem',
                  fontWeight: 400,
                  maxWidth: '500px',
                  lineHeight: 1.6
                }}
              >
                This is the {activePage} page. Content for this section is under development.
              </Typography>
            </Box>
          </>
        );
    }
  };

  const getSubtitleForPage = (page) => {
    switch (page) {
      case 'Dashboard':
        return 'Overview of your financial data';
      case 'Notifications':
        return 'View your alerts and notifications';
      case 'Auction':
        return 'Manage auction processes';
      case 'Data Upload':
        return 'Upload and manage your data files';
      case 'Control Panel':
        return 'System settings and configurations';
      case 'User Management':
        return 'Manage user accounts and permissions';
      case 'Permissions':
        return 'Configure access controls';
      default:
        return '';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      bgcolor: 'white',
      flexWrap: { xs: 'wrap', sm: 'nowrap' } // Wrap on mobile
    }}>
      <TopNav />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activePage={activePage} onPageChange={handlePageChange} />
        <Box sx={{ 
          flex: 1, 
          p: 4, 
          bgcolor: '#f8f9fa', 
          overflow: 'auto',
          height: 'calc(100vh - 64px)' // Adjust based on your TopNav height
        }}>
          {renderContent()}
        </Box>
      </Box>
      <FileUploadModal 
        visible={isModalOpen} 
        onCancel={handleCloseModal} 
        onUploadSuccess={handleUploadSuccess} 
      />
    </Box>
  );
};

export default Dashboard; 