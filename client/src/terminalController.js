import ComponentBuilder from './component.js'
import { constant } from './constant.js'

export default class TerminalController {
    #usersColors = new Map()

    constructor() {}

    #randomColor() {
        return '#' + ((1 << 24) * Math.random() | 0).toString(16) + '-fg'
    }

    #getUserColor(username) {
        if (this.#usersColors.has(username)) {
            return this.#usersColors.get(username)
        }

        const color = this.#randomColor()
        this.#usersColors.set(username, color)

        return color
    }

    #onInputReceived(eventEmitter) {
        return function () {
            const message = this.getValue()
            eventEmitter.emit(constant.events.app.MESSAGE_SENT, message)
            this.clearValue()
        }
    }

    #onMessageReceived({ screen, chat }) {
        return data => {
            const { username, message } = data
            const color = this.#getUserColor(username)

            chat.addItem(`{${color}}{bold}${username}{/}: ${message}`)
            screen.render()
        }
    }

    #onStatusUpdated({ screen, status }) {
        return data => {
            const { content } = status.items.shift()
            status.clearItems();
            status.addItem(content);

            data.forEach(username => {
                const color = this.#getUserColor(username)
                status.addItem(`{${color}}{bold}${username}{/}`)
                
            })
            screen.render()
        }
    }

    #onActivityLogUpdated({ screen, activityLog }) {
        return data => {
            const [ username ] = data.split(/\s/)
            const color = this.#getUserColor(username)

            activityLog.addItem(`{${color}}{bold}${data.toString()}{/}`)
            screen.render()
        }
    }

    #registerEvents(eventEmitter, component) {
        eventEmitter.on(constant.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(component))
        eventEmitter.on(constant.events.app.STATUS_UPDATED, this.#onStatusUpdated(component))
        eventEmitter.on(constant.events.app.ACTIVITYLOG_UPDATED, this.#onActivityLogUpdated(component))
    }

    async initializeTable(eventEmitter) {
        const component = new ComponentBuilder()
            .setScreen({ title: 'HackerChat' })
            .setLayout()
            .setInput(this.#onInputReceived(eventEmitter))
            .setChat()
            .setStatus()
            .setActivityLog()
            .build()

        this.#registerEvents(eventEmitter, component);

        component.input.focus();
        component.screen.render();
    }
}