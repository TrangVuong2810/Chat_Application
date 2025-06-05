"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from "@mui/material"
import type { ITheme } from "@/interfaces"
import { themes } from "@/theme"

interface ThemeContextType {
  theme: ITheme
  selectTheme: (theme: ITheme) => void
}

// Default theme fallback
const defaultTheme = themes.pastelBlue

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  selectTheme: () => {},
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [currentTheme, setCurrentTheme] = useState<ITheme>(defaultTheme)
  const [isClient, setIsClient] = useState(false)

  const selectTheme = (theme: ITheme) => {
    setCurrentTheme(theme)
    // Save theme preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredTheme", JSON.stringify(theme))
    }
  }

  // Load saved theme on mount
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("preferredTheme")
      if (savedTheme) {
        try {
          const parsedTheme = JSON.parse(savedTheme)
          // Validate that the parsed theme has required properties
          if (parsedTheme && parsedTheme.primary && parsedTheme.secondary) {
            setCurrentTheme(parsedTheme)
          }
        } catch (e) {
          console.error("Failed to parse saved theme", e)
          // Keep default theme if parsing fails
        }
      }
    }
  }, [])

  // Ensure theme has all required properties with fallbacks
  const safeTheme = {
    primary: currentTheme?.primary || defaultTheme.primary,
    secondary: currentTheme?.secondary || defaultTheme.secondary,
    background: currentTheme?.background || defaultTheme.background,
    backgroundSecondary: currentTheme?.backgroundSecondary || defaultTheme.backgroundSecondary,
    text: currentTheme?.text || defaultTheme.text,
    textSecondary: currentTheme?.textSecondary || defaultTheme.textSecondary,
    backgroundStyle: currentTheme?.backgroundStyle || defaultTheme.backgroundStyle,
    iconStyle: currentTheme?.iconStyle || defaultTheme.iconStyle,
  }

  // Create MUI theme
  const muiTheme = createTheme({
    palette: {
      primary: {
        main: safeTheme.primary,
      },
      secondary: {
        main: safeTheme.secondary,
      },
      background: {
        default: safeTheme.background,
        paper: safeTheme.backgroundSecondary || "#ffffff",
      },
      text: {
        primary: safeTheme.text || "#000000",
        secondary: safeTheme.textSecondary || "#666666",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: "10px 16px",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
          contained: {
            background: `linear-gradient(45deg, ${safeTheme.primary} 0%, ${safeTheme.secondary} 100%)`,
            color: "#ffffff",
            "&:hover": {
              background: `linear-gradient(45deg, ${safeTheme.primary} 30%, ${safeTheme.secondary} 90%)`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginBottom: "16px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: safeTheme.primary,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: safeTheme.primary,
              },
            },
          },
        },
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ theme: safeTheme, selectTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
