const PRODUCTION_URL = 'https://hacker-chat-mateuszilli.herokuapp.com'

export default class CliConfig {

    constructor({ username, room, url = PRODUCTION_URL }) {
        this.username = username
        this.room = room 

        const { hostname, port, protocol } = new URL(url)

        this.host = hostname
        this.port = port
        this.protocol = protocol.replace(/\W/, '')
    }

    static parseArguments(commands) {
        const cmd = new Map()
        const prefix = '--'

        for(const key in commands) {

            const index = parseInt(key)
            const command = commands[key]

            if(!command.includes(prefix)) continue;
            
            cmd.set(
                command.replace(prefix, ''),
                commands[index + 1]
            )
        }

        return new CliConfig(Object.fromEntries(cmd))
    }
}