const loadingScreen = document.getElementById('loading-screen');
const startButton = document.getElementById('start-button');
const canvasElement = document.getElementById('canvas');

const mapImage = new Image();
mapImage.src = './snowy-sheet.png'

const santaImage = new Image();
santaImage.src = './santa.png';
// santaImage.src = './thanos50.png';

const walkSnowSound = new Audio('./walk-snow.mp3');

// Initialize canvas but keep it hidden until game starts
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;
const canvas = canvasElement.getContext('2d');

// Handle start button click
startButton.addEventListener('click', () => {
    loadingScreen.style.display = 'none';
    canvasElement.style.display = 'block';
});

let groundMap=[[]];
let decalMap = [[]];
let players = [];
let knives = [];

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

socket.on('knives', (serverKnives)=>{
    knives = serverKnives;
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
    if (['a', 's', 'w', 'd', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)){
        walkSnowSound.play();
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

    if (['a', 's', 'w', 'd', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)){
        walkSnowSound.pause();
        walkSnowSound.currentTime = 0;
    }
    // console.log(inputs);
    socket.emit('inputs', inputs);
})


window.addEventListener('click', (e)=>{
    const angle = Math.atan2(e.clientY - canvasElement.height/2, e.clientX - canvasElement.width/2);
    socket.emit("knife", angle);
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

    // Load knife image
    const knifeImg = new Image();
    knifeImg.src = 'knife54.png';

    for(const knife of knives){
        if(knifeImg.complete) {
            // Save current canvas state
            canvas.save();
            // Move to knife position
            canvas.translate(knife.x - cameraX, knife.y - cameraY);
            // Rotate based on angle
            canvas.rotate(knife.angle);
            // Draw knife centered
            canvas.drawImage(knifeImg, -8, -8, 32, 32);
            // Restore canvas state
            canvas.restore();
        }
    }

    // canvas.drawImage(santaImage, 0, 0, 32, 32, 100, 100, 32, 32);
    // canvas.fillColor = "ffffff"
    // canvas.fillRect(0,0,10,10);
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
