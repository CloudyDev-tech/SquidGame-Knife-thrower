const tmx = require('tmx-parser');


async function loadMap(){
    const map = await new Promise((resolve, reject) => {
        tmx.parseFile('./src/map.tmx', (err, loadedmap) => {
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
    const groundTiles = layer.tiles;
    const decalTiles = map.layers[1].tiles;
    const ground2D = [];
    const decals2D = [];
    
    for (let row=0; row < map.height; row++) {
        const tilesRow = [];
        const decalRow = [];
        for (let col=0; col < map.width; col++) {
            const tile = groundTiles[row * map.width + col];
            tilesRow.push({id: tile.id, gid: tile.gid});

            // 2nd layer (decals)
            const decalTile = decalTiles[row * map.width + col];

            if(decalTile){
            decalRow.push({id: decalTile.id, gid: decalTile.gid});
            }
            else{
                decalRow.push(undefined);
            }

        }
        ground2D.push(tilesRow);
        decals2D.push(decalRow);
    }
    // console.log('Map 2D array created:', map2D);
    return {ground2D, decals2D};
}


module.exports = loadMap;