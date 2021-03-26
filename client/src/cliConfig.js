export default class CliConfig {

    constructor({ username, room, url }) {
        this.username = username
        this.room = room

        const { hostname, port, protocol } = new URL(url)
        this.hostname = hostname
        this.port = port
        this.protocol = protocol.replace(/\W/, '')
    }

    static parseArguments(commands) {
        const prefix = '--'
        const cmd = new Map();

        for (const key in commands) {
            const index = parseInt(key)
            const comand = commands[key];

            if (!comand.includes(prefix)) continue;

            cmd.set(
                comand.replace(prefix, ''),
                commands[index + 1]
            )
        }

        return new CliConfig(Object.fromEntries(cmd))
    }
}