import Event from 'events'

export default class Socket {
    #connection = {}
    #listener = new Event()

    constructor({ host, port, protocol }) {
        this.host = host
        this.port = port
        this.protocol = protocol
    }

    sendMessage(event, message) {
        this.#connection.write(JSON.stringify({ event, message }))
    }

    attachEvents(events) {
        this.#connection.on('data', data => {
            try {
                data.toString()
                    .split('\n')
                    .filter(line => !!line)
                    .map(JSON.parse)
                    .map(({ event, message }) => {
                        this.#listener.emit(event, message)
                    })
            } catch (error) {
                console.error(`[Error] ~ `, data, error)
            }
        })
        this.#connection.on('error', data => console.log('onConnectionError', data))
        this.#connection.on('end', data => console.log('onConnectionEnd', data))

        for (const [key, value] of events) {
            this.#listener.on(key, value)
        }
    }

    async createConnection() {
        const options = {
            port: this.port,
            host: this.host,
            headers: {
                Connection: 'Upgrade',
                Upgrade: 'websocket'
            }
        }
    
        const protocol = await import(this.protocol)
        const req = protocol.request(options)
        req.end();

        return new Promise(resolve => {
            req.once('upgrade', (res, socket) => resolve(socket))
        })
    }

    async initialize() {
        this.#connection = await this.createConnection()
    }
}