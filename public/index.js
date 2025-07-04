const mapImage = new Image();
mapImage.src = './snowy-sheet.png'

const canvasElement = document.getElementById('canvas');
// console.log(canvasElement);
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

const canvas = canvasElement.getContext('2d'); // to render out stuff

let map=[[]];

const TILE_SIZE = 32;

const socket = io('ws://localhost:5050');

socket.on('connect', () => {
    console.log('connected');
});

socket.on('disconnect', () => {
    console.log('disconnected');
});

socket.on('map', (loadedMap) => {
    // console.log('map', loadedMap);
    map = loadedMap;
})


function loop(){
    canvas.clearRect(0,0,canvas.width, canvas.height);

    const TILES_IN_ROW = 8;

    for(let row=0; row<map.length; row++){
        for(let col=0; col<map[0].length; col++){
            const {id} = map[row][col];
            const imageRow = parseInt(id/TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            // const imageY = id/TILES_IN_ROW;

            canvas.drawImage(mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                 col * TILE_SIZE, // where canvas should draw this image
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );}
    }
    // canvas.fillColor = "ffffff"
    // canvas.fillRect(0,0,10,10);
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);