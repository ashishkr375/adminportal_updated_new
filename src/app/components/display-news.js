"use client"
import {
    IconButton,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    Chip
} from '@mui/material'
import TablePaginationActions from './common-props/TablePaginationActions'
import Button from '@mui/material/Button'
import {
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Star as StarIcon,
    Description as DescriptionIcon
} from '@mui/icons-material'
import React, { useState, useEffect } from 'react'
import { DescriptionModal } from './common-props/description-modal'
import { useSession } from 'next-auth/react'
import { AddForm } from './news-props/add-form'
import { EditForm } from './news-props/edit-form'
import Filter from './common-props/filter'

// Helper function to format dates safely
const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A'
    
    let date
    // Handle different date formats
    if (typeof dateValue === 'string') {
        // If it's a string timestamp, convert to number first
        const timestamp = parseInt(dateValue, 10)
        if (!isNaN(timestamp)) {
            date = new Date(timestamp)
        } else {
            // Try parsing as date string
            date = new Date(dateValue)
        }
    } else if (typeof dateValue === 'number') {
        // If it's already a number timestamp
        date = new Date(dateValue)
    } else {
        // If it's already a Date object
        date = dateValue
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date'
    }
    
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
    })
}



// News Table Row Component
const News = ({ newsItem, session, handleOpenEditModal, handleOpenDeleteModal, handleOpenDetailsModal }) => {
    return (
        <TableRow hover>
            <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {newsItem.title}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">
                    {formatDate(newsItem.updatedAt || newsItem.timestamp)}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">
                    {formatDate(newsItem.openDate)}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">
                    {newsItem.type || 'general'}
                </Typography>
            </TableCell>
            <TableCell>
                {newsItem.attachments && newsItem.attachments.length > 0 ? (
                    <Chip 
                        label={`${newsItem.attachments.length} file(s)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        No attachments
                    </Typography>
                )}
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenDetailsModal(newsItem)}
                            color="info"
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {(session?.user?.role === 'SUPER_ADMIN' || 
                      session?.user?.role === 'ACADEMIC_ADMIN' || 
                      session?.user?.role === 'DEPT_ADMIN') && (
                        <>
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(newsItem)}
                                    color="primary"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDeleteModal(newsItem)}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            </TableCell>
        </TableRow>
    )
}

const DataDisplay = (props) => {
    const {data:session,status}= useSession()
    const loading = status === "loading";
    const [details, setDetails] = useState(props.data)
    const [filterQuery, setFilterQuery] = useState(null)
    const [addModal, setAddModal] = useState(false)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(15)
    
    const addModalOpen = () => {
        setAddModal(true)
    }
    const handleCloseAddModal = () => {
        setAddModal(false)
    }

    useEffect(() => {
        if (!filterQuery) {
            fetch('/api/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    from: page * rowsPerPage,
                    to: (page + 1) * rowsPerPage,
                    type:"all"
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    // console.log(data.data);
                     setDetails(data.data)
                })
                .catch((err) => console.log(err))
        } else {
            fetch('/api/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    page: page * rowsPerPage,
                    to: (page + 1) * rowsPerPage,
                    ...filterQuery,
                    type:"range"
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log(data.data);

                     setDetails(data.data)
                })
                .catch((err) => console.log(err))
        }
    }, [filterQuery,page,rowsPerPage])

    // Modal state management
    const [editModal, setEditModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [detailsModal, setDetailsModal] = useState(false)
    const [selectedNews, setSelectedNews] = useState(null)

    const handleOpenEditModal = (newsItem) => {
        setSelectedNews(newsItem)
        setEditModal(true)
    }

    const handleCloseEditModal = () => {
        setEditModal(false)
        setSelectedNews(null)
    }

    const handleOpenDeleteModal = (newsItem) => {
        setSelectedNews(newsItem)
        setDeleteModal(true)
    }

    const handleCloseDeleteModal = () => {
        setDeleteModal(false)
        setSelectedNews(null)
    }

    const handleOpenDetailsModal = (newsItem) => {
        setSelectedNews(newsItem)
        setDetailsModal(true)
    }

    const handleCloseDetailsModal = () => {
        setDetailsModal(false)
        setSelectedNews(null)
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Recent News
                </Typography>
                {(session?.user?.role === 'SUPER_ADMIN' || 
                  session?.user?.role === 'ACADEMIC_ADMIN' || 
                  session?.user?.role === 'DEPT_ADMIN') && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={addModalOpen}
                        startIcon={<AddIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        Add News
                    </Button>
                )}
            </Box>

            {/* Filter */}
            <Box sx={{ mb: 3 }}>
                <Filter type="news" setEntries={setFilterQuery} />
            </Box>

            {/* Table */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Updated Date</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Open Date</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Attachments</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {details && details.length > 0 ? (
                                details.map((newsItem, index) => (
                                    <News
                                        key={newsItem.id || index}
                                        newsItem={newsItem}
                                        session={session}
                                        handleOpenEditModal={handleOpenEditModal}
                                        handleOpenDeleteModal={handleOpenDeleteModal}
                                        handleOpenDetailsModal={handleOpenDetailsModal}
                                    />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="textSecondary">
                                            No news items found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

                        <Box mt={3}>
                                <TablePagination
                                component="div"
                                count={-1}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[15, 25, 50, 100]}
                                    ActionsComponent={TablePaginationActions}
                                />
                        </Box>

            {/* Modals */}
            <AddForm handleClose={handleCloseAddModal} modal={addModal} />
            
            {selectedNews && (
                <>
                    <EditForm
                        data={selectedNews}
                        modal={editModal}
                        handleClose={handleCloseEditModal}
                    />
                    <DescriptionModal
                        data={selectedNews}
                        handleClose={handleCloseDetailsModal}
                        modal={detailsModal}
                    />
                </>
            )}
        </Box>
    )
}

export default DataDisplay

