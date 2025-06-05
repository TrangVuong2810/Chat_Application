"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAuthContext } from "@/context/useAuthContext"
import { fetchConversationByIdApi } from "@/services/conversation"
import { removeGroupMemberApi } from "@/services/conversation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useStompClient, useSubscription } from "react-stomp-hooks"
import { Avatar, Box, Card, Typography, IconButton, Chip, Paper, CircularProgress, Tooltip } from "@mui/material"
import { GoDotFill } from "react-icons/go"
import { IoInformationCircle, IoArrowDown } from "react-icons/io5"
import { MdGroup } from "react-icons/md"
import moment from "moment"

import Message from "./Message"
import { MessageInputField } from "../common/input"
import GroupActionsDropdown from "./GroupActionDropdown"
import GroupMembersDialog from "../group/GroupMembersDialog"
import { Skeleton } from "@/components/common/skeleton"
import { useThemeContext } from "@/context/ThemeContext"
import { getReceiver } from "@/utils"
import { UserState } from "@/constants"
import type { IMessageReq, IMessageResponse, IUser } from "@/interfaces"

const ChatBox = ({ conversationId }: { conversationId: string | null }) => {
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationByIdApi(conversationId!),
    enabled: !!conversationId,
  })

  const [localMessages, setLocalMessages] = useState<IMessageResponse[]>([])
  const [content, setContent] = useState("")
  const [onlineMembers, setOnlineMembers] = useState<IUser[]>([])
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [page, setPage] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageCount, setNewMessageCount] = useState(0)

  const queryClient = useQueryClient()
  const { currentUser } = useAuthContext()
  const { theme } = useThemeContext()
  const stompClient = useStompClient()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousScrollHeight = useRef<number>(0)

  const isStompConnected = stompClient?.connected || false

  const handleStatus = (status: string, lastOnline?: any) => {
    if (status === UserState.ONLINE) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <GoDotFill style={{ color: "#4caf50", fontSize: 12 }} />
          <Typography variant="caption" color="text.secondary">
            Active now
          </Typography>
        </Box>
      )
    } else {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <GoDotFill style={{ color: "#9e9e9e", fontSize: 12 }} />
          <Typography variant="caption" color="text.secondary">
            Active {moment(lastOnline).fromNow()}
          </Typography>
        </Box>
      )
    }
  }

  const myFriend: IUser = conversation?.participants
    ?.map((participant: any) => participant.user)
    ?.filter((user: IUser) => user.id !== currentUser.id)[0]

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      setNewMessageCount(0)
    }
  }

  // Check if user is at bottom of chat
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsAtBottom(isNearBottom)

    // Reset new message count when user scrolls to bottom
    if (isNearBottom && newMessageCount > 0) {
      setNewMessageCount(0)
    }
  }, [newMessageCount])

  // WebSocket subscriptions
  useSubscription("/user/" + currentUser.username + "/queue/messages", (message) => {
    console.log("SUBSCRIPTION TRIGGERED!!! Raw message:", message)

    try {
      if (typeof message.body === "string" && message.body.startsWith("TEST ECHO:")) {
        console.log("Received test echo:", message.body)
        return
      }

      const parsedMessage = JSON.parse(message.body)

      // Handle ONLINE_USERS updates
      if (parsedMessage.type === "ONLINE_USERS") {
        try {
          let onlineUserIds: string[] = []
          const usersData = parsedMessage.metadata.USERS

          if (Array.isArray(usersData)) {
            onlineUserIds = usersData
          } else if (typeof usersData === "string") {
            if (usersData === "[]") {
              onlineUserIds = []
            } else if (usersData.startsWith("[") && usersData.endsWith("]")) {
              const cleanedString = usersData.slice(1, -1)
              if (cleanedString.trim() !== "") {
                onlineUserIds = cleanedString.split(",").map((id: string) => id.trim())
              }
            } else {
              onlineUserIds = JSON.parse(usersData)
            }
          }

          if (conversation?.participants) {
            const mappedUsers = conversation.participants.map((participant: any) => {
              return participant.user || participant
            })

            const filteredUsers = mappedUsers.filter((user: IUser) => {
              return onlineUserIds.includes(user.id)
            })
            setOnlineMembers(filteredUsers)
          }
        } catch (error) {
          console.error("Error parsing online users:", error)
        }
        return
      }

      // Handle member join/leave notifications
      if (
        (parsedMessage.type === "MEMBER_JOINED" || parsedMessage.type === "MEMBER_LEFT") &&
        parsedMessage.conversationId === conversationId
      ) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })
        return
      }

      // Handle chat messages
      if (parsedMessage.conversationId === conversationId && parsedMessage.content) {
        setLocalMessages((prev) => {
          const exists = prev.find(
            (msg) =>
              msg.id === parsedMessage.id ||
              (msg.id.startsWith("temp-") &&
                msg.content === parsedMessage.content &&
                Math.abs(new Date(msg.dateSent).getTime() - new Date(parsedMessage.dateSent).getTime()) < 5000),
          )
          if (!exists) {
            // If user is not at bottom, increment new message count
            if (!isAtBottom && parsedMessage.sender.id !== currentUser.id) {
              setNewMessageCount((prev) => prev + 1)
            }
            return [...prev, parsedMessage]
          }
          return prev.map((msg) =>
            msg.id.startsWith("temp-") &&
            msg.content === parsedMessage.content &&
            Math.abs(new Date(msg.dateSent).getTime() - new Date(parsedMessage.dateSent).getTime()) < 5000
              ? parsedMessage
              : msg,
          )
        })
      }

      queryClient.invalidateQueries({ queryKey: ["conversation"] })
      queryClient.invalidateQueries({ queryKey: ["messageList"] })
    } catch (error) {
      console.error("Error parsing message:", error)
    }
  })

  useSubscription("/user/" + currentUser.username + "/private-messages", (message) => {
    try {
      const parsedMessage = JSON.parse(message.body)
      console.log("Parsed private message:", parsedMessage) 

      if (parsedMessage.conversationId === conversationId && parsedMessage.content) {
        setLocalMessages((prev) => {
          const exists = prev.find(
            (msg) =>
              msg.id === parsedMessage.id ||
              (msg.id.startsWith("temp-") &&
                msg.content === parsedMessage.content &&
                Math.abs(new Date(msg.dateSent).getTime() - new Date(parsedMessage.dateSent).getTime()) < 5000),
          )
          
          if (!exists) {
            // If user is not at bottom, increment new message count
            if (!isAtBottom && parsedMessage.sender.id !== currentUser.id) {
              setNewMessageCount((prev) => prev + 1)
            }
            return [...prev, parsedMessage]
          }

          const updatedMessages = prev.map((msg) =>
            msg.id.startsWith("temp-") &&
            ((msg.content && msg.content === parsedMessage.content) || 
            (msg.image && msg.image === parsedMessage.image)) &&
            Math.abs(new Date(msg.dateSent).getTime() - new Date(parsedMessage.dateSent).getTime()) < 5000
              ? parsedMessage
              : msg,
          )
              
          return updatedMessages
        })
        
        // Also invalidate queries to update message list
        queryClient.invalidateQueries({ queryKey: ["messageList"] })
      }
    } catch (error) {
      console.error("Error parsing private message:", error)
    }
  })

  const onMessageSent = () => {
    if (stompClient && content.trim() !== "" && isStompConnected) {
      const tempId = `temp-${Date.now()}`
      const newMessage: IMessageResponse = {
        id: tempId,
        sender: currentUser,
        conversationId: conversationId!,
        dateSent: new Date().toISOString(),
        dateDelivered: null,
        dateRead: null,
        states: [],
        content: content,
      }

      console.log(newMessage)

      setLocalMessages((prev) => [...prev, newMessage])

      const destination = conversation?.groupConversation ? "/app/group.chat" : "/app/private.chat"

      stompClient.publish({
        destination,
        body: JSON.stringify({
          content,
          conversationId,
          username: currentUser.username,
        } as IMessageReq),
      })

      setContent("")

      // Auto scroll to bottom when user sends a message
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } else if (!isStompConnected) {
      console.error("WebSocket is not connected. Cannot send message.")
      alert("WebSocket connection is not established. Please try again later.")
    }
  }

  useEffect(() => {
    if (conversation?.messages) {
      setLocalMessages(conversation.messages)
      setNewMessageCount(0)
      // Scroll to bottom when conversation loads
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [conversation?.messages])

  // Auto scroll to bottom for new messages when user is at bottom
  useEffect(() => {
    if (isAtBottom && localMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [localMessages.length, isAtBottom])

  const handleLeaveGroup = async () => {
    try {
      await removeGroupMemberApi(conversationId!, currentUser.id)
      window.location.href = "/u"
    } catch (error) {
      console.error("Failed to leave group:", error)
      alert("Failed to leave group. Please try again.")
    }
  }

  const handleMembersUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })
    queryClient.invalidateQueries({ queryKey: ["messageList"] })
  }

  useEffect(() => {
    if (conversation?.id && conversation.groupConversation && stompClient && isStompConnected) {
      const subscription = stompClient.subscribe(`/topic/chat/${conversationId}`, () => {
        console.log("Connected to group conversation:", conversationId)
      })

      stompClient.publish({
        destination: "/app/request-online-users",
        body: conversationId!,
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [conversation?.id, stompClient, isStompConnected, conversationId])

  useEffect(() => {
    if (conversationId && stompClient && isStompConnected) {
      stompClient.publish({
        destination: "/app/join.conversation",
        body: conversationId,
      })
    }
  }, [conversationId, stompClient, isStompConnected])

  const renderChatHeader = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
          <Skeleton className="w-12 h-12 rounded-full" />
          <Box>
            <Skeleton className="w-32 h-4 mb-2" />
            <Skeleton className="w-24 h-3" />
          </Box>
        </Box>
      )
    }

    if (conversation?.groupConversation) {
      return (
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.secondary}15 100%)`,
            borderBottom: `1px solid ${theme.primary}30`,
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: theme.primary,
                  width: 48,
                  height: 48,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <MdGroup size={24} />
              </Avatar>

              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: theme.primary, mb: 0.5 }}>
                  {conversation.groupName}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5}}>
                  <Chip
                    label={`${conversation.participants.length} members`}
                    size="small"
                    onClick={() => setShowMembersDialog(true)}
                    sx={{
                      bgcolor: theme.primary,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: theme.secondary,
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  />

                  {onlineMembers.length > 0 && (
                    <Tooltip
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Online Members:
                          </Typography>
                          {onlineMembers.slice(0, 5).map((member, index) => (
                            <Box key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              <Avatar src={member.profilePicture} sx={{ width: 20, height: 20 }}>
                                {member.fullName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 500, display: "block" }}>
                                  {member.fullName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
                                >
                                  @{member.username}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                          {onlineMembers.length > 5 && (
                            <Typography variant="caption" sx={{ fontStyle: "italic", mt: 0.5, display: "block" }}>
                              +{onlineMembers.length - 5} more online
                            </Typography>
                          )}
                        </Box>
                      }
                      placement="bottom"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: "rgba(0,0,0,0.9)",
                            color: "white",
                            borderRadius: 2,
                            maxWidth: 280,
                            "& .MuiTooltip-arrow": {
                              color: "rgba(0,0,0,0.9)",
                            },
                          },
                        },
                      }}
                    >
                    <Chip
                      label={`${onlineMembers.length} online`}
                      size="small"
                      sx={{
                        bgcolor: "#4caf50",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        height: 24, // Fixed height
                        cursor: "pointer",
                          "&:hover": {
                            bgcolor: "#45a049",
                            transform: "scale(1.05)",
                          },
                          transition: "all 0.2s ease",
                      }}
                    />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>

            <GroupActionsDropdown
              conversation={conversation}
              onLeaveGroup={handleLeaveGroup}
              onMembersUpdated={handleMembersUpdated}
            />
          </Box>
        </Paper>
      )
    } else {
      return (
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.primary}08 0%, ${theme.secondary}08 100%)`,
            borderBottom: "1px solid #e0e0e0",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={myFriend?.profilePicture}
              sx={{
                width: 48,
                height: 48,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {myFriend?.fullName?.[0]}
            </Avatar>

            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: theme.primary, mb: 0.5 }}>
                {myFriend?.fullName}
              </Typography>
              {handleStatus(myFriend?.userState, myFriend?.lastOnline)}
            </Box>
          </Box>
        </Paper>
      )
    }
  }

  if (!conversationId) {
    return (
      <Card
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.backgroundSecondary} 100%)`,
        }}
      >
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a conversation to start chatting
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose from your conversations or create a new group
          </Typography>
        </Box>
      </Card>
    )
  }

  return (
    <>
      <Card
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fixed Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: "background.paper",
          }}
        >
          {renderChatHeader()}
        </Box>

        {/* Scrollable Messages Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            ref={chatContainerRef}
            onScroll={handleScroll}
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              scrollBehavior: "smooth",
              // Custom scrollbar styling
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: theme.primary + "40",
                borderRadius: "3px",
                "&:hover": {
                  background: theme.primary + "60",
                },
              },
            }}
          >

            {localMessages.map((message: IMessageResponse, index: number) => (
              <Message
                key={message.id || index}
                message={message}
                options={{
                  currentUserId: currentUser.id,
                  senderExceptCurrentUser: getReceiver(conversation?.participants || [], currentUser),
                  messageList: localMessages,
                  messageKey: index,
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Scroll to bottom button */}
          {!isAtBottom && (
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                right: 20,
                zIndex: 1000,
              }}
            >
              <IconButton
                onClick={scrollToBottom}
                sx={{
                  background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  width: 48,
                  height: 48,
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <IoArrowDown size={20} />
                {newMessageCount > 0 && (
                  <Chip
                    label={newMessageCount > 99 ? "99+" : newMessageCount}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "#f44336",
                      color: "white",
                      minWidth: 20,
                      height: 20,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  />
                )}
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Fixed Input Area */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            backgroundColor: "background.paper",
            borderTop: "1px solid #e0e0e0",
            p: 2,
          }}
        >
          <MessageInputField
            value={content}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContent(event.target.value)}
            onClickSend={onMessageSent}
            placeholder="Type a message..."
          />
        </Box>
      </Card>

      {/* Group Members Dialog */}
      {conversation?.groupConversation && (
        <GroupMembersDialog
          open={showMembersDialog}
          onClose={() => setShowMembersDialog(false)}
          conversation={conversation}
          onlineMembers={onlineMembers}
        />
      )}
    </>
  )
}

export default ChatBox
