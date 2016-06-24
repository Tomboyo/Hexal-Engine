//****************************//
//* Thomas 'Tomboyo' Simmons *//
//****************************//

//TODO: On very large maps, holding caching all chunks would be silly. Perhaps implement a maximal-grid that allows caching of /at most/ an MxN grid about the viewport. Thus, the user agent can cache an adjustable and tolerable hunk of the map, but not have to try to store /all/ of it.

//TODO: add functions to upload custom sprites for hexes.
//  All hexes will be the same size.

//TODO: once all HexalEngine variables are stable, the set function needs to editcheck them and perform updates as necessary.

//TODO: once all functions are relatively stable and functional:
// move all draw operations to a draw() loop. This will prevent draw calls from happening too often
// and allow flagging instead of explicit draw calls. Use requestAnimationFrame().

//TODO: bring in Is.js

"use strict";

//IE shim
Number.isInteger = Number.isInteger || function (a) {
  return (a === Math.floor(a));
};


function HexalEngine(data) {
  var  d, i, j, ax, ay, type, xlen, ylen;

  this.debug = {};

  this.map = {
    r: 2,             //Radius of the map
    depth: 3,         //Depth of map
    data: []          //Hexal Array [depth][index] depth = 0 is the bottom of the world.
  };

  this.hex = {
    size: 20,         //Size of hexagons (beyond minimum). Size increases by 2 px in diameter.
    skirt: 5,         //Height of isometric skirt (darker, 'vertical' portion)
    bord: 2,          //Border width (drawn to sprites)
    rad: 0,           //_ Radius of hexagon
    width: 0,         //_ width of sprite
    height: 0,        //_ height of sprite
    dx: 0,            //_ Horizontal displacement of sprite
    dy: 0,            //_ Vertical displacement of sprite
    a: 0              //_ Height of stagger (Triangle on top or bottom of hex)
  };

  // This is the hidden canvas used for rapid updating without costly rendering
  data.gfx.HCanvas = document.createElement('canvas');

  this.gfx = {
    VCanvas: data.gfx.VCanvas,
    HCanvas: data.gfx.HCanvas,
    chunks: [],
    chunkWidth: 0,
    chunkHeight: 0,
    renderDepth: 0,
    vctx: data.gfx.VCanvas.getContext('2d'),
    hctx: data.gfx.HCanvas.getContext('2d'),
    borderColor: [0, 0, 0, 64],
    bases: {
      'default': [[255, 0, 255, 255], null],
      'cyan':    [[153, 217, 234, 255], null],
      'blue':    [[112, 146, 190, 255], null],
      'tan':     [[239, 228, 176, 255], null],
      'brown':   [[185, 122, 87, 255], null],
      'shadow':  [[0, 0, 0, 255], null]
    },
    dx: 0,
    dy: 0
  };

  this.ui = {
    scale: [1, 1],    //_ Actual scale of canvas context
    scale_c: [        //_ Lower and upper bounds of canvas context scale
      [0.5, 1.5],
      [0.5, 1.5]
    ],
    ox: 0,            //_ Origin x-coordinate of map pan
    oy: 0,            //_ Origin y-coordinate of map pan
    pan_bounds: {     //_ gfx.dx and gfx.dy maximums and minimums based on viewport
      x: [0, 0],
      y: [0, 0]
    },
    top: 0           // Highest layer of map to render
  };

  this.set(data);

  //Populate map.data
  /*
  var gen = new TerraGen(Math.ceil(Math.log(this.map.r) / Math.log(2)));
  var heightData = gen.get();
  //console.log(heightData);
  for (var d = 0; d < this.map.depth; d += 1) {
    this.map.data.push([]);
    for (var ax = -this.map.r; ax <= this.map.r; ax += 1) {
      for (var ay = -this.map.r; ay <= this.map.r; ay += 1) {
        if (Math.abs(0-ax-ay) > this.map.r) {
          continue;
        }

        var type = d <= heightData[0][ax + this.map.r][ay + this.map.r] * this.map.depth ? "tan" : "default";
        this.map.data[d][this.cubicToIndex([ax, ay, 0-ax-ay])] = new this.Hexal(ax, ay, d, type, (type == "default"));
      }
    }
  }
  */

  for (d = 0; d < this.map.depth; d += 1) {
    this.map.data.push([]);
    for (ax = 0-this.map.r; ax <= this.map.r; ax += 1) {
      for (ay = 0-this.map.r; ay <= this.map.r; ay += 1) {
        if (Math.abs(0-ax-ay) > this.map.r) {
          continue;
        }

        type = Math.random();
        if (type < 0.15) { type = "cyan"; }
        else if (type < 0.3) { type = "blue"; }
        else if (type < 0.45) { type = "tan"; }
        else if (type < 0.6) { type = "brown"; }
        else { type = "default"; }
        this.map.data[d][this.cubicToIndex([ax, ay, 0-ax-ay])] = new this.Hexal(ax, ay, d, type, (type === "default"));
      }
    }
  }

  //TODO: make sure canvas is always contained by div
  this.renderBaseSprites();
  this.windowResize(this.gfx.VCanvas.offsetWidth, this.gfx.VCanvas.offsetHeight);

  //Chunking
  this.gfx.chunkWidth  = Math.floor(this.gfx.VCanvas.width / 6);
  this.gfx.chunkHeight = Math.floor(this.gfx.VCanvas.height / 6);
  this.gfx.chunks = [];
  xlen = Math.ceil(((this.map.r * 2 + 1) * this.hex.dx) / this.gfx.chunkWidth);
  ylen = Math.ceil(((this.map.r * 2 + 1) * this.hex.dy + (this.map.depth * this.hex.skirt)) / this.gfx.chunkHeight);
  for (i = 0; i < xlen; i += 1) {
    this.gfx.chunks[i] = [];
    for (j = 0; j < ylen; j += 1) {
      this.gfx.chunks[i][j] = document.createElement('canvas');
      this.gfx.chunks[i][j].width = this.gfx.chunkWidth;
      this.gfx.chunks[i][j].height = this.gfx.chunkHeight;
      this.gfx.chunks[i][j].chunkedat = false;
      this.gfx.chunks[i][j].strokeStyle="ff0000";
    }
  }

  // Center map panning
  //this.gfx.dx = Math.floor(this.gfx.VCanvas.width/2) - (this.map.r + 1) * this.hex.dx;
  //this.gfx.dy = Math.floor(this.gfx.VCanvas.height/2) - (this.map.r + 1) * this.hex.dy;

  this.chunk();
  this.renderViewport();
  console.log(this);
}


