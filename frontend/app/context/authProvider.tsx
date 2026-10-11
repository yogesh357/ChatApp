'use client'

import React, { useState, createContext, useEffect, useContext } from 'react'

export type UserInfo = {
    username: string
    id: string
}

interface AuthContextType {
    authenticated: boolean
    isLoading: boolean
    user: UserInfo | null
    login: (userInfo: UserInfo) => void
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
    authenticated: false,
    isLoading: true,
    user: null,
    login: () => {},
    logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user_info')
            if (stored) {
                const parsed: UserInfo = JSON.parse(stored)
                if (parsed?.id && parsed?.username) {
                    setUser(parsed)
                }
            }
        } catch (e) {
            console.error('Failed to parse user from localStorage', e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = (userInfo: UserInfo) => {
        setUser(userInfo)
        localStorage.setItem('user_info', JSON.stringify(userInfo))
    }

    const logout = async () => {
        try {
            const { userLogout } = await import('../services/auth.service')
            await userLogout().catch(() => {})
        } catch {
            // Ignore network errors on logout
        } finally {
            setUser(null)
            localStorage.removeItem('user_info')
        }
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated: !!user,
                isLoading,
                user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider
