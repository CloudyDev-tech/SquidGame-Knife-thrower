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
const SNOWBALL_SPEED = 12;

let players = [];
let knives = [];
const inputsMap = {};

let ground2D, decals2D;

function isColliding(rect1, rect2){
    return ( rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y 
    ) ;
    // console.log(rect1.x < rect2.x + rect2.width &&
    //     rect1.x + rect1.width > rect2.x &&
    //     rect1.y < rect2.y + rect2.height &&
    //     rect1.y + rect1.height > rect2.y )
}

function isCollidingWithObstacles(player){
    for(let row=0; row<decals2D.length; row++){
        for(let col=0; col<decals2D[0].length; col++){
            const tile = decals2D[row][col];
            // Only check collision if tile exists (not undefined)
            if(tile && isColliding(
                {
                    x: player.x,
                    y: player.y,
                    width: 32,
                    height: 32
                },
                {
                    x: col * 32,
                    y: row * 32,
                    width: 32,
                    height: 32
                }
            )){
                console.log(`Colliding with obstacle at row ${row}, col ${col}`);
                return true;
            }
        }
    }
    return false;
}


function tick(delta){
    for(const player of players){
        const previousX = player.x;
        const previousY = player.y;
        const inputs = inputsMap[player.id];
        
        // Handle vertical movement with boundary checks
        if(inputs.up){
            player.y = Math.max(0, player.y - SPEED);
        }
        else if(inputs.down){
            player.y = Math.min(ground2D.length * 32 - 32, player.y + SPEED);
        }

        if(isCollidingWithObstacles(player)){
            player.y = previousY;
        }

        // Handle horizontal movement with boundary checks
        if(inputs.left){
            player.x = Math.max(0, player.x - SPEED);
        }
        else if(inputs.right){
            player.x = Math.min(ground2D[0].length * 32 - 32, player.x + SPEED);
        }

        if(isCollidingWithObstacles(player)){
            player.x = previousX;
        }
    }

    io.emit('players', players);

    for(const knife of knives){
        knife.x += Math.cos(knife.angle) * SNOWBALL_SPEED;
        knife.y += Math.sin(knife.angle) * SNOWBALL_SPEED;
        knife.timeLeft -= delta;

        for (const player of players){
            // if(player.id !== snowball.id && Math.abs(player.x - snowball.x) < 10 && Math.abs(player.y - snowball.y) < 10){
            //     snowballs = snowballs.filter((snowball) => snowball.id !== player.id);
            //     players = players.filter((player) => player.id !== snowball.id);
            // }

            if(player.id === knife.playerId)
                continue;
            const distance =  Math.sqrt((player.x + 16 - knife.x) ** 2 + (player.y + 16 - knife.y) ** 2);
            // cause image 16x16 ki hai
            if(distance <= 16){ // knife hit
                player.health -= 20;
                if(player.health <= 0) { // respawn only when health depleted
                    player.x = 200;
                    player.y = 600;
                    player.health = 100; // reset health on respawn
                }
                knife.timeLeft = -1;
                break;
            }
            
           }
    }

    knives = knives.filter((knife) => knife.timeLeft > 0);

    io.emit('knives', knives);
    // console.log(players);
}

// wrapping in promise , converted callback to promise
// to not use nested callbacks
async function main(){

    ({ground2D, decals2D} = await loadMap())
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
            x: 400,
            y: 850,
            health: 100
            // angle: 0,
            // speed: 0
        });

        // send map data to the client
        socket.emit('map',{ground: ground2D,
            decals: decals2D
        }); // sends to independent client connceted at that time

        socket.on('inputs', (inputs)=>{
            inputsMap[socket.id] = inputs;
        })

        socket.on('knife', (angle)=>{
            const player = players.find((player) => player.id === socket.id);
            knives.push({
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
