"use client"

import { useState } from "react"
import { useAuthContext } from "@/context/useAuthContext"
import { useQuery } from "@tanstack/react-query"
import { fetchFriendListApi } from "@/services/user"
import { addGroupMembersApi } from "@/services/conversation"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Tooltip,
  Divider,
  CircularProgress,
} from "@mui/material"
import { IoPersonAdd, IoCheckmark } from "react-icons/io5"
import { MdGroup } from "react-icons/md"
import type { IConversationResponse, IUser } from "@/interfaces"
import { useThemeContext } from "@/context/ThemeContext"

interface AddMembersDialogProps {
  open: boolean
  onClose: () => void
  conversation: IConversationResponse
  onMembersAdded: () => void
}

const AddMembersDialog = ({ open, onClose, conversation, onMembersAdded }: AddMembersDialogProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ["friendList"],
    queryFn: () => fetchFriendListApi(currentUser?.id),
    enabled: !!currentUser?.id,
  })

  const friends = Array.isArray(friendsData) ? friendsData : []

  // Extract participant IDs correctly
  const participantIds = conversation.participants?.map((p: any) => {
    return p.user ? p.user.id : p.id;
  }).filter(Boolean) || []

  // Split friends into available and existing members
  const { availableFriends, existingMemberFriends } = friends.reduce(
    (acc: { availableFriends: IUser[]; existingMemberFriends: IUser[] }, friend: IUser) => {
      const isAlreadyMember = participantIds.includes(friend.id)
      if (isAlreadyMember) {
        acc.existingMemberFriends.push(friend)
      } else {
        acc.availableFriends.push(friend)
      }
      return acc
    },
    { availableFriends: [] as IUser[], existingMemberFriends: [] as IUser[] },
  )

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return

    setIsLoading(true)
    try {
      await addGroupMembersApi(conversation.id, selectedMembers)
      onMembersAdded()
      setSelectedMembers([])
      onClose()
    } catch (error) {
      console.error("Failed to add members:", error)
      alert("Failed to add members. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <MdGroup size={24} style={{ color: theme.primary }} />
        <Box>
          <Typography component="span" variant="h6" fontWeight={600}>
            Add Members
          </Typography>
          <Typography component="div" variant="body2" color="text.secondary">
            {conversation.groupName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {friendsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={40} sx={{ color: theme.primary }} />
          </Box>
        ) : availableFriends.length === 0 && existingMemberFriends.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography color="text.secondary">No friends available to add to this group.</Typography>
          </Box>
        ) : friends.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography color="text.secondary">No friends available to add to this group.</Typography>
          </Box>
        ) : availableFriends.length === 0 && existingMemberFriends.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography color="text.secondary">No friends available to add to this group.</Typography>
          </Box>
        ) : (
          <>
            {/* Available friends to add */}
            {availableFriends.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 600, color: theme.primary }}>
                  Available Friends ({availableFriends.length})
                </Typography>
                <List sx={{ maxHeight: 200, overflow: "auto" }}>
                  {availableFriends.map((friend: IUser) => (
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
                      {selectedMembers.includes(friend.id) && (
                        <IoCheckmark size={20} style={{ color: theme.primary }} />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {/* Selected members preview */}
            {selectedMembers.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Selected ({selectedMembers.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedMembers.map((memberId) => {
                      const member = availableFriends.find((f: IUser) => f.id === memberId)
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
                </Box>
              </>
            )}

            {/* Existing members */}
            {existingMemberFriends.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ p: 2, pb: 1, fontWeight: 600, color: "text.secondary" }}>
                    Already in Group ({existingMemberFriends.length})
                  </Typography>
                  <List sx={{ maxHeight: 150, overflow: "auto" }}>
                    {existingMemberFriends.map((friend: IUser) => (
                      <Tooltip key={friend.id} title={`${friend.fullName} is already a member of this group`} arrow>
                        <ListItem sx={{ opacity: 0.6 }}>
                          <ListItemAvatar>
                            <Avatar src={friend.profilePicture} sx={{ width: 40, height: 40 }}>
                              {friend.fullName?.[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={friend.fullName}
                            secondary="Already a member"
                            primaryTypographyProps={{ fontWeight: 500 }}
                          />
                          <Chip label="Member" size="small" variant="outlined" />
                        </ListItem>
                      </Tooltip>
                    ))}
                  </List>
                </Box>
              </>
            )}

            {availableFriends.length === 0 && existingMemberFriends.length > 0 && (
              <Box sx={{ textAlign: "center", p: 3 }}>
                <Typography color="text.secondary" variant="body2">
                  All your friends are already members of this group.
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleAddMembers}
          disabled={selectedMembers.length === 0 || isLoading}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : <IoPersonAdd size={18} />}
          sx={{
            background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            "&:hover": {
              background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
            },
          }}
        >
          {isLoading ? "Adding..." : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMembersDialog
