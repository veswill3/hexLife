'use strict';

var HexLife = {
    map: null,
    context: null,
    style: {
        "grid":  "#3DAEAE",
        "alive": "#256363",
        "dead":  "#202020" // same as background
    },
    // Hex constants
    DIRS: [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],
    HEX_SIZE: 10,
    HEX_HEIGHT: 0,
    HEX_HORZ_SPACE: 0,
    offsetX: 0,
    offsetY: 0,
    DEBUG: { drawCoords: false },

    init: function() {
        document.getElementById('stop').style.display = "none";
        var canvas = document.getElementById('canvas');
        this.context = canvas.getContext("2d");
        this.genMap();

        document.addEventListener("keyup", function(e) {
            console.log('keyup fired');
            if (e.keyCode === 32) { // space bar
                if (HexLife.intervalID) {
                    HexLife.stopAnimate();
                } else {
                    HexLife.startAnimate();
                }
                e.stopPropagation();
            }
        });

        // toggle a cell on click
        canvas.addEventListener("click", function(e) {
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            var tile = HexLife.pixel2Tile(x, y);
            if (tile) {
                if (HexLife.drawingCircle) {
                    if (HexLife.drawingCircle === true) {
                        HexLife.drawingCircle = tile;
                    } else {
                        var center = HexLife.drawingCircle;
                        HexLife.drawingCircle = false;
                        var radius = HexLife.Tile.distance(center, tile);
                        var circleTiles = HexLife.Tile.getCircle(center, radius);
                        for (var i = 0; i < circleTiles.length; i++) {
                            circleTiles[i].alive = true;
                            circleTiles[i].draw();
                        }

                        document.getElementById('circleBtn').style.display = "";
                    }
                } else {
                    tile.alive = !tile.alive;
                    tile.draw();
                }
            }
        }, false);
    },

    rules: function(tile) {
        var numAliveNeighbors = 0;
        tile.getNeighbors().forEach(function(n) {
            if (n.alive) { // check current (old) state
                numAliveNeighbors++;
            }
        });
        if (tile.alive) {
            if (numAliveNeighbors > 4) {
                return false; // starvation
            } else if (numAliveNeighbors < 3) {
                return false; // lonely
            } else {
                return true; // survived
            }
        } else if (numAliveNeighbors === 2) {
            return true; // new cell born
        }
    },

    genMap: function(random) {
        if (random) {
            console.log('generating random map');
        }
        this.HEX_HEIGHT = Math.sqrt(3) / 2 * (2 * this.HEX_SIZE),
        this.HEX_HORZ_SPACE = (2 * this.HEX_SIZE) * 3 / 4,
        this.map = {};
        // Make a large hex shape
        var size = 15;
        this.offsetX = this.HEX_SIZE + 3; // +3 is for line width
        this.offsetY = -size * this.HEX_SIZE * 2 / 3 + 3;
        var len = size * 2 + 1;
        for (var q = 0; q < len; q++) {
            for (var r = 0; r < len; r++) {
                if (q + r >= size && q + r <= size * 3) {
                    var tile;
                    if (random) {
                        var alive = Math.random() > 0.7;
                        tile = new HexLife.Tile(q, r, alive);
                    } else {
                        tile = new HexLife.Tile(q, r, false);
                    }
                    this.map[r + "," + q] = tile;
                    tile.draw();
                }
            }
        }
    },

    step: function() {
        // calculate new states
        for (var key in this.map) {
            var tile = this.map[key];
            tile.newState = this.rules(tile);
        }
        // apply new states and redraw
        for (var key in this.map) {
            var tile = this.map[key];
            tile.alive = tile.newState;
            delete tile.newState;
            tile.draw();
        }
    },

    startAnimate: function() {
        if (this.intervalID) {
            return;
        }
        document.getElementById('stop').style.display = "";
        document.getElementById('start').style.display = "none";
        this.intervalID = setInterval(function() {
            HexLife.step();
        }, 70);
    },

    stopAnimate: function() {
        clearInterval(this.intervalID);
        document.getElementById('stop').style.display = "none";
        document.getElementById('start').style.display = "";
        delete this.intervalID;
    },

    startCircle: function() {
        document.getElementById('circleBtn').style.display = "none";
        this.drawingCircle = true;
    },

    pixel2Tile: function(mouseX, mouseY) {
        mouseX -= this.offsetX;
        mouseY -= this.offsetY;
        var q = mouseX * 2/3 / this.HEX_SIZE;
        var r = (-mouseX / 3 + Math.sqrt(3) / 3 * mouseY) / this.HEX_SIZE;
        // hex_to_cube
        var x = q;
        var z = r;
        var y = -x-z;
        // cube_round
        var rx = Math.round(x);
        var ry = Math.round(y);
        var rz = Math.round(z);

        var x_diff = Math.abs(rx - x);
        var y_diff = Math.abs(ry - y);
        var z_diff = Math.abs(rz - z);

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry-rz;
        } else if (y_diff > z_diff) {
            ry = -rx-rz;
        } else {
            rz = -rx-ry;
        }

        if (rx+","+rz in this.map) {
            return this.map[rx+","+rz];
        } else {
            return null;
        }
    },

};

HexLife.Tile = function(q, r, alive) {
    // axial coordinates
    this.q = q;
    this.r = r;
    // cube coordinates
    this.x = q;
    this.y = -q-r;
    this.z = r;

    this.alive = alive;
};

HexLife.Tile.distance = function(tileA, tileB) {
    return (Math.abs(tileA.x - tileB.x) + Math.abs(tileA.y - tileB.y) + Math.abs(tileA.z - tileB.z)) / 2
};

HexLife.Tile.getCircle = function(center, radius) {
    var results = [];
    // starting tile coords
    var q = center.q + HexLife.DIRS[4][0] * radius;
    var r = center.r + HexLife.DIRS[4][1] * radius;

    for (var i = 0; i < HexLife.DIRS.length; i++) {
        for (var j = 0; j < radius; j++) {
            var key = r + "," + q;
            if (key in HexLife.map) {
                results.push(HexLife.map[key]);
            }
            q += HexLife.DIRS[i][0];
            r += HexLife.DIRS[i][1];
        }
    }
    return results;
};

HexLife.Tile.prototype.getNeighbors = function() {
    return HexLife.Tile.getCircle(this, 1);
};

HexLife.Tile.prototype.draw = function() {
    var ctx = HexLife.context;
    var x = this.r * HexLife.HEX_HORZ_SPACE + HexLife.offsetX;
    var y = (this.q + this.r / 2) * HexLife.HEX_HEIGHT + HexLife.offsetY;

    ctx.strokeStyle = HexLife.style.grid;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + HexLife.HEX_SIZE * Math.cos(0), y + HexLife.HEX_SIZE *  Math.sin(0));          
    for (var i = 1; i <= 5;i += 1) {
        ctx.lineTo(x + HexLife.HEX_SIZE * Math.cos(i * 2 * Math.PI / 6), y + HexLife.HEX_SIZE * Math.sin(i * 2 * Math.PI / 6));
    }
    ctx.fillStyle = this.alive ? HexLife.style.alive : HexLife.style.dead;
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    if (HexLife.DEBUG.drawCoords) {
        ctx.font = "14px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText(this.r + ',' + this.q, x, y + 5);
    }
};