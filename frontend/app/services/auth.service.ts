import axios from "./axios"

const userRegister = (data: { username: string, email: string, password: string }) => {
    return axios.post('/signup', data)
}

const userLogin = (data: { email: string, password: string }) => {
    return axios.post('/login', data)
}

const userLogout = () => {
    return axios.post('/logout')
}

export {
    userRegister,
    userLogin,
    userLogout
}