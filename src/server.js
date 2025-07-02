const express = require('express');
const tmx = require('tmx-parser');
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

// wrapping in promise , converted callback to promise
// to not use nested callbacks
async function main(){
    const map = await new Promise((resolve, reject) => {
        tmx.parseFile('./public/map.tmx', (err, loadedmap) => {
            if (err) {
                console.error('Error parsing TMX file:', err);
                reject(err);
            } else {
                // console.log('TMX file parsed successfully:', loadedmap);
                resolve(loadedmap);
            }
        });
    });


    const layer = map.layers[0];
    const tiles = layer.tiles;
    const map2D = [];
    
    for (let row=0; row < map.height; row++) {
        const tilesRow = [];
        for (let col=0; col < map.width; col++) {
            tilesRow.push(tiles[row * map.width + col]);
        }
        map2D.push(tilesRow);
    }
    console.log('Map 2D array created:', map2D);


    // socket io connection
    io.on('connect', (socket) => {
        console.log('A user connected:', socket.id);

        // send map data to the client
        io.emit('map');

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
