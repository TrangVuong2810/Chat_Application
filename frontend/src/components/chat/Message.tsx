"use client"

import { Avatar, Box, Typography, Paper } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"
import Image from "next/image"
import MessageTooltip from "../MessageTooltip"
import { getTimeAgo } from "@/utils"
import type { IMessageResponse } from "@/interfaces"

type MessageItem = {
  message: IMessageResponse
  options: {
    currentUserId: string
    senderExceptCurrentUser: any
    messageList?: IMessageResponse[]
    messageKey?: number
  }
}

const Message = (props: MessageItem) => {
  const { message, options } = props
  const { messageList, messageKey } = options
  const { theme } = useThemeContext()

  const shouldHideAvatarForCurrentMessage = () => {
    if (
      messageList &&
      typeof messageKey === "number" &&
      messageKey > 0 &&
      messageList[messageKey]?.sender?.id === messageList[messageKey - 1]?.sender?.id
    ) {
      return true
    }
    return false
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const shouldDisplayImage = () => {
    return (
      message.image && typeof message.image === "string" && message.image.trim() !== "" && isValidUrl(message.image)
    )
  }

  const getAvatarFallback = (user: any) => {
    if (user?.username) {
      return user.username[0].toUpperCase()
    }
    return "U"
  }

  // Handle messages without sender (system messages)
  if (!message.sender) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", my: 1 }}>
        <Paper
          sx={{
            bgcolor: "grey.100",
            color: "text.secondary",
            px: 2,
            py: 0.5,
            borderRadius: 3,
            fontSize: "0.875rem",
          }}
        >
          {message.content}
        </Paper>
      </Box>
    )
  }

  // Handle system messages by checking sender username or id
  if (message.sender.username === "system" || message.sender.id === "system") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", my: 1 }}>
        <Paper
          sx={{
            bgcolor: "grey.100",
            color: "text.secondary",
            px: 2,
            py: 0.5,
            borderRadius: 3,
            fontSize: "0.875rem",
          }}
        >
          {message.content}
        </Paper>
      </Box>
    )
  }

  // Current user's messages (right side)
  if (options.currentUserId === message.sender.id) {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Box sx={{ maxWidth: "70%" }}>
          <MessageTooltip content={getTimeAgo(message.dateSent) || ""}>
            <Paper
              sx={{
                background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                color: "white",
                px: 2,
                py: 1,
                borderRadius: "18px 18px 4px 18px",
                wordBreak: "break-word",
              }}
            >
              <Typography variant="body2">{message.content}</Typography>
            </Paper>
          </MessageTooltip>
          {shouldDisplayImage() && (
            <Box sx={{ mt: 1 }}>
              <Image
                src={message.image! || "/placeholder.svg"}
                width={300}
                height={300}
                alt="shared image"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "12px",
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  // Other user's messages (left side)
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", mb: 1 }}>
      <Avatar
        src={message.sender?.profilePicture || options.senderExceptCurrentUser?.profilePicture}
        sx={{
          width: 32,
          height: 32,
          mr: 1,
          opacity: shouldHideAvatarForCurrentMessage() ? 0 : 1,
        }}
      >
        {getAvatarFallback(message.sender || options.senderExceptCurrentUser)}
      </Avatar>
      <Box sx={{ maxWidth: "70%" }}>
        <MessageTooltip content={getTimeAgo(message.dateSent) ?? ""}>
          <Paper
            sx={{
              bgcolor: "grey.100",
              color: "text.primary",
              px: 2,
              py: 1,
              borderRadius: "18px 18px 18px 4px",
              wordBreak: "break-word",
            }}
          >
            <Typography variant="body2">{message.content}</Typography>
          </Paper>
        </MessageTooltip>
        {shouldDisplayImage() && (
          <Box sx={{ mt: 1 }}>
            <Image
              src={message.image! || "/placeholder.svg"}
              width={300}
              height={300}
              alt="shared image"
              style={{
                maxWidth: "100%",
                height: "auto",
                borderRadius: "12px",
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Message
