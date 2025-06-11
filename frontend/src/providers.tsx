"use client";

import { AuthProvider } from "@/context/useAuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SocketProvider } from "./context/useSocketContext";
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { CookiesProvider } from "react-cookie";
import {
  StompSessionProvider
} from "react-stomp-hooks";

const SOCKET_URL = "http://localhost:8080/ws";

export function Providers({ children }: any) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("accessToken");
    setToken(storedToken);
    setIsInitialized(true);
  }, []);

  const handleStorageChange = useCallback(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken !== token) {
      setToken(storedToken);
    }
  }, [token]);

  useEffect(() => {
    if (isClient && isInitialized) {
      // Listen for storage changes
      window.addEventListener('storage', handleStorageChange);
      
      // Reduce polling frequency to prevent unnecessary re-renders
      const interval = setInterval(handleStorageChange, 15000); // Increased to 10 seconds

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [isClient, isInitialized, handleStorageChange]);

  const isAuthenticated = Boolean(token) && isClient && isInitialized;
  
  // Memoize the connect headers to prevent unnecessary reconnections
  const connectHeaders = useMemo(() => {
    if (!isAuthenticated || !token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
      ...(typeof process.env.NEXT_PUBLIC_API_KEY === "string"
        ? { "x-api-key": process.env.NEXT_PUBLIC_API_KEY as string }
        : {}),
    };
  }, [token, isAuthenticated]);

  // Memoize all callback functions to prevent unnecessary re-renders
  const debugCallback = useCallback((str: string) => {
    if (process.env.NODE_ENV === 'development' && !str.includes('heart-beat')) {
      console.log("STOMP Debug:", str);
    }
  }, []);

  const beforeConnectCallback = useCallback(() => {
    console.log("STOMP: Attempting to connect...");
  }, []);

  const onConnectCallback = useCallback(() => {
    console.log("STOMP: Successfully connected");
  }, []);

  const onDisconnectCallback = useCallback(() => {
    console.log("STOMP: Disconnected");
  }, []);

  const onStompErrorCallback = useCallback((frame: any) => {
    if (isAuthenticated) {
      console.error("STOMP Error:", frame);
    }
  }, [isAuthenticated]);

  const onWebSocketErrorCallback = useCallback((error: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error("WebSocket Error:", error);
    }
  }, []);

  const onWebSocketCloseCallback = useCallback((event: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("WebSocket Closed - Code:", event.code, "Reason:", event.reason);
    }
  }, []);

  if (!isInitialized) {
    return null; // Or a global loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CookiesProvider>
          <AuthProvider>
            <StompSessionProvider
              url={SOCKET_URL}
              connectHeaders={isAuthenticated ? connectHeaders : {}}
              debug={debugCallback}
              reconnectDelay={5000}
              heartbeatIncoming={4000}
              heartbeatOutgoing={4000}
              connectionTimeout={15000}
              beforeConnect={beforeConnectCallback}
              onConnect={onConnectCallback}
              onDisconnect={onDisconnectCallback}
              onStompError={onStompErrorCallback}
              onWebSocketError={onWebSocketErrorCallback}
              onWebSocketClose={onWebSocketCloseCallback}
            >
              <SocketProvider>
                {children}
              </SocketProvider>
            </StompSessionProvider>
          </AuthProvider>
        </CookiesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}