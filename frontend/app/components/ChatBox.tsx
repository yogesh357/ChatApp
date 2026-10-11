'use client'

import React, { useState, useRef, useEffect } from 'react'
import { UserInfo } from '../context/authProvider'
import { useChatSocket, ConnectionStatus } from '../lib/useChatSocket'

interface ChatBoxProps {
    roomId: string | null
    roomName?: string
    user: UserInfo | null
}

export default function ChatBox({ roomId, roomName, user }: ChatBoxProps) {
    const { status, messages, sendMessage } = useChatSocket(roomId, user)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || status !== 'connected') return

        const sent = sendMessage(input)
        if (sent) {
            setInput('')
        }
    }

    if (!roomId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-zinc-400 mb-4 shadow-sm">
                    💬
                </div>
                <h3 className="text-base font-semibold text-zinc-200 tracking-tight">
                    No Room Selected
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
                    Select a room from the sidebar or create a new room to begin real-time messaging via WebSocket.
                </p>
            </div>
        )
    }

    const renderStatusBadge = (s: ConnectionStatus) => {
        switch (s) {
            case 'connected':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                    </span>
                )
            case 'connecting':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Connecting...
                    </span>
                )
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-400 bg-red-950/40 border border-red-900/50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Connection Error
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        Disconnected
                    </span>
                )
        }
    }

    return (
        <section className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-950">
            {/* Top Room Header */}
            <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/90 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                            {roomName || `Room ${roomId}`}
                        </h2>
                        <span className="text-[11px] font-mono text-zinc-500">
                            ID: #{roomId}
                        </span>
                    </div>
                </div>
                <div>{renderStatusBadge(status)}</div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-20 text-xs text-zinc-500">
                        {status === 'connected'
                            ? 'Room is ready. Send a message to start the conversation!'
                            : 'Establishing WebSocket connection to room...'}
                    </div>
                ) : (
                    messages.map((m) => {
                        if (m.isSystem) {
                            return (
                                <div key={m.id} className="flex justify-center my-2">
                                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-3 py-1 rounded-full">
                                        ✦ {m.content}
                                    </span>
                                </div>
                            )
                        }

                        const timeStr = new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })

                        return (
                            <div
                                key={m.id}
                                className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                    <span className="text-[11px] font-medium text-zinc-400">
                                        {m.isSelf ? 'You' : m.username}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-mono">
                                        {timeStr}
                                    </span>
                                </div>

                                <div
                                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                                        m.isSelf
                                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tr-xs'
                                            : 'bg-zinc-900 text-zinc-200 border border-zinc-800/80 rounded-tl-xs'
                                    }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            status === 'connected'
                                ? 'Type a message... (Press Enter to send)'
                                : 'Waiting for connection...'
                        }
                        disabled={status !== 'connected'}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={status !== 'connected' || !input.trim()}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                        Send
                    </button>
                </form>
            </div>
        </section>
    )
}