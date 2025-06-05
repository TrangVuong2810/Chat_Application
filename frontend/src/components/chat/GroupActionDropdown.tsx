"use client"

import type React from "react"

import { useState } from "react"
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material"
import { BsThreeDotsVertical } from "react-icons/bs"
import { IoPersonAdd, IoExitOutline, IoWarning } from "react-icons/io5"
import type { IConversationResponse } from "@/interfaces"
import { useAuthContext } from "@/context/useAuthContext"
import AddMembersDialog from "./AddMembersDialog"
import { useThemeContext } from "@/context/ThemeContext"

interface GroupActionsDropdownProps {
  conversation: IConversationResponse
  onLeaveGroup: () => void
  onMembersUpdated: () => void
}

const GroupActionsDropdown = ({ conversation, onLeaveGroup, onMembersUpdated }: GroupActionsDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()

  const open = Boolean(anchorEl)

  // Check if leaving would make the group have less than 3 members
  const canLeaveGroup = (conversation.participants?.length ?? 0) > 3

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLeaveGroup = () => {
    if (!canLeaveGroup) return
    setShowLeaveConfirm(true)
    handleClose()
  }

  const confirmLeaveGroup = () => {
    onLeaveGroup()
    setShowLeaveConfirm(false)
  }

  const handleAddMembers = () => {
    setShowAddMembers(true)
    handleClose()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          color: "text.secondary",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <BsThreeDotsVertical size={16} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleAddMembers}>
          <ListItemIcon>
            <IoPersonAdd size={18} style={{ color: theme.primary }} />
          </ListItemIcon>
          <ListItemText primary="Add Members" />
        </MenuItem>

        {canLeaveGroup ? (
          <MenuItem onClick={handleLeaveGroup} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <IoExitOutline size={18} style={{ color: "#f44336" }} />
            </ListItemIcon>
            <ListItemText primary="Leave Group" />
          </MenuItem>
        ) : (
          <Tooltip title="A group chat requires at least 3 members" placement="left">
            <MenuItem disabled>
              <ListItemIcon>
                <IoExitOutline size={18} style={{ color: "#bdbdbd" }} />
              </ListItemIcon>
              <ListItemText primary="Leave Group" />
            </MenuItem>
          </Tooltip>
        )}
      </Menu>

      {/* Leave Group Confirmation Dialog */}
      <Dialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            color: "error.main",
          }}
        >
          <IoWarning size={24} />
          <Typography component="span" variant="h6" fontWeight={600} color="error.main">
            Leave Group
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave "{conversation.groupName}"? You won't be able to see new messages unless
            someone adds you back to the group.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowLeaveConfirm(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmLeaveGroup} variant="contained" color="error" startIcon={<IoExitOutline size={18} />}>
            Leave Group
          </Button>
        </DialogActions>
      </Dialog>

      <AddMembersDialog
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        conversation={conversation}
        onMembersAdded={onMembersUpdated}
      />
    </>
  )
}

export default GroupActionsDropdown
