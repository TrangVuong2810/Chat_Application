"use client"

import { Avatar, Box, Typography, Card, CardContent, Badge } from "@mui/material"
import { GoDotFill } from "react-icons/go"
import { UserState } from "@/constants"
import { getTimeAgo } from "@/utils"
import type { IUser } from "@/interfaces"

interface FriendItemProps {
  friend: IUser
}

const FriendItem = ({ friend }: FriendItemProps) => {
  const isOnline = friend?.userState === UserState.ONLINE

  return (
    <Card
      sx={{
        mb: 1,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            <Avatar src={friend?.profilePicture} sx={{ width: 48, height: 48 }}>
              {friend?.fullName?.[0]}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {friend?.fullName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <GoDotFill
                size={12}
                style={{
                  color: isOnline ? "#4caf50" : "#9e9e9e",
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {isOnline ? "Active now" : `Active ${getTimeAgo(friend?.lastOnline)}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default FriendItem

