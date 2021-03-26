import { constant } from './constant.js'

export default class Controller {
    #users = new Map()
    #rooms = new Map()

    constructor({ socket }) {
        this.socket = socket
    }

    #updateUserdata(socketId, userdata) {
        const users = this.#users
        const user = users.get(socketId) ?? {}

        const updatedUserdata = {
            ...user,
            ...userdata
        }

        users.set(socketId, updatedUserdata)

        return users.get(socketId)
    }

    #onSocketData(id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data)
                console.log('socket', id)
                console.log('event', event)
                console.log('message', message)
                console.log('onSocketData', data)
                this[event](id, message)
            } catch (error) {
                console.error(`[Error] ~ `, data, error)
            }
        }
    }

    #onSocketError(id) {
        return data => {
            console.log('onSocketError', id, data)
        }
    }

    #onSocketEnd(id) {
        return _ => {
            const { username, roomId } = this.#users.get(id)
            console.log(username, 'disconnected', id)
            this.#outUserOnRoom(id, roomId)

            this.broadcast({
                roomId,
                socketId: id,
                message: { id, username },
                event: constant.events.USER_DISCONNECTED
            })
        }
    }

    #joinUserOnRoom(roomId, user) {
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map()

        usersOnRoom.set(user.id, user)
        this.#rooms.set(roomId, usersOnRoom);

        return usersOnRoom
    }

    #outUserOnRoom(id, roomId) {
        this.#users.delete(id)
        const usersOnRoom = this.#rooms.get(roomId)
        usersOnRoom.delete(id);

        this.#rooms.set(roomId, usersOnRoom)
    }

    broadcast({ socketId, roomId, event, message, currentSocket = false }) {
        const usersOnRoom = this.#rooms.get(roomId)

        for (const [key, user] of usersOnRoom) {
            if (!currentSocket && key === socketId) continue
            
            this.socket.sendMessage(user.socket, event, message)
        }
    }

    message(id, data) {
        const { username, roomId } = this.#users.get(id)

        this.broadcast({
            roomId,
            socketId: id,
            message: { username, message: data },
            event: constant.events.MESSAGE,
            currentSocket: true
        })
    }

    onNewConnection(socket) {
        const { id } = socket;
        console.log('connection stablished: ', id)
        const userdata = { id, socket }
        this.#updateUserdata(id, userdata)

        socket.on('data', this.#onSocketData(id))
        socket.on('error', this.#onSocketError(id))
        socket.on('end', this.#onSocketEnd(id))
    }

    async joinRoom(socketId, data) {
        const userdata = data
        console.log(`${userdata.username} join: `, socketId)
        const user = this.#updateUserdata(socketId, userdata)

        const { roomId } = userdata
        const users = this.#joinUserOnRoom(roomId, user)

        const currentUsers = Array.from(users.values())
            .map(({ id, username }) => ({ id, username }))

        this.socket.sendMessage(user.socket, constant.events.USER_UPDATED, currentUsers)

        this.broadcast({
            socketId,
            roomId,
            message: {
                id: socketId,
                username: userdata.username
            },
            event: constant.events.USER_CONNECTED
        })
    }
}