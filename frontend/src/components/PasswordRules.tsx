import type React from "react"
import { Box, Typography } from "@mui/material"
import { IoCheckmarkCircle } from "react-icons/io5"
import { MdRadioButtonUnchecked } from "react-icons/md"

interface PasswordRulesProps {
  passwordState: {
    validLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasSpecialSymbol: boolean
    hasNumber: boolean
  }
}

const PasswordRules: React.FC<PasswordRulesProps> = ({ passwordState }) => {
  const rules = [
    { key: "validLength", label: "At least 8 characters", valid: passwordState.validLength },
    { key: "hasUppercase", label: "One uppercase letter", valid: passwordState.hasUppercase },
    { key: "hasLowercase", label: "One lowercase letter", valid: passwordState.hasLowercase },
    { key: "hasNumber", label: "One number", valid: passwordState.hasNumber },
    { key: "hasSpecialSymbol", label: "One special character", valid: passwordState.hasSpecialSymbol },
  ]

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Password Requirements:
      </Typography>
      {rules.map((rule) => (
        <Box key={rule.key} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          {rule.valid ? (
            <IoCheckmarkCircle size={16} style={{ color: "#4caf50", marginRight: 8 }} />
          ) : (
            <MdRadioButtonUnchecked size={16} style={{ color: "#9e9e9e", marginRight: 8 }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: rule.valid ? "#4caf50" : "#9e9e9e",
              fontSize: "0.75rem",
            }}
          >
            {rule.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

export default PasswordRules