//Update data
HexalEngine.prototype.set = function(data) {
  var p;
  //KEY = VALUE
  //param[0] is typeof or false
  //param[1, 2, ...] are optional string-named constraints:
  //  nonnegative, integer.
  function _validate(value, params) {
    var param;
    if (value === undefined) { return false; }

    //typeof validation
    if (params[0] && typeof value !== params[0]) {
      console.error('Invalid property type: '+params[0]+' expected.');
      return;
    }
    params.shift();

    //parameter validation
    while (param = params.shift()) {
      if (param === 'nonnegative') {
        if (value < 0) {
          console.error('Invalid property type: must be nonnegative.');
          return false;
        }
      } else if (param === 'integer') {
        if (value % 1 !== 0) {
          console.error('Invalid property type: must be integer.');
          return false;
        }
      }
    }
    return true;
  }

  if (data.hex) {
    if (_validate(data.hex.size, ['number', 'nonnegative', 'integer'])) {
      this.hex.size = data.hex.size;
    }
    if (_validate(data.hex.skirt, ['number', 'nonnegative', 'integer'])) {
      this.hex.skirt = data.hex.skirt;
    }
    if (_validate(data.hex.bord, ['number', 'nonnegative', 'integer'])) {
      this.hex.bord = data.hex.bord;
    }

    this.hex.rad = 3 + this.hex.size;
    if (this.hex.bord > this.hex.rad) {
      this.hex.bord = this.hex.rad;
    }
    this.hex.height = 1 + 2*this.hex.rad;
    this.hex.width  = 2 + 2*this.hex.rad;
    this.hex.dx     = this.hex.width;
    this.hex.a      = Math.round((this.hex.rad + 0.5) / 2);
    this.hex.dy     = this.hex.height - this.hex.a;
  }

  //TODO: Once this Engine is roughly finished, complete validation implementation.
  if (data.map) {
    for (p in this.map) {
      if (data.map[p] !== undefined) {
        this.map[p] = data.map[p];
      }
    }
  }
  if (data.gfx) {
    for (p in this.gfx) {
      if (data.gfx[p] !== undefined) {
        this.gfx[p] = data.gfx[p];
      }
    }
  }

  if (this.gfx.renderDepth < 1) {
    this.gfx.renderDepth = 1;
  } else if (this.gfx.renderDepth > this.map.depth) {
    this.gfx.renderDepth = this.map.depth;
  }
  if (data.ui) {
    for (p in this.ui) {
      if (data.ui[p] !== undefined) {
        this.ui[p] = data.ui[p];
      }
    }
  }

  this.ui.top = this.map.depth - 1;
  return true;
};


