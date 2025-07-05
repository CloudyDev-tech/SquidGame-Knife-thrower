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

const TICK_RATE = 30;
const SPEED = 5;
const SNOWBALL_SPEED = 8;

let players = [];
let snowballs = [];
const inputsMap = {};

function tick(delta){
    for(const player of players){
        const inputs = inputsMap[player.id] ;
        if(inputs.up){
            player.y -= SPEED;
        }
        else if(inputs.down){
            player.y += SPEED;
        }

        if(inputs.left){
            player.x -= SPEED;
        }
        else if(inputs.right){
            player.x += SPEED;
        }
    }

    io.emit('players', players);

    for(const snowball of snowballs){
        snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
        snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
        snowball.timeLeft -= delta;

        for (const player of players){
            // if(player.id !== snowball.id && Math.abs(player.x - snowball.x) < 10 && Math.abs(player.y - snowball.y) < 10){
            //     snowballs = snowballs.filter((snowball) => snowball.id !== player.id);
            //     players = players.filter((player) => player.id !== snowball.id);
            // }

            if(player.id === snowball.playerId)
                continue;
            const distance =  Math.sqrt((player.x + 8 - snowball.x) ** 2 + (player.y + 8 - snowball.y) ** 2);
            // cause image 16x16 ki hai
            if(distance <= 8){ // elimination hone par respawn
                player.x = 0;
                player.y = 0;
                snowball.timeLeft = -1;
                break;
            }
            
           }
    }

    snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

    io.emit('snowballs', snowballs);
    // console.log(players);
}

// wrapping in promise , converted callback to promise
// to not use nested callbacks
async function main(){

    const map2D = await loadMap();
    // console.log(map2D);

    // socket io connection
    io.on('connect', (socket) => {  // io sends msg to anyone in channel
        console.log('A user connected:', socket.id);

        inputsMap[socket.id] = { // initialize with props
            up: false,          // just when new user connects
            down: false,
            left: false,
            right: false
        }

        players.push({
            id: socket.id,
            x: 0,
            y: 0,
            // angle: 0,
            // speed: 0
        });

        // send map data to the client
        socket.emit('map', map2D); // sends to independent client connceted at that time

        socket.on('inputs', (inputs)=>{
            inputsMap[socket.id] = inputs;
        })

        socket.on('snowball', (angle)=>{
            const player = players.find((player) => player.id === socket.id);
            snowballs.push({
                angle,
                x: player.x,
                y: player.y,
                timeLeft: 1000,
                playerId: socket.id
            })
            // console.log('snowball thrown', angle);
        })

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
            players = players.filter((player) => player.id !== socket.id);
            // jo gya wo gya.. can use splice here instead of filter for perf.

        });
    });


    // using socket io server here to run ou app
    httpServer.listen(5050, () => {
        console.log('Server is running on port 5050');
    });

    let lastUpdate = Date.now();
    setInterval(()=>{
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
        }, 1000/TICK_RATE);
}

main();
