import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/backend'

const instance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Attach accessToken if stored in localStorage
instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('user_info')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (parsed?.accessToken) {
                    config.headers.Authorization = `Bearer ${parsed.accessToken}`
                }
            }
        } catch {
            // Ignore parse errors
        }
    }
    return config
})

export default instance