//Render Base Sprites
//Renders hexagons to baseSprites hidden canvases.
//
HexalEngine.prototype.renderBaseSprites = function() {
  var h, i, v, x, y, base, data, sctx, shadow, skirt;

  function setPixel(d, x, y, r, g, b, a, add) {
    var p, di = (x + y * d.width) * 4;
    if (add) {
      p = (a / 255);
      d.data[di+0] = Math.min(255, (1 - p) * d.data[di+0] + p * r);
      d.data[di+1] = Math.min(255, (1 - p) * d.data[di+1] + p * g);
      d.data[di+2] = Math.min(255, (1 - p) * d.data[di+2] + p * b);
    } else {
      d.data[di+0] = r;
      d.data[di+1] = g;
      d.data[di+2] = b;
      d.data[di+3] = a;
    }
  }

  for (i in this.gfx.bases) {
    base = this.gfx.bases[i];
    base[1] = document.createElement('canvas');
    base[1].width  = this.hex.width;
    base[1].height = this.hex.height + this.hex.skirt;
    sctx = base[1].getContext('2d');
    data = sctx.createImageData(this.hex.width, this.hex.height + this.hex.skirt);
    v = (this.hex.width / 2) - 1;

    //Draw hexagon pixel by pixel
    for (x = 0; x < this.hex.width; x += 1) {
      h = Math.round((Math.abs(x - this.hex.rad) + (x <= this.hex.rad ? 0.5 : 0-0.5)) / 2);
      for (y = h; y < this.hex.height - h; y += 1) {
        setPixel(data, x, y, base[0][0], base[0][1], base[0][2], base[0][3]);
        if (this.hex.bord) {
          if (x <= this.hex.bord || (this.hex.width - 1 - x) <= this.hex.bord || (y - h) <= this.hex.bord || (this.hex.height - 1 - h - y) <= this.hex.bord) {
            setPixel(data, x, y, this.gfx.borderColor[0], this.gfx.borderColor[1], this.gfx.borderColor[2], this.gfx.borderColor[3], true);
          }
        }
      }

      if (!this.hex.skirt > 0) {
        continue;
      }

      skirt = this.hex.height - h + this.hex.skirt;
      for (y = this.hex.height - h; y < skirt; y += 1) {
        shadow = this.gfx.bases.shadow;
        setPixel(data, x, y, base[0][0], base[0][1], base[0][2], base[0][3]);
        if (skirt - y <= this.hex.bord || x <= this.hex.bord || (this.hex.width - 1 - x) <= this.hex.bord || Math.abs(x - v - 0.5) <= this.hex.bord) {
          setPixel(data, x, y, this.gfx.borderColor[0], this.gfx.borderColor[1], this.gfx.borderColor[2], this.gfx.borderColor[3], true);
        }
        //ToDo: remove hard-coding for shadow color; make modular.
        //setPixel(data, x, y, shadow[0][0], shadow[0][1], shadow[0][2], shadow[0][3], true);
        setPixel(data, x, y, shadow[0][0], shadow[0][1], shadow[0][2], 160, true);
        if (x > v) {
          setPixel(data, x, y, shadow[0][0], shadow[0][1], shadow[0][2], Math.round(shadow[0][3] / 2), true);
        }
      }
    }

    sctx.putImageData(data, 0, 0);
  }
};


//Render a hexal to the screen
//TODO: refactor with vcanvas AND chunks in mind
HexalEngine.prototype.render = function(h, ctx, modx, mody) {
  var x, y;
  //Do not draw the hexal if it is empty
  if (h.empty) { return; }

  modx = (typeof modx === "number" ? modx : 0);
  mody = (typeof mody === "number" ? mody : 0);

  //Calculate hexagon origin
  y = modx + this.hex.dy * (h.z + this.map.r) + (this.hex.skirt * (this.map.depth - 1 - h.d));
  x = mody + this.hex.dx * (h.x + this.map.r) + (this.hex.dx / 2) * h.z;

  //render hexagon
  ctx.drawImage(this.gfx.bases[h.baseType][1], x, y);

  //Apply Shadow
  // Never dips below 20% illumination; steady gradient
  if (h.d < this.ui.top) {
    ctx.globalAlpha = 0.8 * ((this.ui.top - h.d) / (this.gfx.renderDepth - 1));
    ctx.drawImage(this.gfx.bases.shadow[1], x, y);
    ctx.globalAlpha = 1;
  }

  //Draw Coordinates
  /*
  var str = "["+h.d+"]  ("+h.x+", "+h.y+", "+h.z+")";
  ctx.textAlign = "center";
  ctx.fillText(str, x + (this.hex.width / 2), y + (this.hex.height / 2));
  */
};


//Render the viewport
//Translation: [dx, dy] represents the edge(s) and their dimensions that need to be rerendered
//
HexalEngine.prototype.renderViewport = function() {
  var x = Math.max(0, Math.min(this.gfx.chunks.length - 1, Math.floor(-this.gfx.dx / this.gfx.chunkWidth))),
      mx = Math.max(0, Math.min(this.gfx.chunks.length - 1, x + Math.ceil(this.gfx.VCanvas.width / this.gfx.chunkWidth))),
      y = Math.max(0, Math.min(this.gfx.chunks[0].length - 1, Math.floor(-this.gfx.dy / this.gfx.chunkHeight))),
      my = Math.max(0, Math.min(this.gfx.chunks[0].length - 1, y + Math.ceil(this.gfx.VCanvas.height / this.gfx.chunkHeight))),
      i, j;

  this.gfx.vctx.clearRect(0, 0, this.gfx.VCanvas.width, this.gfx.VCanvas.height);

  for (i = x; i <= mx; i += 1) {
    for (j = y; j <= my; j += 1) {
      this.gfx.vctx.drawImage(
        this.gfx.chunks[i][j],
        this.gfx.chunkWidth*i + this.gfx.dx,
        this.gfx.chunkHeight*j + this.gfx.dy
      );
    }
  }
};


//Chunk
//Load chunks based on current gfx deltas
//
HexalEngine.prototype.chunk = function() {
  var fan = 0, i, j,
      x = Math.max(0, Math.min(
        this.gfx.chunks.length - 1,
        Math.floor(-this.gfx.dx / this.gfx.chunkWidth) - fan
      )),
      y = Math.max(0, Math.min(
        this.gfx.chunks[0].length - 1,
        Math.floor(-this.gfx.dy / this.gfx.chunkHeight) - fan
      )),
      mx = Math.max(0, Math.min(
        this.gfx.chunks.length - 1,
        Math.floor((this.gfx.VCanvas.width - this.gfx.dx) / this.gfx.chunkWidth) + fan
      )),
      my = Math.max(0, Math.min(
        this.gfx.chunks[0].length - 1,
        Math.floor((this.gfx.VCanvas.height - this.gfx.dy) / this.gfx.chunkHeight) + fan
      ));

  for (i = x; i <= mx; i += 1) {
    for (j = y; j <= my; j += 1) {
      if (this.gfx.chunks[i][j].chunkedat === this.ui.top) {
        continue;
      }
      this.gfx.chunks[i][j].chunkedat = this.ui.top;
      this.prepareChunk(i, j);
    }
  }
};


//Prepare Chunk
//Prerender a chunk of terrain.
//ax, ay array coordinates in gfx.chunks
//
HexalEngine.prototype.prepareChunk = function(ax, ay) {
  var chunk = this.gfx.chunks[ax][ay],
      ctx = chunk.getContext('2d'),
      modx = this.gfx.chunkWidth * ax,
      mody = this.gfx.chunkHeight * ay,
      xstep = Math.floor(this.hex.dx / 2),
      ystep = (this.hex.skirt > 0) ? this.GCD(this.hex.dy, this.hex.skirt) : this.hex.dy,
      mx = modx + this.gfx.chunkWidth + xstep,
      yoff = Math.max(this.hex.dy, this.hex.skirt),
      render = [], len, c, d, i, j, p, n, x, y, z, my, depth;

  for (i = 0; i < this.map.depth; i += 1) {
    len = this.map.r * 2 + 1;
    render[i] = [];
    for (j = 0; j < len; j += 1) {
      render[i][j] = [];
    }
  }

  //Sample for hexagons
  for (x = this.cubicToPx(this.pxToCubic([modx - xstep, mody - ystep]))[0]; x <= mx; x += xstep) {
    y = this.cubicToPx(this.pxToCubic([x, mody]))[1] + this.hex.a - yoff;
    my = mody + this.gfx.chunkHeight + yoff;

    while (y <= my) {
      //sample down
      p = null;
      for (depth = this.ui.top; depth >= 0; depth -= 1) {
        c = this.pxToCubic([x, y], depth);
        i = this.cubicToIndex(c);
        n = this.map.data[depth][i];
        if (n && !n.empty) {
          p = this.cubicToPx(c, depth);
          if (render[depth][n.z + this.map.r].indexOf(n) < 0) {
            render[depth][n.z + this.map.r].push(n);
          }
          break;
        }
      }

      if (p) {
        y = p[1] + (x > p[0] ? this.hex.height :  this.hex.dy);
      } else {
        y += ystep;
      }
    }
  }

  //Clear chunk canvas
  ctx.clearRect(0, 0, this.gfx.chunkWidth, this.gfx.chunkHeight);

  //Translate relative to chunk origin
  ctx.translate(-modx, -mody);

  //render new hexagons to region
  //for (var d = 0; d < render.length; d += 1) {
  for (d = this.map.depth - this.gfx.renderDepth; d < this.map.depth; d += 1) {
    for (z = 0; z < render[d].length; z += 1) {
      for (i = 0; i < render[d][z].length; i += 1) {
        this.render(render[d][z][i], ctx);//, this.gfx.dx, this.gfx.dy);
      }
    }
  }

  ctx.translate(modx, mody);
  //ctx.strokeRect(0, 0, this.gfx.chunkWidth, this.gfx.chunkHeight);
};


