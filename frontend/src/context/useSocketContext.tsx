"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useStompClient } from "react-stomp-hooks";

export const SocketContext = createContext<any>({
    stompClient: null,
    onSendPrivateChat: null,
    isConnected: false,
    disconnect: null
});
SocketContext.displayName = "SocketContext";

export function useSocketContext() {
    return useContext(SocketContext);
}

interface SocketProviderProps {
    children: React.ReactNode;
}
export const SocketProvider = ({ children }: SocketProviderProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const stompClient = useStompClient();

    useEffect(() => {
        if (stompClient) {
            const checkConnection = () => {
                setIsConnected(stompClient.connected);
            };
            
            // Check connection status periodically
            const interval = setInterval(checkConnection, 1000);
            checkConnection(); // Initial check
            
            return () => clearInterval(interval);
        }
    }, [stompClient]);

    const onSendPrivateChat = (payload: any) => {
        if (stompClient && stompClient.connected) {
            console.log(">> Sending message:", payload);
            stompClient.publish({
                destination: "/app/private.chat",
                body: JSON.stringify(payload)
            });
        }
    };

    const disconnect = () => {
        if (stompClient && stompClient.connected) {
            console.log("Manually disconnecting STOMP client...");
            stompClient.deactivate();
        }
    };

    return (
        <SocketContext.Provider value={{ 
            stompClient, 
            onSendPrivateChat,
            isConnected: stompClient?.connected || false,
            disconnect
        }}>
            {children}
        </SocketContext.Provider>
    );
};