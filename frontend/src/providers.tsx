"use client";

import { AuthProvider } from "@/context/useAuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SocketProvider } from "./context/useSocketContext";
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import React, { useEffect, useState } from "react";
import { CookiesProvider } from "react-cookie";
import {
  StompSessionProvider
} from "react-stomp-hooks";

const SOCKET_URL = "http://localhost:8080/ws";

export function Providers({ children }: any) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("accessToken");
    setToken(storedToken);
  }, []);

  // Listen for token changes
  useEffect(() => {
    if (isClient) {
      const handleStorageChange = () => {
        const storedToken = localStorage.getItem("accessToken");
        setToken(storedToken);
      };

      // Listen for storage changes
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for token changes within the same tab
      const interval = setInterval(handleStorageChange, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [isClient]);

  const isAuthenticated = Boolean(token) && isClient;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CookiesProvider>
          <AuthProvider>
            {isAuthenticated && (
              <StompSessionProvider
                url={SOCKET_URL}
                connectHeaders={{
                  Authorization: `Bearer ${token}`,
                  ...(typeof process.env.NEXT_PUBLIC_API_KEY === "string"
                    ? { "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string }
                    : {}),
                }}
                debug={(str) => {
                  console.log("STOMP Debug:", str);
                }}
              >
                <SocketProvider>
                  {children}
                </SocketProvider>
              </StompSessionProvider>
            )}
            {!isAuthenticated && children}
          </AuthProvider>
        </CookiesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}