//Convert Hexagon Axial Coordinates to Hexagon Map Array Index
//[axial_x, axial_y, axial_z]
//
HexalEngine.prototype.cubicToIndex = function(a) {
  var x = Math.abs(a[0]),
      y = Math.abs(a[1]),
      z = Math.abs(a[2]),
      ring = Math.max(x, y, z);

  var prev_count = (ring < 2 ? ring : 3 * (ring * ring - ring) + 1);

  if (a[1] === -ring) { return prev_count + z; }
  if (a[2] === ring)  { return prev_count + ring + x; }
  if (a[0] === -ring) { return prev_count + 2 * ring + y; }
  if (a[1] === ring)  { return prev_count + 3 * ring + z; }
  if (a[2] === -ring) { return prev_count + 4 * ring + x; }
  if (a[0] === ring)  { return prev_count + 5 * ring + y; }
};


//Pixel Coordinates to Cubic
//Convert Cartesian Coordinates to Hexagon Axial Coordinates (Surface Hexagons)
//[cartesian_x, cartesian_y], depth
//Does NOT automatically factor in gfx.dx, gfx.dy.
//
HexalEngine.prototype.pxToCubic = function(a, d) {
  var vb, vbox, vboy, b, low, hx, hy, hz;

  d = (typeof d === "number" ? d : this.map.depth - 1);

  a[1] -= this.hex.skirt * (this.map.depth - 1 - d);

  // Upper relevent horizontal boundary between rows of hexagons
  vb = Math.floor((a[1]) / this.hex.dy);

  // vbox is x-origin of boundary.
  vbox = Math.abs(this.map.r - vb) * this.hex.dx / 2;

  // vboy is the peak's distance from x=0.
  vboy = vb * this.hex.dy;

  // height displacement at x from vb peak
  b = Math.abs(this.hex.dx / 4 - Math.ceil(Math.abs(a[0] - vbox) % this.hex.dx / 2));

  // calculate axial z if y-coordinate of boundary at x is greater
  if (a[1] < vboy + b) {
    vb -= 1;
    vbox = Math.abs(this.map.r - vb) * this.hex.dx / 2;
  }

  //l is lowest x for this hz
  low = -1 * Math.min(vb, this.map.r);

  hx = low + Math.floor((a[0] - vbox) / this.hex.dx);
  hz = vb - this.map.r;
  hy = 0 - hx - hz;

  return [hx, hy, hz];
};


//Axial Coordinates To Pixels
//Convert hexal array axial coordinates to cartesian pixel coordinates (origina of hexal)
//Does NOT factor gfx.dx, gfx.dy into calculation.
//
HexalEngine.prototype.cubicToPx = function(a, d) {
  d = (typeof d === "number" ? d : this.map.depth - 1);
  return [
    (this.hex.dx) * (a[0] + this.map.r) + (this.hex.dx / 2) * a[2],
    (this.hex.dy) * (a[2] + this.map.r) + (this.hex.skirt * (this.map.depth - 1 - d))
  ];
};


//Update logic for when the viewport changes dimensions
//Width and height in pixels of rendering canvases.
//Does not affect apparent size of canvases (CSS properties do this)
//
HexalEngine.prototype.windowResize = function(width, height) {
  // Chunk if the viewport got bigger
  if (width > this.gfx.VCanvas.offsetWidth || height > this.gfx.VCanvas.offsetHeight) {
    this.map.chunk();
  }

  this.gfx.VCanvas.width  = Math.floor(width / this.ui.scale[0]);
  this.gfx.VCanvas.height = Math.floor(height / this.ui.scale[1]);
  this.gfx.HCanvas.width  = Math.floor(width / this.ui.scale[0]);
  this.gfx.HCanvas.height = Math.floor(height / this.ui.scale[1]);

  this.ui.pan_bounds.x[1] = this.gfx.VCanvas.width / 2;
  this.ui.pan_bounds.x[0] = this.ui.pan_bounds.x[1] - (this.map.r * 2 + 1) * this.hex.dx;
  this.ui.pan_bounds.y[1] = this.gfx.VCanvas.height / 2;
  this.ui.pan_bounds.y[0] = this.ui.pan_bounds.y[1] - (this.map.r * 2 + 1) * this.hex.dy;
};


