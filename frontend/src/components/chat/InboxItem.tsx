"use client"

import { Avatar, Box, Typography, ListItem, ListItemAvatar, ListItemText, Badge, ListItemButton } from "@mui/material"
import { useRouter, usePathname } from "next/navigation"
import { MdGroup } from "react-icons/md"
import { getTimeAgo } from "@/utils"
import { UserState } from "@/constants"
import { useThemeContext } from "@/context/ThemeContext"
import type { IConversationResponse, IUser } from "@/interfaces"

interface InboxProps {
  conversation: IConversationResponse | undefined
  currentUserId: string
}

const getReceiver = (conversation: IConversationResponse, currentUser: { id: string }): IUser | undefined => {
  return conversation?.participants
    ?.map((participant: any) => participant.user || participant)
    ?.find((user: IUser) => user.id !== currentUser.id);
}

function InboxItem({ conversation, currentUserId }: InboxProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useThemeContext()
  const isActive = pathname === `/u/${conversation?.id}`

  if (!conversation) {
    return null
  }

  const lastMessage = conversation?.messages[conversation?.messages.length - 1] ?? null

  const renderConversationInfo = () => {
    if (conversation.groupConversation) {
      return (
        <>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.primary }}>
              <MdGroup size={20} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {conversation.groupName}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" noWrap>
                {conversation.participants?.length ?? 0} members
                {lastMessage && ` • ${lastMessage.content}`}
              </Typography>
            }
          />
        </>
      )
    } else {
      const otherUser = getReceiver(conversation, { id: currentUserId })
      const isOnline = otherUser?.userState === UserState.ONLINE

      return (
        <>
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                isOnline ? (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "#4caf50",
                      border: "2px solid white",
                    }}
                  />
                ) : null
              }
            >
              <Avatar src={otherUser?.profilePicture} sx={{ width: 48, height: 48 }}>
                {otherUser?.fullName?.[0]}
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {otherUser?.fullName}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" noWrap>
                {lastMessage?.content || "No messages yet"}
              </Typography>
            }
          />
        </>
      )
    }
  }

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => router.push(`/u/${conversation.id}`)}
        sx={{
          borderRadius: 0,
          py: 1.5,
          px: 2,
          bgcolor: isActive ? `${theme.primary}15` : "transparent",
          borderLeft: isActive ? `3px solid ${theme.primary}` : "3px solid transparent",
          "&:hover": {
            bgcolor: isActive ? `${theme.primary}20` : "action.hover",
          },
          transition: "all 0.2s ease",
        }}
      >
        {renderConversationInfo()}
        <Box sx={{ ml: 1, textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">
            {getTimeAgo(lastMessage?.dateSent ? String(lastMessage.dateSent) : "")}
          </Typography>
        </Box>
      </ListItemButton>
    </ListItem>
  )
}

export default InboxItem

