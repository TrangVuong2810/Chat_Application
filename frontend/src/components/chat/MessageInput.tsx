"use client"

import type React from "react"
import { Box, IconButton, TextField, InputAdornment } from "@mui/material"
import { IoAttach, IoSend, IoHappy } from "react-icons/io5"
import { useThemeContext } from "@/context/ThemeContext"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
}

const MessageInput = ({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
}: MessageInputProps) => {
  const { theme } = useThemeContext()

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  const handleFileUpload = () => {
    // TODO: Implement file upload functionality
    console.log("File upload clicked")
  }

  const handleEmojiClick = () => {
    // TODO: Implement emoji picker
    console.log("Emoji picker clicked")
  }

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 2 }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: "background.paper",
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.primary,
                borderWidth: "2px",
              },
            },
          },
        }}
        InputProps={{
          // startAdornment: (
          //   <InputAdornment position="start">
          //     <IconButton size="small" onClick={handleFileUpload} disabled={disabled}>
          //       <IoAttach size={20} style={{ color: theme.primary }} />
          //     </IconButton>
          //   </InputAdornment>
          // ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleEmojiClick} disabled={disabled} sx={{ mr: 1 }}>
                <IoHappy size={20} style={{ color: theme.primary }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <IconButton
        onClick={onSend}
        disabled={!value.trim() || disabled}
        sx={{
          background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          color: "white",
          width: 48,
          height: 48,
          "&:hover": {
            background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
          },
          "&:disabled": {
            background: "#e0e0e0",
            color: "#9e9e9e",
          },
        }}
      >
        <IoSend size={20} />
      </IconButton>
    </Box>
  )
}

export default MessageInput

