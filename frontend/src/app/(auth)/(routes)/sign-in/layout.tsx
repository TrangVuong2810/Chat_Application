import type React from "react"
import type { Metadata } from "next"
import { Providers } from "@/providers"

export const metadata: Metadata = {
  title: "Login | Chat Application",
  description: "Login to your account to start chatting with friends and family.",
}

function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}

export default LoginLayout
