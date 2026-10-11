import axios from "./axios"

export interface RoomItem {
    id: string
    name: string
}

export interface ClientItem {
    id: string
    username: string
}

const createRoom = async (data: { id: string; name: string }): Promise<RoomItem> => {
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

export {
    createRoom,
    getRooms,
    getClients
}