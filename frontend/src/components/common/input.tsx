"use client"

import type React from "react"
import { useState } from "react"
import { InputAdornment, IconButton, TextField, type TextFieldProps, useTheme } from "@mui/material"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { IoSend, IoAttach } from "react-icons/io5"
import { useThemeContext } from "@/context/ThemeContext"

interface CustomInputProps extends Omit<TextFieldProps, "onChange"> {
  label?: string
  type?: string
  name?: string
  register?: any
  width?: string | number
  className?: string
}

const CustomInput = ({ label, type = "text", name, register, width, className, ...rest }: CustomInputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type
  const theme = useTheme()

  return (
    <TextField
      label={label}
      type={inputType}
      {...(register ? register(name) : {})}
      variant="outlined"
      className={className}
      fullWidth
      sx={{
        width,
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
        },
      }}
      InputProps={{
        endAdornment: isPassword && (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
              aria-label={showPassword ? "hide password" : "show password"}
            >
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  )
}

export default CustomInput

interface MessageInputFieldProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClickSend: () => void
  placeholder?: string
}

export const MessageInputField = ({
  value,
  onChange,
  onClickSend,
  placeholder = "Type something...",
}: MessageInputFieldProps) => {
  const { theme } = useThemeContext()
  const muiTheme = useTheme()

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      variant="outlined"
      value={value}
      onChange={onChange}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "24px",
          backgroundColor: muiTheme.palette.background.paper,
          "&.Mui-focused": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.primary,
              borderWidth: "2px",
            },
          },
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconButton color="primary" aria-label="attach file">
              <IoAttach size={20} />
            </IconButton>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={onClickSend}
              color="primary"
              aria-label="send message"
              sx={{
                background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                color: "white",
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                },
              }}
            >
              <IoSend size={18} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
