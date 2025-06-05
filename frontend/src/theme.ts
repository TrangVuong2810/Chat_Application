import type { ITheme } from "@/interfaces"

export const themes = {
  // Define themes with primary, secondary, background, text, and icon styles
  pastelBlue: {
    primary: "#a8dadc",
    secondary: "#457b9d",
    background: "#f1faee",
    backgroundSecondary: "#ffffff",
    text: "#1d3557",
    textSecondary: "#457b9d",
    backgroundStyle: {
      background: "linear-gradient(45deg, #a8dadc 0%, #457b9d 100%)",
    },
    iconStyle: {
      color: "#a8dadc",
    },
  } as ITheme,

  oceanBreeze: {
    primary: "#81c3d7",
    secondary: "#4a90a4",
    background: "#f7fcff",
    backgroundSecondary: "#ffffff",
    text: "#2c5f7a",
    textSecondary: "#4a90a4",
    backgroundStyle: {
      background: "linear-gradient(45deg, #81c3d7 0%, #4a90a4 100%)",
    },
    iconStyle: {
      color: "#81c3d7",
    },
  } as ITheme,
}

// Export default theme
export const defaultTheme = themes.pastelBlue
