import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Box, Button, Menu, MenuItem,
  FormControl, InputLabel, Select, Chip, Typography,
  CircularProgress, Alert, Snackbar, TablePagination,
  Checkbox, IconButton, Tooltip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import TableSortLabel from '@mui/material/TableSortLabel';
import SortIcon from '@mui/icons-material/Sort';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const API_URL = 'http://localhost:5000/api';

const LoanTable = ({ refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('loanNumber');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [columns, setColumns] = useState([]);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Selection states
  const [selected, setSelected] = useState([]);

  // Fetch loans from backend
  useEffect(() => {
    fetchLoans();
  }, [refreshTrigger]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/loans`);
      
      if (response.data.loans) {
        setLoans(response.data.loans);
        
        if (response.data.columns && response.data.columns.length > 0) {
          setColumns(response.data.columns);
          
          // Initialize filters for all columns except loanNumber
          const initialFilters = {};
          response.data.columns
            .filter(col => col !== 'loanNumber' && !col.startsWith('_'))
            .forEach(col => {
              initialFilters[col] = '';
            });
          setFilters(initialFilters);
        } else {
          setDefaultColumns();
        }
      } else {
        // Handle old API format
        setLoans(response.data);
        setDefaultColumns();
      }
      
      setError(null);
      // Clear selection when data changes
      setSelected([]);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to fetch loans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format column titles to be more readable
  const formatColumnTitle = (column) => {
    if (!column) return '';
    return column
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Format cell values for display
  const formatCellValue = (value) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    return value;
  };

  // Set default columns if no dynamic columns are available
  const setDefaultColumns = () => {
    setColumns(['loanNumber', 'loanType', 'borrowerName', 'sanctionAmount', 'region']);
    
    // Initialize default filters (excluding loanNumber)
    setFilters({
      loanType: '',
      borrowerName: '',
      sanctionAmount: '',
      region: ''
    });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter menu handlers
  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  };

  const applyFilters = () => {
    const newActiveFilters = [];
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        newActiveFilters.push({ type: key, value: filters[key] });
      }
    });
    
    setActiveFilters(newActiveFilters);
    setPage(0); // Reset to first page when applying filters
    handleFilterClose();
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(filter => 
      !(filter.type === filterToRemove.type && filter.value === filterToRemove.value)
    ));
    
    setFilters({
      ...filters,
      [filterToRemove.type]: ''
    });
    
    setPage(0); // Reset to first page when removing filters
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    
    const clearedFilters = {};
    Object.keys(filters).forEach(key => {
      clearedFilters[key] = '';
    });
    
    setFilters(clearedFilters);
    setPage(0); // Reset to first page when clearing filters
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Get unique values for a column to use in filter dropdowns
  const getUniqueValues = (column) => {
    const values = [...new Set(loans.map(loan => loan[column]).filter(Boolean))];
    return values.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });
  };

  // Check if a column should be included in the filter options
  const shouldIncludeInFilters = (column) => {
    // Exclude MongoDB internal fields and loanNumber
    return !column.startsWith('_') && column !== 'loanNumber';
  };

  // Apply filters to the data
  const filteredLoans = loans.filter(loan => {
    // Filter out entries without a valid loan number
    if (!loan.loanNumber || loan.loanNumber === '-' || loan.loanNumber === '') return false;
    
    // Search filter - search across all fields
    if (searchTerm) {
      const searchMatch = columns.some(column => {
        if (!loan[column]) return false;
        return String(loan[column]).toLowerCase().includes(searchTerm.toLowerCase());
      });
      if (!searchMatch) return false;
    }
    
    // Apply all active filters (AND logic)
    for (const filter of activeFilters) {
      if (!loan[filter.type]) return false;
      
      // Handle numeric values
      if (typeof loan[filter.type] === 'number') {
        if (parseFloat(loan[filter.type]) !== parseFloat(filter.value)) {
          return false;
        }
      } else {
        // Handle string values
        if (!String(loan[filter.type]).toLowerCase().includes(String(filter.value).toLowerCase())) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Sort the filtered data
  const sortedLoans = filteredLoans.sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return order === 'asc' ? 1 : -1;
    if (bValue === undefined) return order === 'asc' ? -1 : 1;
    
    // Sort based on data type
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Default string comparison
    const comparison = String(aValue).localeCompare(String(bValue));
    return order === 'asc' ? comparison : -comparison;
  });

  // Get paginated data
  const paginatedLoans = sortedLoans.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Selection handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedLoans.map(loan => loan._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(itemId => itemId !== id);
    }

    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Handle actions on selected loans
  const handleDeleteSelected = () => {
    // Implement delete functionality here
    setNotification({
      open: true,
      message: `${selected.length} loans selected for deletion`,
      severity: 'info'
    });
  };

  const handleExportSelected = () => {
    // Implement export functionality here
    setNotification({
      open: true,
      message: `${selected.length} loans selected for export`,
      severity: 'info'
    });
  };

  return (
    <>
      <Paper sx={{ 
        p: 3, 
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        mb: 4
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            prefix={<SearchOutlined />}
            style={{ 
              width: 300, 
              borderRadius: '10px',
              padding: '8px 12px'
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selected.length > 0 && (
              <>
                <Tooltip title="Delete selected">
                  <IconButton 
                    onClick={handleDeleteSelected}
                    sx={{ 
                      color: '#f44336',
                      '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export selected">
                  <IconButton 
                    onClick={handleExportSelected}
                    sx={{ 
                      color: '#4caf50',
                      '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.08)' }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              sx={{ 
                borderRadius: '10px',
                textTransform: 'none',
                px: 2,
                borderColor: '#e0e0e0',
                color: '#555',
                fontSize: '0.85rem',
                '&:hover': {
                  borderColor: '#1565c0',
                  bgcolor: 'rgba(21, 101, 192, 0.04)'
                }
              }}
            >
              Filters
            </Button>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
            PaperProps={{
              elevation: 3,
              sx: {
                width: '320px',
                p: 3,
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, fontSize: '1.1rem' }}>Filter Options</Typography>
            
            {columns
              .filter(shouldIncludeInFilters)
              .slice(0, 5)
              .map(column => (
                <FormControl key={column} fullWidth sx={{ mb: 2 }}>
                  <InputLabel>{formatColumnTitle(column)}</InputLabel>
                  <Select
                    name={column}
                    value={filters[column] || ''}
                    onChange={handleFilterChange}
                    label={formatColumnTitle(column)}
                    sx={{ borderRadius: '8px' }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {getUniqueValues(column).map(value => (
                      <MenuItem key={value} value={value}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={clearAllFilters} 
                color="inherit"
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Clear All
              </Button>
              <Button 
                onClick={applyFilters} 
                variant="contained" 
                color="primary"
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  fontSize: '0.9rem',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
                  }
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Menu>
        </Box>
        
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={`${formatColumnTitle(filter.type)}: ${filter.value}`}
                onDelete={() => removeFilter(filter)}
                color="primary"
                variant="outlined"
                sx={{ 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  height: '28px'
                }}
              />
            ))}
            <Chip
              label="Clear All"
              onClick={clearAllFilters}
              color="secondary"
              sx={{ 
                borderRadius: '6px',
                fontSize: '0.8rem',
                height: '28px'
              }}
            />
          </Box>
        )}
        
        {/* Selected count display */}
        {selected.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
              {selected.length} {selected.length === 1 ? 'loan' : 'loans'} selected
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ 
              maxHeight: 'none',
              overflowX: 'auto',
              overflowY: 'visible',
              width: '100%'
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: '#f8f9fa' }}>
                      <Checkbox
                        indeterminate={selected.length > 0 && selected.length < paginatedLoans.length}
                        checked={paginatedLoans.length > 0 && selected.length === paginatedLoans.length}
                        onChange={handleSelectAllClick}
                        sx={{
                          color: '#bdbdbd',
                          '&.Mui-checked': {
                            color: '#1565c0',
                          },
                          '&.MuiCheckbox-indeterminate': {
                            color: '#1565c0',
                          }
                        }}
                      />
                    </TableCell>
                    {columns
                      .filter(column => !column.startsWith('_')) // Filter out MongoDB internal fields
                      .map(column => (
                      <TableCell 
                        key={column}
                        sortDirection={orderBy === column ? order : false}
                        sx={{ 
                          fontWeight: 600, 
                          color: '#444',
                          fontSize: '0.8rem',
                          borderBottom: '2px solid #f0f0f0',
                          backgroundColor: '#f8f9fa',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          }
                        }}
                        onClick={() => handleRequestSort(column)}
                      >
                        {formatColumnTitle(column)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedLoans.length > 0 ? (
                    paginatedLoans.map((loan, index) => {
                      const isItemSelected = isSelected(loan._id);
                      return (
                        <TableRow 
                          key={loan._id || index} 
                          hover
                          selected={isItemSelected}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: '#f5f9ff',
                              cursor: 'pointer'
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(33, 150, 243, 0.08)',
                              '&:hover': {
                                bgcolor: 'rgba(33, 150, 243, 0.12)',
                              }
                            },
                            borderBottom: '1px solid #f0f0f0'
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              onClick={() => handleSelectClick(loan._id)}
                              sx={{
                                color: '#bdbdbd',
                                '&.Mui-checked': {
                                  color: '#1565c0',
                                }
                              }}
                            />
                          </TableCell>
                          {columns
                            .filter(column => !column.startsWith('_')) // Filter out MongoDB internal fields
                            .map(column => (
                            <TableCell 
                              key={`${loan._id || index}-${column}`}
                              sx={{ 
                                fontWeight: column === 'loanNumber' ? 500 : 400,
                                fontSize: '0.85rem',
                                color: column === 'loanNumber' ? '#1565c0' : 'inherit'
                              }}
                              onClick={() => handleSelectClick(loan._id)}
                            >
                              {formatCellValue(loan[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.filter(col => !col.startsWith('_')).length + 1} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                          {loans.length === 0 ? 'No loans available' : 'No loans found matching the criteria'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Showing {paginatedLoans.length} of {sortedLoans.length} entries
              </Typography>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={sortedLoans.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontSize: '0.85rem',
                  },
                  '.MuiTablePagination-select': {
                    fontSize: '0.85rem',
                  }
                }}
              />
            </Box>
          </>
        )}
      </Paper>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoanTable; 