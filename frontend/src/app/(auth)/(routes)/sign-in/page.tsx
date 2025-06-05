"use client"

import { useState } from "react"
import { loginApi } from "@/services/auth"
import { loginSchema } from "@/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useCookies } from "react-cookie"
import { useRouter } from "next/navigation"
import { useThemeContext } from "@/context/ThemeContext"
import withAuth from "@/hocs/withAuth"
import { motion } from "framer-motion"

// React Icons
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { BiLogIn } from "react-icons/bi"

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
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from "@mui/material"
import MuiAlert from "@mui/material/Alert"

type LoginFormInputs = {
  credential: string
  password: string
}

function Page() {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  })

  const { push } = useRouter()
  const [cookie, setCookie] = useCookies(["currentUser"])
  const { theme } = useThemeContext()
  const muiTheme = useMuiTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"))

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const handleClickShowPassword = () => setShowPassword(!showPassword)

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

  const onSubmit = async (data: LoginFormInputs) => {
    showToast("Processing your login request...", "info")

    try {
      const res = await loginApi({
        credential: data.credential,
        password: data.password,
      })

      if (res.status === 201 || res.status === 200) {
        showToast("Login successful! Welcome to Chat application!", "success")

        if ("data" in res && res.data) {
          localStorage.setItem("accessToken", res.data.accessToken)
          setCookie("currentUser", JSON.stringify(res.data.user), {
            path: "/",
            maxAge: 3600 * 24, // Expires after 24hr
            sameSite: true,
          })
        }

        setTimeout(() => {
          push("/u")
        }, 1000)
      } else {
        showToast("Login failed. Please check your credentials.", "error")
      }
    } catch (error) {
      showToast("An error occurred during login. Please try again.", "error")
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        p: 2,
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
            Chat Application
          </Typography>

          <Typography variant="subtitle1" color="text.secondary">
            Log in to continue
          </Typography>
        </Box>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                {...register("credential")}
                error={!!errors.credential}
                helperText={errors.credential?.message}
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
                      <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword} edge="end">
                        {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
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
                startIcon={<BiLogIn size={20} />}
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
                Log in
              </Button>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            Don't have an account yet?{" "}
            <Typography
              component="span"
              sx={{
                color: theme.primary,
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => push("/sign-up")}
            >
              Register
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
