"use client"

import type React from "react"

import { Avatar, Button, Box, Typography, Card, CardContent, CircularProgress } from "@mui/material"
import { IoCheckmark, IoClose } from "react-icons/io5"
import { changeFriendRequestStatusApi } from "@/services/user"
import { FriendRequestStatus } from "@/constants"
import type { IFriendInvitationResponse } from "@/interfaces"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useThemeContext } from "@/context/ThemeContext"

interface FriendRequestItemProps {
  currentUserId: string
  friend: IFriendInvitationResponse
}

const FriendRequestItem = ({ currentUserId, friend }: FriendRequestItemProps) => {
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()

  const { mutate, isPending } = useMutation({
    mutationFn: (status: string) =>
      changeFriendRequestStatusApi(friend.requestId, {
        senderId: currentUserId,
        friendRequestStatus: status,
      }),
    onSuccess: async (data, status) => {
      // Only invalidate queries after successful backend response
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friendRequestList"] }),
        queryClient.invalidateQueries({ queryKey: ["friendList"] }),
        queryClient.invalidateQueries({ queryKey: ["nonFriendUsers"] }),
      ])
    },
    onError: (error) => {
      console.error("Failed to update friend request:", error)
      // Optionally show error toast here
    }
  })

  const handleAccept = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    mutate(FriendRequestStatus.ACCEPTED)
  }

  const handleReject = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    mutate(FriendRequestStatus.REJECTED)
  }

  return (
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
            <Avatar src={friend?.sender?.profilePicture} sx={{ width: 48, height: 48 }}>
              {friend?.sender?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {friend?.sender?.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Wants to be your friend
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleAccept}
              disabled={isPending}
              startIcon={isPending ? <CircularProgress size={16} /> : <IoCheckmark size={16} />}
              sx={{
                background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                },
                minWidth: 80,
              }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleReject}
              disabled={isPending}
              startIcon={<IoClose size={16} />}
              sx={{
                color: "text.secondary",
                borderColor: "grey.300",
                "&:hover": {
                  borderColor: "grey.400",
                  bgcolor: "grey.50",
                },
                minWidth: 80,
              }}
            >
              Decline
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default FriendRequestItem
