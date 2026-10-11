import axios from "./axios"

export interface RegisterReq {
    username: string
    email: string
    password: string
}

export interface RegisterRes {
    id: string
    username: string
    email: string
}

export interface LoginReq {
    email: string
    password: string
}

export interface LoginRes {
    id: string
    username: string
}

const userRegister = async (data: RegisterReq): Promise<RegisterRes> => {
    const res = await axios.post('/signup', data)
    return res.data
}

const userLogin = async (data: LoginReq): Promise<LoginRes> => {
    const res = await axios.post('/login', data)
    return res.data
}

const userLogout = async (): Promise<{ message: string }> => {
    const res = await axios.post('/logout')
    return res.data
}

export {
    userRegister,
    userLogin,
    userLogout
}