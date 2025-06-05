"use client"

import { useState } from "react"
import { useAuthContext } from "@/context/useAuthContext"
import { useQuery } from "@tanstack/react-query"
import { fetchFriendListApi } from "@/services/user"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Button,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  TextField,
  Divider,
  CircularProgress,
} from "@mui/material"
import { IoCheckmark } from "react-icons/io5"
import { MdGroupAdd } from "react-icons/md"
import type { IUser } from "@/interfaces"
import { useThemeContext } from "@/context/ThemeContext"

interface CreateGroupDialogProps {
  open: boolean
  onClose: () => void
  onCreateGroup: (participants: string[], groupName: string) => void
}

const CreateGroupDialog = ({ open, onClose, onCreateGroup }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: ["friendList"],
    queryFn: () => fetchFriendListApi(currentUser?.id),
  })

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const handleCreate = async () => {
    if (groupName.trim() && selectedMembers.length >= 2) {
      setIsCreating(true)
      try {
        // Include current user + selected members (minimum 3 total)
        const allParticipants = [currentUser.id, ...selectedMembers]
        await onCreateGroup(allParticipants, groupName)
        setGroupName("")
        setSelectedMembers([])
        onClose()
      } catch (error) {
        console.error("Failed to create group:", error)
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setGroupName("")
      setSelectedMembers([])
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pb: 1,
        }}
      >
        <MdGroupAdd size={24} style={{ color: theme.primary }} />
        <Box>
          <Typography component="span" variant="h6" fontWeight={600}>
            Create Group Chat
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          variant="outlined"
          margin="normal"
          placeholder="Enter group name..."
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.primary }}>
          Select Members (minimum 2)
        </Typography>

        {friendsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={40} sx={{ color: theme.primary }} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 250, overflow: "auto", border: "1px solid #e0e0e0", borderRadius: 2 }}>
            {friends?.map((friend: IUser) => (
              <ListItemButton key={friend.id} onClick={() => handleMemberToggle(friend.id)}>
                <ListItemAvatar>
                  <Avatar src={friend.profilePicture} sx={{ width: 40, height: 40 }}>
                    {friend.fullName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={friend.fullName}
                  secondary={friend.username}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {selectedMembers.includes(friend.id) && <IoCheckmark size={20} style={{ color: theme.primary }} />}
              </ListItemButton>
            ))}
          </List>
        )}

        {selectedMembers.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected Members ({selectedMembers.length + 1} total)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={currentUser.fullName}
                size="small"
                sx={{
                  bgcolor: theme.secondary,
                  color: "white",
                }}
              />
              {selectedMembers.map((memberId) => {
                const member = friends?.find((f: IUser) => f.id === memberId)
                return (
                  <Chip
                    key={memberId}
                    label={member?.fullName}
                    onDelete={() => handleMemberToggle(memberId)}
                    size="small"
                    sx={{
                      bgcolor: theme.primary,
                      color: "white",
                      "& .MuiChip-deleteIcon": {
                        color: "white",
                      },
                    }}
                  />
                )
              })}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={isCreating}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedMembers.length < 2 || isCreating}
          variant="contained"
          startIcon={isCreating ? <CircularProgress size={16} /> : <MdGroupAdd size={18} />}
          sx={{
            background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
            },
          }}
        >
          {isCreating ? "Creating..." : "Create Group"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateGroupDialog
