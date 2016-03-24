//Fractal Terrain Generator.
//exp: 2^exp == terragen dimensions. Use exp such that 2^exp >= map.n
TerraGen = function(exp) {
  this.n = Math.pow(2, exp);
}

//Fractal Terrain Generator
//returns heightmap
TerraGen.prototype.get = function() {
  var min = 1, max = 0;
  var hm = []; //[x][y] = [x, y, mag]
  for (var x = 0, m = this.n*2 + 1; x < m; x++) {
    hm[x] = [];
  }
  
  var corners = [
    [0,        this.n*2, hm[0][this.n*2] = Math.random()],
    [0,        this.n,   hm[0][this.n] = Math.random()],
    [this.n,   0,        hm[this.n][0] = Math.random()],
    [this.n*2, 0,        hm[this.n*2][0] = Math.random()],
    [this.n*2, this.n,   hm[this.n*2][this.n] = Math.random()],
    [this.n,   this.n*2, hm[this.n][this.n*2] = Math.random()]
  ];

  var center = [this.n, this.n, hm[this.n][this.n] = Math.random()];
  
  var triangles = [];
  //initialize triangles
  for (var i = 0; i < 6; i++) {
    if (corners[i][2] > max) { max = corners[i][2]; }
    else if (corners[i][2] < min) { min = corners[i][2]; }
    triangles.push([center, corners[i], corners[(i + 1) % 6]]);
  }

  //console.log(triangles.slice(0, 6));
  
  var tri, mag = 0.7;
  var debug = 0;
  while (tri = triangles.shift()) {
    var m = [];
    for (var i = 0; i < 3; i++) {    
      var p1, p2, p3;
      p1 = tri[i];
      p2 = tri[(i + 1) % 3];
      p3 = tri[(i + 2) % 3];
      
      m[i] = [
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2,
        (1 - mag) * ( 0.4*(p1[2] + p2[2]) + 0.2*p3[2] ) + mag*(Math.random())
      ];
      hm[m[i][0]][m[i][1]] = m[i][2];
      
      if (tri[i][2] > max) { max = tri[i][2]; }
      else if (tri[i][2] < min) { min = tri[i][2]; }
      if (m[i][2] > max) { max = m[i][2]; }
      else if (m[i][2] < min) { min = m[i][2]; }
    }

    //console.log(debug++, tri, m);
    
    //Triangle cannot be divided further
    if (Math.abs(tri[0][0] - m[0][0]) <= 1) {
      continue;
    }
    
    triangles.push([tri[0], m[0], m[2]]);
    triangles.push([m[0], tri[1], m[1]]);
    triangles.push([m[2], m[1], tri[2]]);
    triangles.push([m[1], m[2], m[0]]);
  }
  
  return [hm, min, max];
}