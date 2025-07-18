import React from 'react'
import { Modal, Box, Button } from '@mui/material'
import Notice from './entry forms/notice-entry'

function rand() {
    return Math.round(Math.random() * 20) - 10
}

function getModalStyle() {
    const top = 50 + rand()
    const left = 50 + rand()

    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    }
}

const paperStyle = {
    position: 'absolute',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
}

export default function SimpleModal({ children }) {
    // getModalStyle is not a pure function, we roll the style only on the first render
    const [modalStyle] = React.useState(getModalStyle)
    const [open, setOpen] = React.useState(false)

    const handleOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
    }

    return (
        <div>
            <Button variant="contained" onClick={handleOpen}>
                Open Modal
            </Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <Box sx={{ ...paperStyle, ...modalStyle }}>
                    {children}
                </Box>
            </Modal>
        </div>
    )
}
