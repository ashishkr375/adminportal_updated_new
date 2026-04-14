import {
    IconButton,
    TablePagination,
    Typography,
    Button,
    Grid,
    Paper,
    Box,
} from '@mui/material'
import {
    Edit,
    Description,
    Link as LinkIcon,
} from '@mui/icons-material'
import React, { useState, useEffect } from 'react'
import { AddForm } from './innovation-props/add-form'
import { EditForm } from './innovation-props/edit-form'
import { useSession } from 'next-auth/react'
import { DescriptionModal } from './common-props/description-modal'
import Filter from './common-props/filter'
import TablePaginationActions from './common-props/TablePaginationActions'

const paperSx = {
    flexGrow: 1,
    boxSizing: 'border-box',
}

const itemPaperSx = {
    margin: '8px auto',
    padding: '12px',
    lineHeight: 1.5,
}

const truncateSx = {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}

const iconSx = {
    display: 'block',
    fontSize: '2rem',
    marginLeft: 'auto',
    marginRight: 'auto',
}

const attachedSx = {
    '& > span': { paddingLeft: '8px' },
    '& > span:first-of-type': {
        paddingLeft: 0,
    },
}

const DataDisplay = (props) => {
    const {data:session} = useSession()
    const [details, setDetails] = useState(Array.isArray(props.data) ? props.data : [])
    const [total, setTotal] = useState(Array.isArray(props.data) ? props.data.length : 0)
    const [filterQuery, setFilterQuery] = useState(null)

    // const [rows, setRows] = useState(props.data);
    // const totalRow = [...rows]
    const [page, setPage] = React.useState(0)
    const [rowsPerPage, setRowsPerPage] = React.useState(15)

    // const emptyRows =
    // 	rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    const handleChangePage = (event, newPage) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const [addModal, setAddModal] = useState(false)
    const addModalOpen = () => {
        setAddModal(!addModal)
    }
    const handleCloseAddModal = () => {
        setAddModal(false)
    }

    useEffect(() => {
        if (!filterQuery) {
            fetch('/api/innovation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    from: page * rowsPerPage,
                    to: page * rowsPerPage + rowsPerPage,
                    type:"between"
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setDetails(Array.isArray(data?.data) ? data.data : [])
                    setTotal(Number(data?.total) || 0)
                })
                .catch((err) => console.log(err))
        } else {
            fetch('/api/innovation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...filterQuery,
                    from: page * rowsPerPage,
                    to: page * rowsPerPage + rowsPerPage,
                    type:"range"
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setDetails(Array.isArray(data?.data) ? data.data : [])
                    setTotal(Number(data?.total) || 0)
                })
                .catch((err) => console.log(err))
        }

        // setDetails(await response.json());

        console.log('page : ', page)
        console.log('rowperpage : ', rowsPerPage)

        // console.log(response.json());
    }, [page, rowsPerPage, filterQuery])

    const Innovation = ({ detail }) => {
        const dateValue = detail.openDate ?? detail.timestamp ?? detail.updatedAt
        const parsedDate = new Date(dateValue)
        const openDate = Number.isNaN(parsedDate.getTime())
            ? 'N/A'
            : `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear()}`

        const [editModal, setEditModal] = useState(false)
        const [descriptionModal, setDescriptionModal] = useState(false)

        const editModalOpen = () => {
            setEditModal(true)
        }

        const handleCloseEditModal = () => {
            setEditModal(false)
        }

        const descModalOpen = () => {
            setDescriptionModal(true)
        }

        const handleCloseDescModal = () => {
            setDescriptionModal(false)
        }

        return (
            <React.Fragment key={detail.id}>
                <Grid item xs={12} sm={8} lg={10}>
                    <Paper
                        sx={{ ...itemPaperSx, minHeight: '50px', position: 'relative' }}
                    >
                        <Box sx={truncateSx}>{detail.title}</Box>
                        <Box sx={attachedSx}>
                            {detail.image && (() => {
                                try {
                                    const images = typeof detail.image === 'string' ? 
                                        JSON.parse(detail.image) : 
                                        detail.image;
                                        
                                    return images.map((img, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                marginRight: '10px',
                                                display: 'inline-flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <a 
                                                href={img.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#1976d2',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <LinkIcon style={{ marginRight: '5px' }} />
                                                {img.caption}
                                            </a>
                                        </span>
                                    ));
                                } catch (e) {
                                    console.error('Error parsing image data:', e);
                                    return null;
                                }
                            })()}
                        </Box>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            <div>Uploaded By : {detail.email} </div>
                            <div>Updated By: {detail.updatedBy} </div>
                            <div>Open Date: {openDate}</div>
                        </div>
                    </Paper>
                </Grid>

                <Grid item xs={6} sm={2} lg={1}>
                    <Paper
                        sx={{ ...itemPaperSx, textAlign: 'center', cursor: 'pointer' }}
                        onClick={descModalOpen}
                    >
                        <Description sx={iconSx} />
                        <span>Description</span>
                    </Paper>
                    <DescriptionModal
                        data={detail}
                        handleClose={handleCloseDescModal}
                        modal={descriptionModal}
                    />
                </Grid>
                {session?.user?.role == 1 ||
                session?.user?.email === detail.email ? (
                    <Grid item xs={6} sm={2} lg={1}>
                        <Paper
                            sx={{ ...itemPaperSx, textAlign: 'center', cursor: 'pointer' }}
                            onClick={editModalOpen}
                        >
                            <Edit sx={iconSx} /> <span>Edit</span>
                        </Paper>{' '}
                        <EditForm
                            data={detail}
                            modal={editModal}
                            handleClose={handleCloseEditModal}
                        />
                    </Grid>
                ) : (
                    <Grid item xs={6} sm={2} lg={1}>
                        <Paper
                            sx={{ ...itemPaperSx, textAlign: 'center', cursor: 'pointer' }}
                        ></Paper>{' '}
                    </Grid>
                )}
            </React.Fragment>
        )
    }

    return (
        <>
            <header>
                <Typography variant="h4" style={{ margin: `15px 0` }}>
                    Recent Innovations
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={addModalOpen}
                >
                    ADD +
                </Button>
                <Filter type="innovation" setEntries={setFilterQuery} />
            </header>

            <AddForm handleClose={handleCloseAddModal} modal={addModal} />

            <Grid container spacing={2} sx={paperSx}>
                {details.map((row,index) => {
                    return <Innovation key={row.id || index} detail={row} />
                })}
            </Grid>
            <Box mt={3}>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[15, 25, 50, 100]}
                    ActionsComponent={TablePaginationActions}
                />
            </Box>
        </>
    )
}

export default DataDisplay
