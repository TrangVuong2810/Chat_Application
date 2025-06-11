"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
  Typography,
} from "@mui/material"
import { IoLogOut, IoWarning } from "react-icons/io5"
import { logoutApi } from "@/services/auth"
import { useSocketContext } from "@/context/useSocketContext"
import { useThemeContext } from "@/context/ThemeContext"

const LogoutDialog = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { theme } = useThemeContext()
  const [disconnect, setDisconnect] = useState<(() => void) | null>(null)

  const socketContext = useSocketContext()

  useEffect(() => {
    try {
      setDisconnect(() => socketContext?.disconnect)
    } catch (error) {
      console.log("Socket context not available during logout:", error)
    }
  }, [socketContext])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logoutApi()

      if (socketContext?.disconnect && typeof socketContext.disconnect === "function") {
        console.log("Disconnecting WebSocket...")
        socketContext.disconnect()
      }
      
      localStorage.removeItem("accessToken")
      localStorage.removeItem("currentUser")

      if (disconnect && typeof disconnect === "function") {
        disconnect()
      }

      router.push("/sign-in")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <Box
        onClick={() => setOpen(true)}
        sx={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderRadius: 1,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        {children}
      </Box>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "error.main",
          }}
        >
          <IoWarning size={24} />
          <Typography component="span" variant="h6" fontWeight={600} color="error.main">
            Confirm Logout
          </Typography>
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to sign out? You'll need to sign in again to access your conversations.
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setOpen(false)
              await handleLogout()
            }}
            variant="contained"
            color="error"
            disabled={isLoading}
            startIcon={<IoLogOut size={18} />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              background: "linear-gradient(45deg, #f44336 0%, #d32f2f 100%)",
              "&:hover": {
                background: "linear-gradient(45deg, #d32f2f 0%, #c62828 100%)",
              },
            }}
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default LogoutDialog
