import axios from "./axios"


const createRoom = async (data: { ID: string, name: string }) => {
    await axios.post('/ws/createRoom', data)
}

const joinRoom = async (roomId: string) => {
    await axios.get(`/ws/joinRoom/${roomId}`)
}

const getRooms = async () => {
    const res = await axios.get('/ws/getRooms')
    return res.data
}

const getClients = async (roomId: string) => {
    const res = await axios.get(`/ws/getClients/${roomId}`)
    return res.data
}

export {
    createRoom,
    joinRoom,
    getRooms,
    getClients
}