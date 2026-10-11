'use client'

import React from 'react'
import { useAuth } from '../context/authProvider'

interface NavbarProps {
    onOpenAuthModal?: () => void
}

export default function Navbar({ onOpenAuthModal }: NavbarProps) {
    const { user, authenticated, logout } = useAuth()

    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
                    ✦
                </div>
                <div>
                    <span className="font-semibold text-zinc-100 tracking-tight text-sm">
                        Minimalist Chat
                    </span>
                    <span className="ml-2 text-[10px] uppercase tracking-widest font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        Go + WS
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {authenticated && user ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pl-3 py-1.5 pr-2 rounded-full bg-zinc-900 border border-zinc-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-zinc-300">
                                {user.username}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                                #{user.id}
                            </span>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onOpenAuthModal}
                        className="text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-zinc-200 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    )
}