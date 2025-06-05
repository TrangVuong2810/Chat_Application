"use client"

import type React from "react"
import { useParams, usePathname } from "next/navigation"
import { Box, Container } from "@mui/material"
import ChatBox from "@/components/chat/ChatBox"
import Profile from "@/components/chat/Profile"
import withAuth from "@/hocs/withAuth"
import { useThemeContext } from "@/context/ThemeContext"

const ChattingLayout = ({ children }: { children: React.ReactNode }) => {
  const params = useParams()
  const pathname = usePathname()
  const { conversationId } = params
  const { theme } = useThemeContext()

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.backgroundSecondary} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="xl" sx={{ height: "calc(100vh - 32px)", px: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            height: "100%",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Profile pathname={pathname} />
          {children}
          <ChatBox conversationId={conversationId as string} />
        </Box>
      </Container>
    </Box>
  )
}

export default withAuth(ChattingLayout)
