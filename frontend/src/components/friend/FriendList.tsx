"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
  const queryClient = useQueryClient()

  const { data: friendListData, isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ["friendList"],
    queryFn: () => fetchFriendListApi(currentUser?.id),
    enabled: !!currentUser?.id,
  })

  const { data: friendRequestListData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["friendRequestList"],
    queryFn: () => fetchFriendRequestListApi(currentUser?.id),
    enabled: !!currentUser?.id,
  })

  const { data: nonFriendUsersData, isLoading: usersLoading, refetch: refetchNonFriends } = useQuery({
    queryKey: ["nonFriendUsers"],
    queryFn: () => fetchNonFriendUsersApi(currentUser?.id, currentUser?.token),
    enabled: !!currentUser?.id,
  })

  // Data extraction
  const friendList = Array.isArray(friendListData?.data) ? friendListData.data : 
                    Array.isArray(friendListData) ? friendListData : []
  const friendRequestList = Array.isArray(friendRequestListData?.data) ? friendRequestListData.data : 
                           Array.isArray(friendRequestListData) ? friendRequestListData : []
  const nonFriendUsers = Array.isArray(nonFriendUsersData?.data) ? nonFriendUsersData.data : 
                        Array.isArray(nonFriendUsersData) ? nonFriendUsersData : []

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)

    switch (newValue) {
      case 0: // Friend Requests tab
        refetchRequests()
        break
      case 1: // Friends tab
        refetchFriends()
        break
      case 2: // Find Friends tab
        refetchNonFriends()
        break
    }
  }

  const tabs = [
    {
      label: `Requests`,
      icon: <IoMailOpen size={18} />,
    },
    {
      label: `Friends`,
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
          ) : friendRequestList.length === 0 ? (
            renderEmptyState("No friend requests", <IoMailOpen size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {friendRequestList.map((friend: any, index: number) => (
                <FriendRequestItem 
                  friend={friend} 
                  key={friend?.id || `friend-request-${index}`} 
                  currentUserId={currentUser?.id} 
                />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Friends List Tab */}
        <TabPanel value={tabValue} index={1}>
          {friendsLoading ? (
            renderLoadingSkeleton()
          ) : friendList.length === 0 ? (
            renderEmptyState("No friends yet", <IoPeopleSharp size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {friendList.map((friend: any, index: number) => (
                <FriendItem 
                  friend={friend} 
                  key={friend?.id || `friend-${index}`} 
                />
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Find Friends Tab */}
        <TabPanel value={tabValue} index={2}>
          {usersLoading ? (
            renderLoadingSkeleton()
          ) : nonFriendUsers.length === 0 ? (
            renderEmptyState("No users to add", <IoPersonAdd size={48} />)
          ) : (
            <Box sx={{ p: 2 }}>
              {nonFriendUsers.map((user: any, index: number) => (
                <FindFriendsItem 
                  user={user} 
                  key={user?.id || `user-${index}`} 
                  currentUserId={currentUser?.id} 
                />
              ))}
            </Box>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default FriendList
