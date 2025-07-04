const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const loadMap = require('./mapLoader');

// socket io config
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// wrapping in promise , converted callback to promise
// to not use nested callbacks
async function main(){

    const map2D = await loadMap();
    // console.log(map2D);

    // socket io connection
    io.on('connect', (socket) => {  // io sends msg to anyone in channel
        console.log('A user connected:', socket.id);

        // send map data to the client
        socket.emit('map', map2D); // sends to independent client connceted at that time

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });


    // using socket io server here to run ou app
    httpServer.listen(5050, () => {
        console.log('Server is running on port 5050');
    });
}

main();
