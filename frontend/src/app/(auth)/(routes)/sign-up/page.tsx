"use client"

import { useState, useEffect } from "react"
import { registerApi } from "@/services/auth"
import { registerSchema } from "@/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useThemeContext } from "@/context/ThemeContext"
import withAuth from "@/hocs/withAuth"
import { motion } from "framer-motion"
import PasswordRules from "@/components/PasswordRules"

// React Icons
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { BsQuestionCircle } from "react-icons/bs"
import { FiUserPlus } from "react-icons/fi"

// MUI Components
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme as useMuiTheme,
} from "@mui/material"
import MuiAlert from "@mui/material/Alert"

type RegisterFormInputs = {
  fullName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

function Page() {
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    watch,
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  })

  const router = useRouter()
  const { theme } = useThemeContext()
  const muiTheme = useMuiTheme()

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation state
  const [passwordState, setPasswordState] = useState({
    validLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasSpecialSymbol: false,
    hasNumber: false,
  })

  // Toast state
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "info" | "warning"
  }>({ open: false, message: "", severity: "info" })

  const showToast = (message: string, severity: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ open: true, message, severity })
  }

  const handleCloseToast = () => {
    setToast({ ...toast, open: false })
  }

  // Watch password for validation
  watch("password")
  const password = getValues("password")

  useEffect(() => {
    const validatePassword = () => {
      const passwordValidation = {
        validLength: password?.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password),
      }

      setPasswordState(passwordValidation)
    }

    validatePassword()
  }, [password])

  const onSubmit = async (data: RegisterFormInputs) => {
    showToast("Processing your registration...", "info")

    try {
      const res = await registerApi({
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        username: data.username,
        roles: ["ROLE_USER"],
      })

      if (res.status === 200) {
        showToast("Registration successful! Please log in to continue.", "success")

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/sign-in")
        }, 2000)
      } else {
        showToast("Registration failed. Please try again.", "error")
      }
    } catch (error) {
      showToast("An error occurred during registration. Please try again.", "error")
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: 2,
        py: 4,
      }}
    >
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Unlock Your Journey
          </Typography>

          <Typography variant="subtitle1" color="text.secondary">
            Register now to begin new adventure!
          </Typography>
        </Box>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                margin="normal"
                {...register("fullName")}
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                {...register("username")}
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                type="email"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={<PasswordRules passwordState={passwordState} />} placement="right" arrow>
                        <IconButton size="small" sx={{ mr: 1 }}>
                          <BsQuestionCircle size={16} />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                variant="outlined"
                margin="normal"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                startIcon={<FiUserPlus size={20} />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  mb: 2,
                  background: `linear-gradient(45deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.primary} 30%, ${theme.secondary} 90%)`,
                  },
                }}
              >
                Sign up
              </Button>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            Already have an account?{" "}
            <Typography
              component="span"
              sx={{
                color: theme.primary,
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => router.push("/sign-in")}
            >
              Log in
            </Typography>
          </Typography>
        </Box>
      </motion.div>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert elevation={6} variant="filled" severity={toast.severity} onClose={handleCloseToast}>
          {toast.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  )
}

export default withAuth(Page)
