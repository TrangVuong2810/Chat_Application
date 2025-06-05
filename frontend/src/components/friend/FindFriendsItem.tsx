"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, Button, Snackbar, Card, CardContent, Typography, Box, CircularProgress } from "@mui/material"
import MuiAlert from "@mui/material/Alert"
import { IoPersonAdd } from "react-icons/io5"
import { sendFriendRequestApi } from "@/services/user"
import type { IUser } from "@/interfaces"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useThemeContext } from "@/context/ThemeContext"

interface FindFriendsItemProps {
  user: IUser
  currentUserId: string
}

const FindFriendsItem = ({ user, currentUserId }: FindFriendsItemProps) => {
  const [isRequestSent, setIsRequestSent] = useState(false)
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()

  // Toast state
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "info" | "warning"
  }>({ open: false, message: "", severity: "info" })

  const showToast = (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ open: true, message, severity })
  }

  const handleCloseToast = () => {
    setToast({ ...toast, open: false })
  }

  const { mutate: sendRequest, isPending } = useMutation({
    mutationFn: () => sendFriendRequestApi(currentUserId, user.id),
    onSuccess: () => {
      setIsRequestSent(true)
      showToast(`Friend request sent to ${user.fullName}`, "success")
      queryClient.invalidateQueries({
        queryKey: ["nonFriendUsers"],
      })
    },
    onError: () => {
      showToast("Failed to send friend request", "error")
    },
  })

  const handleSendRequest = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    sendRequest()
  }

  return (
    <>
      <Card
        sx={{
          mb: 1,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transform: "translateY(-1px)",
          },
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar src={user.profilePicture} sx={{ width: 48, height: 48 }}>
                {user.fullName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : <IoPersonAdd size={18} />}
              onClick={handleSendRequest}
              disabled={isPending || isRequestSent}
              sx={{
                minWidth: 120,
                background: isRequestSent
                  ? "#4caf50"
                  : `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                "&:hover": {
                  background: isRequestSent
                    ? "#45a049"
                    : `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                },
                "&:disabled": {
                  background: isRequestSent ? "#4caf50" : "#e0e0e0",
                },
              }}
            >
              {isRequestSent ? "Sent" : isPending ? "Sending..." : "Add Friend"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert elevation={6} variant="filled" severity={toast.severity} onClose={handleCloseToast}>
          {toast.message}
        </MuiAlert>
      </Snackbar>
    </>
  )
}

export default FindFriendsItem

