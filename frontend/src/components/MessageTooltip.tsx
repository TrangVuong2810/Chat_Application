import type React from "react"
import { Tooltip, Box } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"

type TooltipProps = {
  children: React.ReactNode
  content: string
  placement?: "top" | "bottom" | "left" | "right"
}

const MessageTooltip = ({ children, content, placement = "top" }: TooltipProps) => {
  const { theme } = useThemeContext()

  return (
    <Tooltip
      title={content}
      arrow
      placement={placement}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: theme.primary,
            color: "white",
            fontSize: "0.75rem",
            borderRadius: 1,
            "& .MuiTooltip-arrow": {
              color: theme.primary,
            },
          },
        },
      }}
    >
      <Box
        sx={{
          display: "inline-block",
          maxWidth: 200,
          cursor: "pointer",
        }}
      >
        {children}
      </Box>
    </Tooltip>
  )
}

export default MessageTooltip

