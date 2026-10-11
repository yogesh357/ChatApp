'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { UserInfo } from "../context/authProvider";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface ChatMessage {
    id: string;
    content: string;
    roomId: string;
    username: string;
    timestamp: number;
    isSystem: boolean;
    isSelf: boolean;
}

export function useChatSocket(
    roomId: string | null,
    user: UserInfo | null
) {
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Clear messages when roomId changes
    useEffect(() => {
        setMessages([]);
    }, [roomId]);

    useEffect(() => {
        if (!roomId || !user?.id || !user?.username) {
            setStatus("idle");
            return;
        }

        const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
        const clientConnId = `${user.id}_${Math.random().toString(36).substring(2, 8)}`;
        const wsUrl = `${wsBase}/ws/joinRoom/${encodeURIComponent(roomId)}?userId=${encodeURIComponent(clientConnId)}&username=${encodeURIComponent(user.username)}`;

        setStatus("connecting");
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
            if (wsRef.current === socket) {
                setStatus("connected");
            }
        };

        socket.onmessage = (event: MessageEvent) => {
            try {
                const raw = JSON.parse(event.data);
                const content: string = raw.content || "";
                const msgRoomId: string = raw.roomId || roomId;
                const senderUsername: string = raw.username || "System";

                const isJoin = content.toLowerCase().includes("has joined the room");
                const isLeave = content.toLowerCase().includes("left the chat");
                const isSystem = isJoin || isLeave;

                const newMsg: ChatMessage = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    content,
                    roomId: msgRoomId,
                    username: senderUsername,
                    timestamp: Date.now(),
                    isSystem,
                    isSelf: senderUsername === user.username,
                };

                setMessages((prev) => [...prev, newMsg]);
            } catch (err) {
                console.error("Failed to parse incoming WebSocket message:", err, event.data);
            }
        };

        socket.onclose = (event) => {
            if (wsRef.current === socket) {
                // If it wasn't a normal clean closure initiated by unmount
                if (event.code !== 1000) {
                    setStatus("disconnected");
                }
            }
        };

        socket.onerror = () => {
            if (wsRef.current === socket) {
                setStatus("error");
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                socket.close(1000, "Component unmounted or room changed");
            }
            if (wsRef.current === socket) {
                wsRef.current = null;
            }
        };
    }, [roomId, user?.id, user?.username]);

    const sendMessage = useCallback((text: string): boolean => {
        const trimmed = text.trim();
        if (!trimmed) return false;

        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not open. Current state:", socket?.readyState);
            return false;
        }

        // Send raw text - the Go backend receives string(m) and wraps it in Message struct
        socket.send(trimmed);
        return true;
    }, []);

    return {
        status,
        messages,
        sendMessage,
    };
}
