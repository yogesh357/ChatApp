import axios from "./axios"

export interface RoomItem {
    id: string
    name: string
    createdBy?: string
    createdAt?: string
}

export interface ClientItem {
    id: string
    username: string
    role?: string
    isOnline?: boolean
}

export interface MessageRecord {
    id: string
    roomId: string
    senderId: string
    username: string
    content: string
    createdAt: string
}

const createRoom = async (data: { name: string }): Promise<RoomItem> => {
    const res = await axios.post('/ws/createRoom', data)
    return res.data
}

const getRooms = async (): Promise<RoomItem[]> => {
    const res = await axios.get('/ws/rooms')
    return res.data || []
}

const getClients = async (roomId: string): Promise<ClientItem[]> => {
    const res = await axios.get(`/ws/getClients/${roomId}`)
    return res.data || []
}

const getMessages = async (roomId: string, limit = 50): Promise<MessageRecord[]> => {
    const res = await axios.get(`/ws/messages/${roomId}`, {
        params: { limit },
    })
    return res.data || []
}

export {
    createRoom,
    getRooms,
    getClients,
    getMessages
}