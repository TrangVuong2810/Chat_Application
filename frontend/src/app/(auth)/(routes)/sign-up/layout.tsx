import type React from "react"
import type { Metadata } from "next"
import { Providers } from "@/providers"

export const metadata: Metadata = {
  title: "Register | Chat Application",
  description: "Take it easy to hang out with friends",
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}
