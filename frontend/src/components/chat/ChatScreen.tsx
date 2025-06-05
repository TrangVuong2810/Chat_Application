"use client"

import { useState } from "react"
import { Box, Container } from "@mui/material"
import ChatBox from "./ChatBox"
import MessageList from "./MessageList"
import Profile from "./Profile"
import { useAuthContext } from "@/context/useAuthContext"
import { useThemeContext } from "@/context/ThemeContext"

function ChatScreen() {
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.backgroundSecondary} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ height: "calc(100vh - 32px)" }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            height: "100%",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Profile />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              bgcolor: "background.paper",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <MessageList currentUser={currentUser} />
          </Box>
          <ChatBox conversationId={selectedConversationId} />
        </Box>
      </Container>
    </Box>
  )
}

export default ChatScreen

