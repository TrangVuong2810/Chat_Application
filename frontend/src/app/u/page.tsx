"use client"
import MessageList from "@/components/chat/MessageList"
import { useAuthContext } from "@/context/useAuthContext"
import DashboardLayout from "./DashboardLayout"
import { Box, Typography } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"

const Page = () => {
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()

  // const { connect } = useSocketContext()
  // useEffect(() => {
  //   connect()
  // }, [])

  return (
    <DashboardLayout>
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
              Welcome to Chat Application
            </Typography>
          </Box>
        )}
      </Box>
    </DashboardLayout>
  )
}

export default Page

