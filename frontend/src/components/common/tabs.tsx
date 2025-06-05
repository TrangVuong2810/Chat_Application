"use client"

import type React from "react"

import { Tabs as MuiTabs, Tab as MuiTab, Box, styled } from "@mui/material"
import { useThemeContext } from "@/context/ThemeContext"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

export function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mui-tabpanel-${index}`}
      aria-labelledby={`mui-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

// Styled components for custom tabs
const StyledTabs = styled(MuiTabs)(({ theme }) => ({
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: 3,
  },
}))

const StyledTab = styled(MuiTab)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
  marginRight: theme.spacing(1),
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
}))

interface CustomTabsProps {
  value: number
  onChange: (event: React.SyntheticEvent, newValue: number) => void
  tabs: { label: string; icon?: React.ReactNode }[]
  variant?: "standard" | "scrollable" | "fullWidth"
  centered?: boolean
}

export function CustomTabs({ value, onChange, tabs, variant = "standard", centered = false }: CustomTabsProps) {
  const { theme } = useThemeContext()

  return (
    <StyledTabs
      value={value}
      onChange={onChange}
      variant={variant}
      centered={centered}
      sx={{
        "& .MuiTabs-indicator": {
          backgroundColor: theme.primary,
        },
      }}
    >
      {tabs.map((tab, index) => (
        <StyledTab
          key={index}
          label={tab.label}
          icon={
            typeof tab.icon === "string" || (tab.icon && typeof tab.icon === "object" && "type" in tab.icon)
              ? tab.icon
              : undefined
          }
          iconPosition="start"
        />
      ))}
    </StyledTabs>
  )
}

