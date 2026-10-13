'use client'

import React, { useState } from 'react'
import { useAuth } from '../context/authProvider'
import { userLogin, userRegister } from '../services/auth.service'

interface AuthModalProps {
    isOpen: boolean
    onClose?: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { login } = useAuth()
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (mode === 'signup') {
                if (!username.trim() || !email.trim() || !password.trim()) {
                    setError('Please fill in all fields')
                    setLoading(false)
                    return
                }

                // Register user
                await userRegister({
                    username: username.trim(),
                    email: email.trim(),
                    password: password.trim(),
                })

                // Immediately login to receive access token and session cookies
                const res = await userLogin({
                    email: email.trim(),
                    password: password.trim(),
                })

                login({
                    id: res.id,
                    username: res.username,
                    accessToken: res.accessToken,
                })
                onClose?.()
            } else {
                if (!email.trim() || !password.trim()) {
                    setError('Please enter your email and password')
                    setLoading(false)
                    return
                }

                const res = await userLogin({
                    email: email.trim(),
                    password: password.trim(),
                })

                login({
                    id: res.id,
                    username: res.username,
                    accessToken: res.accessToken,
                })
                onClose?.()
            }
        } catch (err: any) {
            console.error('Auth error:', err)
            const msg = err.response?.data?.error || err.message || 'Authentication failed'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded-md"
                    >
                        ✕
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                        {mode === 'login' ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        {mode === 'login'
                            ? 'Sign in to access your chat rooms'
                            : 'Join with your username to start chatting'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 mb-5">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login')
                            setError(null)
                        }}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                            mode === 'login'
                                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('signup')
                            setError(null)
                        }}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                            mode === 'signup'
                                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="mb-4 text-xs bg-red-950/60 border border-red-800/60 text-red-300 px-3 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. yogesh"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-sm py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    )
}
