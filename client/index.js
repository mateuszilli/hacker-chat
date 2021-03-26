import Events from 'events'
import CliConfig from './src/cliConfig.js'
import EventManager from './src/eventManager.js';
import Socket from './src/socket.js'
import TerminalController from './src/terminalController.js'

const [node, file, ...commands] = process.argv;
const config = CliConfig.parseArguments(commands)

const events = new Events();

const socket = new Socket(config)
await socket.initialize()

const eventManager = new EventManager({ events, socket })

const ownEvents = eventManager.getEvents();
socket.attachEvents(ownEvents)

eventManager.joinRoom({
    roomId: config.room,
    username: config.username
})

const controller = new TerminalController();
await controller.initializeTable(events);