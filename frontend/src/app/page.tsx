"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Box, CircularProgress, Container, Typography } from "@mui/material"
import { motion } from "framer-motion"
import { useThemeContext } from "@/context/ThemeContext"
import withAuth from "@/hocs/withAuth"

function Home() {
  const router = useRouter()
  const { theme } = useThemeContext()

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem("accessToken")

      if (accessToken) {
        router.push("/u")
      } else {
        router.push("/sign-in")
      }
    }

    // Small delay to prevent flash
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center" }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{
            background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 3,
          }}
        >
          Chat Application
        </Typography>

        <Box sx={{ mb: 3 }}>
          <CircularProgress
            size={40}
            sx={{
              color: theme.primary,
            }}
          />
        </Box>

        <Typography variant="body1" color="text.secondary">
          Redirecting you to the right place...
        </Typography>
      </motion.div>
    </Container>
  )
}

export default withAuth(Home)
