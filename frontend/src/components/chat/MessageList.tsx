"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useStompClient, useSubscription } from "react-stomp-hooks"
import { Box, Typography, IconButton, Card, CardHeader, CardContent } from "@mui/material"
import { IoAdd } from "react-icons/io5"
import { MdGroup } from "react-icons/md"
import InboxItem from "./InboxItem"
import CreateGroupDialog from "./CreateGroupDialog"
import { fetchConversationsByUserIdApi, createGroupConversationApi } from "@/services/conversation"
import { Skeleton } from "@/components/common/skeleton"
import { useThemeContext } from "@/context/ThemeContext"
import type { IConversationResponse, IUser } from "@/interfaces"

function MessageList({ currentUser }: { currentUser: IUser }) {
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { theme } = useThemeContext()
  const queryClient = useQueryClient()
  const stompClient = useStompClient()

  const {
    data: conversations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["messageList"],
    queryFn: () => fetchConversationsByUserIdApi(currentUser.id),
    enabled: !!currentUser.id,
  })

  useSubscription(`/user/${currentUser.username}/queue/messages`, (message) => {
    try {
      const parsedMessage = JSON.parse(message.body)
      
      // Handle new chat messages
      if (parsedMessage.content && parsedMessage.conversationId) {
        // Invalidate and refetch conversations
        queryClient.invalidateQueries({ queryKey: ["messageList"] })
      }
      
      // Handle member join/leave notifications
      if (parsedMessage.type === "MEMBER_JOINED" || parsedMessage.type === "MEMBER_LEFT") {
        queryClient.invalidateQueries({ queryKey: ["messageList"] })
      }
    } catch (error) {
      console.error("Error parsing message in MessageList:", error)
    }
  })

  useSubscription(`/user/${currentUser.username}/private-messages`, (message) => {
    try {
      const parsedMessage = JSON.parse(message.body)
      
      if (parsedMessage.content && parsedMessage.conversationId) {
        // Update the message list
        queryClient.invalidateQueries({ queryKey: ["messageList"] })
      }
    } catch (error) {
      console.error("Error parsing private message in MessageList:", error)
    }
  })

  const handleCreateGroup = async (participants: string[], groupName: string) => {
    try {
      await createGroupConversationApi(participants, groupName)
      refetch()
    } catch (error) {
      console.error("Failed to create group:", error)
    }
  }

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
            Chats
          </Typography>
        }
        action={
          <IconButton
            onClick={() => setShowCreateGroup(true)}
            sx={{
              background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
              color: "white",
              width: 36,
              height: 36,
              "&:hover": {
                background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
              },
            }}
          >
            <MdGroup size={18} />
          </IconButton>
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
          <Box sx={{ p: 2 }}>
            {[...Array(8)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Skeleton className="w-full h-16 rounded-lg" />
              </Box>
            ))}
          </Box>
        ) : conversations && conversations.length > 0 ? (
          conversations.map((conversation: IConversationResponse, index: number) => (
            <InboxItem key={index} conversation={conversation} currentUserId={currentUser?.id} />
          ))
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start a new conversation or create a group chat
            </Typography>
            <IconButton
              onClick={() => setShowCreateGroup(true)}
              sx={{
                background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                color: "white",
                width: 56,
                height: 56,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                },
              }}
            >
              <IoAdd size={24} />
            </IconButton>
          </Box>
        )}
      </CardContent>

      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
    </Card>
  )
}

export default MessageList

