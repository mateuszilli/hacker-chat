import { constant } from './constant.js'

export default class EventManager {
    #users = new Map()

    constructor({ events, socket }) {
        this.events = events,
        this.socket = socket
    }

    #emitComponentUpdate(event, message) {
        this.events.emit(event, message)
    }

    #updateActivityLogComponent(message) {
        const event = constant.events.app.ACTIVITYLOG_UPDATED

        this.#emitComponentUpdate(event, message)
    }

    #updateStatusComponent() {
        const event = constant.events.app.STATUS_UPDATED
        const message = Array.from(this.#users.values())

        this.#emitComponentUpdate(event, message)
    }

    userConnected(data) {
        const { id, username } = data
        this.#users.set(id, username)
        this.#updateStatusComponent()
        this.#updateActivityLogComponent(`${username} join`)
    }

    userDisconnected(data) {
        const { id, username } = data
        this.#users.delete(id)

        this.#updateActivityLogComponent(`${username} left`)
        this.#updateStatusComponent()
    }

    userUpdated(data) {
        const users = data
        users.forEach(({ id, username }) => this.#users.set(id, username));
        this.#updateStatusComponent()
    }

    message(message) {
        const event = constant.events.app.MESSAGE_RECEIVED

        this.#emitComponentUpdate(event, message)
    }

    getEvents() {
        const functions = Reflect.ownKeys(EventManager.prototype)
            .filter(fn => fn !== 'constructor')
            .map(name => [name, this[name].bind(this)])

        return new Map(functions)
    }

    joinRoom(data) {
        this.socket.sendMessage(constant.events.socket.JOIN_ROOM, data)
        
        this.events.on(constant.events.app.MESSAGE_SENT, message => {
            this.socket.sendMessage(constant.events.socket.MESSAGE, message)
        })
    }
}