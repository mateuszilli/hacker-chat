import Events from 'events';
import Socket from './src/socket.js'
import Controller from './src/controller.js';
import { constant } from './src/constant.js';

const events = new Events();

const port = process.env.PORT || 9898
const socket = new Socket({ port })
const server = await socket.initialize(events)
console.log('socket server is running at', server.address())

const controller = new Controller({ socket });
events.on(constant.events.USER_CONNECTED, controller.onNewConnection.bind(controller))