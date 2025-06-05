"use client"

import type React from "react"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardContent, Typography, Box } from "@mui/material"
import { IoPeopleSharp, IoPersonAdd, IoMailOpen } from "react-icons/io5"
import { useAuthContext } from "@/context/useAuthContext"
import { fetchFriendListApi, fetchFriendRequestListApi, fetchNonFriendUsersApi } from "@/services/user"
import FriendItem from "./FriendItem"
import FriendRequestItem from "./FriendRequestItem"
import FindFriendsItem from "./FindFriendsItem"
import { CustomTabs, TabPanel } from "../common/tabs"
import { Skeleton } from "@/components/common/skeleton"
import { useThemeContext } from "@/context/ThemeContext"

const FriendList = () => {
  const { currentUser } = useAuthContext()
  const [tabValue, setTabValue] = useState(0)
  const { theme } = useThemeContext()

  const { data: friendList, isLoading: friendsLoading } = useQuery({
    queryKey: ["friendList"],
    queryFn: () => fetchFriendListApi(currentUser?.id),
  })

  const { data: friendRequestList, isLoading: requestsLoading } = useQuery({
    queryKey: ["friendRequestList"],
    queryFn: () => fetchFriendRequestListApi(currentUser?.id),
  })

  const { data: nonFriendUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["nonFriendUsers"],
    queryFn: () => fetchNonFriendUsersApi(currentUser?.id, currentUser?.token),
    enabled: !!currentUser?.id,
  })

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const tabs = [
    {
      label: `Requests ${friendRequestList?.length ? `(${friendRequestList.length})` : ""}`,
      icon: <IoMailOpen size={18} />,
    },
    {
      label: `Friends ${friendList?.length ? `(${friendList.length})` : ""}`,
      icon: <IoPeopleSharp size={18} />,
    },
    {
      label: "Find Friends",
      icon: <IoPersonAdd size={18} />,
    },
  ]

  const renderLoadingSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton className="w-full h-16 rounded-lg" />
        </Box>
      ))}
    </Box>
  )

  const renderEmptyState = (message: string, icon: React.ReactNode) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        textAlign: "center",
      }}
    >
      <Box sx={{ color: theme.primary, mb: 2 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {message}
      </Typography>
    </Box>
  )

  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <CardHeader
        title={
          <Typography variant="h5" fontWeight={600}>
            People
          </Typography>
        }
        sx={{
          borderBottom: "1px solid #e0e0e0",
          py: 2,
        }}
      />

      <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
        <CustomTabs value={tabValue} onChange={handleChange} tabs={tabs} variant="fullWidth" />
      </Box>

      <CardContent
        sx={{
          flex: 1,
          p: 0,
          overflowY: "auto",
          "&:last-child": { pb: 0 },
        }}
      >
        {/* Friend Requests Tab */}
        <TabPanel value={tabValue} index={0}>
          {requestsLoading ? (
            renderLoadingSkeleton()
          ) : Array.isArray(friendRequestList) && friendRequestList.length === 0 ? (
            renderEmptyState("No friend requests", <IoMailOpen size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {(Array.isArray(friendRequestList) ? friendRequestList : []).map((friend: any, index: number) => (
                <FriendRequestItem friend={friend} key={index} currentUserId={currentUser?.id} />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Friends List Tab */}
        <TabPanel value={tabValue} index={1}>
          {friendsLoading ? (
            renderLoadingSkeleton()
          ) : Array.isArray(friendList) && friendList.length === 0 ? (
            renderEmptyState("No friends yet", <IoPeopleSharp size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {(Array.isArray(friendList) ? friendList : []).map((friend: any, index: number) => (
                <FriendItem friend={friend} key={index} />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Find Friends Tab */}
        <TabPanel value={tabValue} index={2}>
          {usersLoading ? (
            renderLoadingSkeleton()
          ) : Array.isArray(nonFriendUsers) && nonFriendUsers.length === 0 ? (
            renderEmptyState("No users to add", <IoPersonAdd size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {(Array.isArray(nonFriendUsers) ? nonFriendUsers : []).map((user: any, index: number) => (
                <FindFriendsItem user={user} key={index} currentUserId={currentUser?.id} />
              ))}
            </Box>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default FriendList
