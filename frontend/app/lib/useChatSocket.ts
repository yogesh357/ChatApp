'use client'

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/authProvider";
import { ChatPayload, EventMessage } from "./types";

const DEFAULT_URL = "ws://localhost:8080/ws/joinRoom/1?userId=1&username=yogesh"


export interface ServerStats {
    messagesSent: number;
    messagesReceived: number;
    connectedAt: number | null;
    latencyMs: number | null;
    poolSize?: number;
    assignedClientId?: string | null;
}
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";


export type Message = {
    content: string
    client_id: string
    username: string
    room_id: string
    type: 'recv' | 'self'
}


export function useChatSocket(
    serverUrl: string = DEFAULT_URL
) {

    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const { user } = useContext(AuthContext)
    const [users, setUsers] = useState<Array<{ username: string }>>([])
    const [messages, setMessage] = useState<Array<Message>>([])


    const [stats, setStats] = useState<ServerStats>({
        messagesSent: 0,
        messagesReceived: 0,
        connectedAt: null,
        latencyMs: null,
        poolSize: 1,
        assignedClientId: null,
    });




    const connect = useCallback((force: boolean = false) => {
        try {

            const socket = new WebSocket(serverUrl);
            wsRef.current = socket;

            const connectStart = Date.now();
            socket.onopen = () => {
                if (wsRef.current !== socket) return;
                setStatus("connected");
                const latency = Date.now() - connectStart;

                setStats((prev) => ({
                    ...prev,
                    connectedAt: Date.now(),
                    latencyMs: latency,
                }));
            };

            socket.onmessage = (message: MessageEvent) => {
                const m: Message = JSON.parse(message.data)
                if (m.content == 'A new user has joined the room') {
                    setUsers([...users, { username: m.username }])
                }

                if (m.content == 'user left the chat') {
                    const deleteUser = users.filter((user) => user.username != m.username)
                    setUsers([...deleteUser])
                    setMessage([...messages, m])
                    return
                }

                user?.username == m.username ? (m.type = 'self') : (m.type = 'recv')
                setMessage([...messages, m])

            }


            socket.onclose = () => {
                console.log("WebSocket disconnected");
            }

            socket.onerror = (error) => {
                console.log("WebSocket error");
            }


        } catch (err) {
            console.error("WebSocket connection failure:", err);
            setStatus("error");
        }
    }, [serverUrl])

    useEffect(() => {
        connect()
    }, [connect])


    const sendMessage = useCallback((text: string): boolean => {
        const trimmed = text.trim();
        console.log("input text to send the message received :", text);

        if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false;
        }

        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Send Structured Event Message
        const eventPayload: EventMessage<ChatPayload> = {
            event: "CHAT_MESSAGE",
            payload: {
                id: msgId || "1001",
                sender: "sender",
                text: trimmed || "hello",
                timestamp: Date.now(),
            },
        };

        console.log("event payload::", eventPayload);


        wsRef.current.send(JSON.stringify(eventPayload));
        console.log("message sent successfully");

        setStats((prev) => ({
            ...prev,
            messagesSent: prev.messagesSent + 1,
        }));

        return true;
    }, []);

    return {
        status,
        messages,
        stats,
        sendMessage,
    };
}

