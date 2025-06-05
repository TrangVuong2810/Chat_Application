"use client"
import { useRouter } from "next/navigation"
import {
  Box,
  Card,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Divider,
} from "@mui/material"
import { IoSettings, IoPeopleSharp, IoLogOut } from "react-icons/io5"
import { IoMdChatbubbles } from "react-icons/io"
import { HiUserGroup } from "react-icons/hi"
import { useThemeContext } from "@/context/ThemeContext"
import { useAuthContext } from "@/context/useAuthContext"
import LogoutDialog from "../LogoutDialog"

interface ProfileProps {
  pathname?: string
}

const Profile = ({ pathname }: ProfileProps) => {
  const { currentUser } = useAuthContext()
  const router = useRouter()
  const { theme } = useThemeContext()

  const menuItems = [
    {
      icon: IoMdChatbubbles,
      path: "/u",
      tooltip: "Chats",
      isActive: pathname?.match(/^\/u(\/[a-zA-Z0-9]+)?$/) || pathname === "/u",
    },
    {
      icon: IoPeopleSharp,
      path: `/friends/${currentUser?.id}`,
      tooltip: "Friends",
      isActive: pathname?.includes("/friends/"),
    },
    {
      icon: HiUserGroup,
      path: "/groups",
      tooltip: "Groups",
      isActive: pathname === "/groups",
    },
  ]

  return (
    <Card
      sx={{
        width: 80,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
        color: "white",
        borderRadius: 2,
        py: 2,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* User Avatar */}
      <Box sx={{ mb: 3 }}>
        <Tooltip title={currentUser?.fullName || "User"} placement="right">
          <Avatar
            src={currentUser?.profilePicture}
            sx={{
              width: 48,
              height: 48,
              border: "3px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {currentUser?.fullName?.[0]}
          </Avatar>
        </Tooltip>
      </Box>

      <Divider sx={{ width: "60%", bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, width: "100%", px: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            <Tooltip title={item.tooltip} placement="right">
              <ListItemButton
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: "center",
                  bgcolor: item.isActive ? "rgba(255,255,255,0.2)" : "transparent",
                  color: item.isActive ? "white" : "rgba(255,255,255,0.7)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "white",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  <item.icon size={24} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ width: "60%", bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

      {/* Logout */}
      <LogoutDialog>
        <Tooltip title="Sign Out" placement="right">
          <IconButton
            sx={{
              color: "rgba(255,255,255,0.7)",
              transition: "all 0.2s ease",
              "&:hover": {
                color: "white",
                bgcolor: "rgba(255,255,255,0.1)",
                transform: "scale(1.1)",
              },
            }}
          >
            <IoLogOut size={24} />
          </IconButton>
        </Tooltip>
      </LogoutDialog>
    </Card>
  )
}

export default Profile
