const characterSelect = document.getElementById('character-select');
const loadingScreen = document.getElementById('loading-screen');
const startButton = document.getElementById('start-button');
const canvasElement = document.getElementById('canvas');

const mapImage = new Image();
mapImage.src = './snowy-sheet.png';

let playerImage = new Image();
playerImage.src = './santa.png'; // Default

const walkSnowSound = new Audio('./walk-snow.mp3');

// Handle character selection
document.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('click', () => {
        const character = card.dataset.character;
        // Special case for thanos (uses thanos50.png)
        if (character === 'thanos') {
            playerImage.src = './thanos50.png';
        } 
        // All other characters use their name directly
        else {
            playerImage.src = `./${character}.png`;
        }
        characterSelect.style.display = 'none';
        loadingScreen.style.display = 'flex';
    });
});

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
// Object pools for better memory management
const playerPool = [];
const knifePool = [];
let players = [];
let knives = [];
const playerMap = new Map(); 
const knifeImg = new Image(); // Load once instead of every frame
knifeImg.src = 'knife54.png';

function getPlayerFromPool() {
    return playerPool.pop() || {};
}

function getKnifeFromPool() {
    return knifePool.pop() || {};
}

function returnPlayerToPool(player) {
    playerPool.push(player);
}

function returnKnifeToPool(knife) {
    knifePool.push(knife);
}

const TILE_SIZE = 32;

let myId = null; // to keep track of my id

const socket = io();

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
    // Return old players to pool
    for(let i=0; i<players.length; i++) {
        returnPlayerToPool(players[i]);
    }
    
    // Get new players from pool
    players = [];
    playerMap.clear();
    for(let i=0; i<serverPlayers.length; i++) {
        const player = getPlayerFromPool();
        Object.assign(player, serverPlayers[i]);
        players.push(player);
        playerMap.set(player.id, player);
    }
})

socket.on('knives', (serverKnives)=>{
    // Return old knives to pool
    for(let i=0; i<knives.length; i++) {
        returnKnifeToPool(knives[i]);
    }
    
    // Get new knives from pool
    knives = [];
    for(let i=0; i<serverKnives.length; i++) {
        const knife = getKnifeFromPool();
        Object.assign(knife, serverKnives[i]);
        knives.push(knife);
    }
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


    const myPlayer = playerMap.get(socket.id);
    let cameraX = 0, cameraY = 0;
    if(myPlayer){
        myId = myPlayer.id;
        cameraX = parseInt(myPlayer.x - canvasElement.width/2);
        cameraY = parseInt(myPlayer.y - canvasElement.height/2);
    }
    

    const TILES_IN_ROW = 8;

    const rows = groundMap.length;
    const cols = groundMap[0].length;
    for(let row=0; row<rows; row++){
        for(let col=0; col<cols; col++){
            const {id} = groundMap[row][col];
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

    // Optimized nested loops with cached lengths
    const decalRows = decalMap.length;
    const decalCols = decalMap[0].length;
    for(let row=0; row<decalRows; row++){
        for(let col=0; col<decalCols; col++){
            const {id} = decalMap[row][col] ?? {id: undefined};
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


    for(let i=0, len=players.length; i<len; i++){
        const player = players[i];
        canvas.drawImage(playerImage, player.x - cameraX, player.y - cameraY);
        
        // Draw health bar with border
        const healthWidth = 32 * (player.health / 100);
        canvas.fillStyle = '#000000';
        canvas.fillRect(player.x - cameraX - 1, player.y - cameraY - 11, 34, 7);
        canvas.fillStyle = player.health > 50 ? '#00ff00' : player.health > 20 ? '#ffff00' : '#ff0000';
        canvas.fillRect(player.x - cameraX, player.y - cameraY - 10, healthWidth, 5);
    }

    for(let i=0, len=knives.length; i<len; i++){
        const knife = knives[i];
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
    // Limit to ~60 FPS
    setTimeout(() => {
        window.requestAnimationFrame(loop);
    }, 16);
}

window.requestAnimationFrame(loop);
