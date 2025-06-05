"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useStompClient } from "react-stomp-hooks";

export const SocketContext = createContext<any>({
    connect: null, disconnect: null
});
SocketContext.displayName = "SocketContext";

export function useSocketContext() {
    return useContext(SocketContext);
}

interface SocketProviderProps {
    children: React.ReactNode;
}
export const SocketProvider = ({ children }: SocketProviderProps) => {

    const stompClient = useStompClient();

    const onSendPrivateChat = (payload: any) => {
        if (stompClient && stompClient.connected) {
            console.log(">> Sending message:", payload);
            stompClient.publish({
                destination: "/app/private.chat",
                body: JSON.stringify(payload)
            });
        }
    };

    return (
        <SocketContext.Provider value={{ 
            stompClient, 
            onSendPrivateChat,
            isConnected: stompClient?.connected || false
        }}>
            {children}
        </SocketContext.Provider>
    );
};