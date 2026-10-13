'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from './context/authProvider'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import RoomSidebar from './components/RoomSidebar'
import ChatBox from './components/ChatBox'

export default function Home() {
    const { user, authenticated, isLoading } = useAuth()
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
    const [activeRoomName, setActiveRoomName] = useState<string | undefined>(undefined)

    // Restore active room from localStorage on page refresh
    useEffect(() => {
        try {
            const savedRoomId = localStorage.getItem('active_room_id')
            const savedRoomName = localStorage.getItem('active_room_name')
            if (savedRoomId) {
                setActiveRoomId(savedRoomId)
                if (savedRoomName) {
                    setActiveRoomName(savedRoomName)
                }
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [])

    const handleSelectRoom = (id: string, name?: string) => {
        setActiveRoomId(id)
        const displayName = name || `Room #${id}`
        setActiveRoomName(displayName)
        try {
            localStorage.setItem('active_room_id', id)
            localStorage.setItem('active_room_name', displayName)
        } catch {
            // Ignore localStorage errors
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
                    Initializing application...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
            <Navbar onOpenAuthModal={() => setAuthModalOpen(true)} />

            {!authenticated ? (
                /* Unauthenticated State */
                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mx-auto mb-4 text-xl">
                            ✦
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-100 mb-2">
                            Go WebSocket Chat
                        </h1>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                            A minimalist real-time communication platform built on high-performance Go WebSockets and Next.js.
                        </p>

                        <button
                            onClick={() => setAuthModalOpen(true)}
                            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
                        >
                            Get Started / Sign In
                        </button>
                    </div>

                    <AuthModal
                        isOpen={authModalOpen}
                        onClose={() => setAuthModalOpen(false)}
                    />
                </main>
            ) : (
                /* Authenticated Chat Application */
                <main className="flex-1 flex overflow-hidden">
                    <RoomSidebar
                        activeRoomId={activeRoomId}
                        onSelectRoom={handleSelectRoom}
                    />

                    <ChatBox
                        roomId={activeRoomId}
                        roomName={activeRoomName}
                        user={user}
                    />

                    <AuthModal
                        isOpen={authModalOpen}
                        onClose={() => setAuthModalOpen(false)}
                    />
                </main>
            )}
        </div>
    )
}
