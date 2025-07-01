const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// socket io config
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


// socket io connection
io.on('connect', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});


// using socket io server here to run ou app
httpServer.listen(5050, () => {
    console.log('Server is running on port 5050');
});