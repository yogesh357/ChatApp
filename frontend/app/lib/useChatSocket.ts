'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { UserInfo } from "../context/authProvider";
import { getMessages, MessageRecord } from "../services/room.service";

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
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Fetch historical messages from PostgreSQL when roomId changes
    useEffect(() => {
        if (!roomId || !user?.username) {
            setMessages([]);
            setLoadingHistory(false);
            return;
        }

        let isCancelled = false;
        setLoadingHistory(true);

        getMessages(roomId, 50)
            .then((records: MessageRecord[]) => {
                if (isCancelled) return;
                const historical: ChatMessage[] = (records || []).map((rec) => ({
                    id: rec.id,
                    content: rec.content,
                    roomId: rec.roomId,
                    username: rec.username,
                    timestamp: rec.createdAt ? new Date(rec.createdAt).getTime() : Date.now(),
                    isSystem: false,
                    isSelf: rec.username === user.username,
                }));
                setMessages(historical);
            })
            .catch((err) => {
                console.error("Failed to load message history:", err);
            })
            .finally(() => {
                if (!isCancelled) {
                    setLoadingHistory(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [roomId, user?.username]);

    // WebSocket connection lifecycle
    useEffect(() => {
        if (!roomId || !user?.id || !user?.username) {
            setStatus("idle");
            return;
        }

        const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
        const tokenParam = user.accessToken ? `?token=${encodeURIComponent(user.accessToken)}` : "";
        const wsUrl = `${wsBase}/ws/joinRoom/${encodeURIComponent(roomId)}${tokenParam}`;

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

                const msgId = raw.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                const timestamp = raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now();

                const newMsg: ChatMessage = {
                    id: msgId,
                    content,
                    roomId: msgRoomId,
                    username: senderUsername,
                    timestamp,
                    isSystem,
                    isSelf: senderUsername === user.username,
                };

                setMessages((prev) => {
                    // Prevent duplicate if ID is already in messages
                    if (prev.some((m) => m.id === newMsg.id)) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });
            } catch (err) {
                console.error("Failed to parse incoming WebSocket message:", err, event.data);
            }
        };

        socket.onclose = (event) => {
            if (wsRef.current === socket) {
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
    }, [roomId, user?.id, user?.username, user?.accessToken]);

    const sendMessage = useCallback((text: string): boolean => {
        const trimmed = text.trim();
        if (!trimmed) return false;

        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not open. Current state:", socket?.readyState);
            return false;
        }

        // Send raw text string - backend receives string(m) and wraps it
        socket.send(trimmed);
        return true;
    }, []);

    return {
        status,
        messages,
        loadingHistory,
        sendMessage,
    };
}
