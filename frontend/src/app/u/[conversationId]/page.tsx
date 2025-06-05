"use client"

import { useParams } from "next/navigation"
import MessageList from "@/components/chat/MessageList"
import ChattingLayout from "./ChattingLayout"
import { useAuthContext } from "@/context/useAuthContext"
import { Box, Typography } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"

const Page = () => {
  const params = useParams()
  const { conversationId } = params
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()

  // useEffect(() => {
  //   const fetchConversation = async () => {
  //     // Fetch conversation data, messages, and participants
  //   }
  //   fetchConversation()
  // }, [conversationId])

  return (
    <ChattingLayout>
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
        {currentUser ? (
          <MessageList currentUser={currentUser} />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 3,
            }}
          >
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Loading conversation...
            </Typography>
          </Box>
        )}
      </Box>
    </ChattingLayout>
  )
}

export default Page
