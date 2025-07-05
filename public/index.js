const mapImage = new Image();
mapImage.src = './snowy-sheet.png'

const santaImage = new Image();
santaImage.src = './santa.png';

const canvasElement = document.getElementById('canvas');
// console.log(canvasElement);
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

const canvas = canvasElement.getContext('2d'); // to render out stuff

let groundMap=[[]];
let decalMap = [[]];
let players = [];
let snowballs = [];

const TILE_SIZE = 32;

let myId = null; // to keep track of my id

const socket = io('ws://localhost:5050');

socket.on('connect', () => {
    console.log('connected');
    console.log(socket.id);
});

socket.on('disconnect', () => {
    console.log('disconnected');
});

socket.on('map', (loadedMap) => {
    // console.log('map', loadedMap);
    groundMap = loadedMap.ground;
    decalMap = loadedMap.decals;
    // map = loadedMap;
})

socket.on('players', (serverPlayers)=>{
    players = serverPlayers;
})

socket.on('snowballs', (serverSnowballs)=>{
    snowballs = serverSnowballs;
})

const inputs = {
    up: false,
    down: false,
    left: false,
    right: false
};

window.addEventListener('keydown', (e)=>{
    // console.log(e.key);
    if (e.key === 'ArrowUp' || e.key === 'w'){
        inputs.up = true;
    }
    else if (e.key === 'ArrowDown' || e.key === 's'){
        inputs.down = true;
    }
    else if (e.key === 'ArrowLeft' || e.key === 'a'){
        inputs.left = true;
    }
    else if (e.key === 'ArrowRight' || e.key === 'd'){
        inputs.right = true;
    }
    // console.log(inputs);
    socket.emit('inputs', inputs);
});

window.addEventListener('keyup', (e)=>{
    if (e.key === 'ArrowUp' || e.key === 'w'){
        inputs.up = false;
    }
    else if (e.key === 'ArrowDown' || e.key === 's'){
        inputs.down = false;
    }
    else if (e.key === 'ArrowLeft' || e.key === 'a'){
        inputs.left = false;
    }
    else if (e.key === 'ArrowRight' || e.key === 'd'){
        inputs.right = false;
    }
    // console.log(inputs);
    socket.emit('inputs', inputs);
})


window.addEventListener('click', (e)=>{
    const angle = Math.atan2(e.clientY - canvasElement.height/2, e.clientX - canvasElement.width/2);
    socket.emit("snowball", angle);
});

function loop(){
    canvas.clearRect(0,0,canvasElement.width, canvasElement.height);


    const myPlayer = players.find(player => player.id === socket.id);
    let cameraX = 0, cameraY = 0;
    if(myPlayer){
        myId = myPlayer.id;
        cameraX = parseInt(myPlayer.x - canvasElement.width/2);
        cameraY = parseInt(myPlayer.y - canvasElement.height/2);
    }
    

    const TILES_IN_ROW = 8;

    for(let row=0; row<groundMap.length; row++){
        for(let col=0; col<groundMap[0].length; col++){
            let {id} = groundMap[row][col];
            const imageRow = parseInt(id/TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            // const imageY = id/TILES_IN_ROW;

            canvas.drawImage(mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                 col * TILE_SIZE - cameraX, // where canvas should draw this image
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }


    // 2nd layer for loop

    for(let row=0; row<decalMap.length; row++){
        for(let col=0; col<decalMap[0].length; col++){
            let {id} = decalMap[row][col] ?? {id: undefined};
            const imageRow = parseInt(id/TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            // const imageY = id/TILES_IN_ROW;

            canvas.drawImage(mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                 col * TILE_SIZE - cameraX, // where canvas should draw this image
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }


    for(const player of players){
        canvas.drawImage(santaImage, player.x - cameraX, player.y - cameraY);
    }

    for(const snowball of snowballs){
        canvas.fillStyle = '#ffffff'
        canvas.beginPath();
        canvas.arc(snowball.x - cameraX, snowball.y - cameraY, 6, 0, 2 * Math.PI);
        canvas.fill();
    }

    // canvas.drawImage(santaImage, 0, 0, 32, 32, 100, 100, 32, 32);
    // canvas.fillColor = "ffffff"
    // canvas.fillRect(0,0,10,10);
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);