"use client"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from "@mui/material"
import { IoClose } from "react-icons/io5"
import { MdGroup } from "react-icons/md"
import { GoDotFill } from "react-icons/go"
import type { IConversationResponse, IUser } from "@/interfaces"
import { UserState } from "@/constants"
import { useThemeContext } from "@/context/ThemeContext"
import { useAuthContext } from "@/context/useAuthContext"

interface GroupMembersDialogProps {
  open: boolean
  onClose: () => void
  conversation: IConversationResponse
  onlineMembers: IUser[]
}

const GroupMembersDialog = ({ open, onClose, conversation, onlineMembers }: GroupMembersDialogProps) => {
  const { theme } = useThemeContext()
  const { currentUser } = useAuthContext()

  const isUserOnline = (userId: string) => {
    return onlineMembers.some((member) => member.id === userId)
  }

  const getStatusText = (user: IUser) => {
    if (isUserOnline(user.id)) {
      return "Online"
    }
    return user.userState === UserState.OFFLINE ? "Offline" : "Away"
  }

  const getStatusColor = (user: IUser) => {
    if (isUserOnline(user.id)) {
      return "#4caf50"
    }
    return "#9e9e9e"
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
          maxHeight: "70vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <MdGroup size={24} style={{ color: theme.primary }} />
          <Box>
            <Typography component="span" variant="h6" fontWeight={600}>
              Group Members
            </Typography>
            <Typography component="div" variant="body2" color="text.secondary">
              {conversation.groupName}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <IoClose size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: theme.primary }}>
            {conversation.participants?.length || 0} Members
            {onlineMembers.length > 0 && (
              <Chip
                label={`${onlineMembers.length} online`}
                size="small"
                sx={{ ml: 2, bgcolor: "#4caf50", color: "white" }}
              />
            )}
          </Typography>
        </Box>

        <List sx={{ pt: 0 }}>
          {conversation.participants?.map((participant: any) => {
            const user = participant.user || participant
            const isCurrentUser = user.id === currentUser.id
            const isOnline = isUserOnline(user.id)

            return (
              <ListItem key={user.id} sx={{ py: 1.5 }}>
                <ListItemAvatar>
                  <Box sx={{ position: "relative" }}>
                    <Avatar src={user.profilePicture} sx={{ width: 48, height: 48 }}>
                      {user.fullName?.[0]}
                    </Avatar>
                    {isOnline && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#4caf50",
                          border: "2px solid white",
                        }}
                      />
                    )}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography component="span" variant="subtitle1" fontWeight={500}>
                        {user.fullName}
                        {isCurrentUser && " (You)"}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <GoDotFill style={{ color: getStatusColor(user), fontSize: 12 }} />
                      <Typography component="span" variant="caption" color="text.secondary">
                        {getStatusText(user)}
                      </Typography>
                      {user.username && (
                        <>
                          <Typography component="span" variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      </DialogContent>
    </Dialog>
  )
}

export default GroupMembersDialog
