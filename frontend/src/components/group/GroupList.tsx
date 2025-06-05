"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Button,
  Typography,
  Chip,
  Box,
  CircularProgress,
  AvatarGroup,
} from "@mui/material"
import { MdGroup } from "react-icons/md"
import { IoEnter, IoChatbubbles } from "react-icons/io5"
import { fetchAllGroupConversationsApi, joinGroupConversationApi } from "@/services/conversation"
import { useAuthContext } from "@/context/useAuthContext"
import { Skeleton } from "@/components/common/skeleton"
import { useThemeContext } from "@/context/ThemeContext"
import type { IUser } from "@/interfaces"

interface GroupConversation {
  id: string
  groupName?: string
  participants: Array<{
    user: IUser
    isSystemUser: boolean
    joinedAt: string
  }>
  messages: any[]
  dateStarted: string
  dateUpdate: string
  groupConversation: boolean
}

const GroupsList = () => {
  const { currentUser } = useAuthContext()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { theme } = useThemeContext()
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)

  const { data: groups, isLoading } = useQuery({
    queryKey: ["allGroupConversations"],
    queryFn: fetchAllGroupConversationsApi,
  })

  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => joinGroupConversationApi(groupId),
    onSuccess: (data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["allGroupConversations"] })
      queryClient.invalidateQueries({ queryKey: ["messageList"] })
      router.push(`/u/${groupId}`)
    },
    onError: (error) => {
      console.error("Failed to join group:", error)
      alert("Failed to join group. Please try again.")
    },
  })

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId)
  }

  const handleGroupClick = (groupId: string) => {
    const group = groups?.find((g: GroupConversation) => g.id === groupId)
    const isMember: boolean = group?.participants?.some((p: { user: IUser; isSystemUser: boolean; joinedAt: string }) => p.user.id === currentUser.id)

    if (isMember) {
      router.push(`/u/${groupId}`)
    }
  }

  const isUserMember = (group: GroupConversation) => {
    return group.participants?.some((p) => p.user.id === currentUser.id)
  }

  const getGroupName = (group: GroupConversation) => {
    return group.groupName || `Group Chat (${group.participants?.length || 0} members)`
  }

  const renderLoadingSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(6)].map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Skeleton className="w-full h-20 rounded-lg" />
        </Box>
      ))}
    </Box>
  )

  const renderEmptyState = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        textAlign: "center",
      }}
    >
      <Box sx={{ color: theme.primary, mb: 2 }}>
        <MdGroup size={64} />
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No public groups available
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Groups will appear here when they are created.
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MdGroup size={24} style={{ color: theme.primary }} />
            <Typography variant="h5" fontWeight={600}>
              Public Groups
            </Typography>
          </Box>
        }
        action={
          <Chip
            label={`${groups?.length || 0} groups`}
            size="small"
            sx={{
              bgcolor: `${theme.primary}15`,
              color: theme.primary,
              fontWeight: 600,
            }}
          />
        }
        sx={{
          borderBottom: "1px solid #e0e0e0",
          py: 2,
        }}
      />

      <CardContent
        sx={{
          flex: 1,
          p: 0,
          overflowY: "auto",
          "&:last-child": { pb: 0 },
        }}
      >
        {isLoading ? (
          renderLoadingSkeleton()
        ) : !groups || groups.length === 0 ? (
          renderEmptyState()
        ) : (
          <Box sx={{ p: 2 }}>
            {groups.map((group: GroupConversation) => {
              const isMember = isUserMember(group)
              const isHovered = hoveredGroup === group.id

              return (
                <Card
                  key={group.id}
                  sx={{
                    mb: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    bgcolor: isMember ? `${theme.primary}08` : "background.paper",
                    border: isMember ? `1px solid ${theme.primary}30` : "1px solid #e0e0e0",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.primary,
                            width: 56,
                            height: 56,
                          }}
                        >
                          <MdGroup size={28} />
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight={600} noWrap>
                              {getGroupName(group)}
                            </Typography>
                            {isMember && (
                              <Chip
                                label="Member"
                                size="small"
                                sx={{
                                  bgcolor: theme.primary,
                                  color: "white",
                                  fontWeight: 500,
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {group.participants?.length || 0} members
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {group.messages?.length || 0} messages
                            </Typography>
                          </Box>

                          {/* Member Avatars */}
                          <AvatarGroup max={5} sx={{ justifyContent: "flex-start" }}>
                            {group.participants?.map((participant) => (
                              <Avatar
                                key={participant.user.id}
                                src={participant.user.profilePicture}
                                sx={{ width: 24, height: 24 }}
                              >
                                {participant.user.fullName?.[0]}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </Box>
                      </Box>

                      {/* Action Button */}
                      <Box sx={{ ml: 2 }}>
                        {isMember ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<IoChatbubbles size={16} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/u/${group.id}`)
                            }}
                            sx={{
                              borderColor: theme.primary,
                              color: theme.primary,
                              "&:hover": {
                                borderColor: theme.primary,
                                bgcolor: `${theme.primary}10`,
                              },
                            }}
                          >
                            Open Chat
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            disabled={joinGroupMutation.isPending}
                            startIcon={
                              joinGroupMutation.isPending ? <CircularProgress size={16} /> : <IoEnter size={16} />
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                              handleJoinGroup(group.id)
                            }}
                            sx={{
                              background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                              "&:hover": {
                                background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                              },
                            }}
                          >
                            {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupsList
