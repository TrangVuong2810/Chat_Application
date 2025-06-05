import { Box, CircularProgress } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"

interface LoadingProps {
  size?: number
  color?: string
  fullScreen?: boolean
}

function Loading({ size = 40, color, fullScreen = false }: LoadingProps) {
  const { theme } = useThemeContext()

  const loadingColor = color || theme.primary

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
        }}
      >
        <CircularProgress size={size} sx={{ color: loadingColor }} />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <CircularProgress size={size} sx={{ color: loadingColor }} />
    </Box>
  )
}

export default Loading