//Translate the map
//dx, dy pixels right and down
//d: integer change in depth
//
HexalEngine.prototype.pan = function(dx, dy, d) {
  dx = Math.round(dx / this.ui.scale[0]);
  dy = Math.round(dy / this.ui.scale[1]);
  d = (typeof d === 'number' ? Math.floor(d) : 0);

  if (!dx && !dy && !d) {
    return;
  }

  if (dx !== 0) {
    //Prevent dx from escaping bounds.
    if (this.gfx.dx + dx > this.ui.pan_bounds.x[1]) {
      this.gfx.dx = this.ui.pan_bounds.x[1];
    } else if (this.gfx.dx + dx < this.ui.pan_bounds.x[0]) {
      this.gfx.dx = this.ui.pan_bounds.x[0];
    } else {
      this.gfx.dx += dx;
    }
  }

  if (dy !== 0) {
    //Prevent dy from escaping bounds
    if (this.gfx.dy + dy > this.ui.pan_bounds.y[1]) {
      this.gfx.dy = this.ui.pan_bounds.y[1];
    } else if (this.gfx.dy + dy < this.ui.pan_bounds.y[0]) {
      this.gfx.dy = this.ui.pan_bounds.y[0];
    } else {
      this.gfx.dy += dy;
    }
  }

  if (d !== 0) {
    this.ui.top += d;
    if (this.ui.top < 0) {
      this.ui.top = 0;
    } else if (this.ui.top >= this.map.depth) {
      this.ui.top = this.map.depth - 1;
    }
  }

  this.chunk();
  this.renderViewport();
};


//Change the canvas scale in linear increments
//x_scale_increase, y_scale_increase
//
HexalEngine.prototype.zoom = function(x, y) {
  this.ui.scale[0] = Math.max(
    this.ui.scale_c[0][0],
    Math.min(this.ui.scale_c[0][1], this.ui.scale[0] + x)
  );
  this.ui.scale[1] = Math.max(
    this.ui.scale_c[1][0],
    Math.min(this.ui.scale_c[1][1], this.ui.scale[1] + y)
  );

  // ToDo: Standards complience calculation of width & height
  this.windowResize(this.gfx.VCanvas.offsetWidth, this.gfx.VCanvas.offsetHeight);
  if (x < 1 || y < 1) {
    this.chunk();
  }
  this.renderViewport();
};


//Select
//Take client coordinates, scale them, and return the selected hexal
// (Bug: scaling causes innacuracy despite compensation?)
HexalEngine.prototype.select = function(x, y) {
  x = Math.floor((x - this.gfx.dx) / this.ui.scale[0]);
  y = Math.floor((y - this.gfx.dy) / this.ui.scale[1]);
  return this.map.data[this.ui.top][this.cubicToIndex(this.pxToCubic([x, y]))];
};

//Get greatest common divisor of INTEGERS a and b
//TODO?: move to lib (along with IE shim, really)
HexalEngine.prototype.GCD = function(dividend, divisor) {
  var quotient, remainder;

  if (!Number.isInteger(dividend) || !Number.isInteger(divisor)) {
    console.error("Arguments must be integers");
    return;
  }
  dividend = Math.abs(dividend);
  divisor = Math.abs(divisor);

  if (dividend < divisor) {
    var tmp = dividend;
    dividend = divisor;
    divisor = tmp;
  }

  while (true) {
    quotient = Math.floor(dividend / divisor);
    remainder = dividend - quotient * divisor;
    if (remainder === 0) {
      return divisor;
    }

    dividend = divisor;
    divisor = remainder;
  }
};


//Hexal
//Hexal constructor
//
HexalEngine.prototype.Hexal = function(x, y, d, baseType, empty) {
  this.x = x;
  this.y = y;
  this.z = 0-x-y;
  this.d = d;
  this.i = HexalEngine.prototype.cubicToIndex([x, y, 0-x-y]);
  this.baseType = baseType || 'default';
  this.empty = empty || false;
};

//
// ☼ All craftgingership is of best quality! ☼
//
