import HexalEngine from 'hexal-core';

$(document).ready(function() {
  var canvas = $('#map');

  // Map instantiation
  // Adjust the indicated values to change the dimensions and appearance of the map.
  //
  var map = new HexalEngine({
    map: {
      depth: 5, //How deep the map is in hexagons
      r: 16     //Radius of the map in hexagons
    },
    hex: {
      size:  30,  //Radius of hexagons in pixels (not exact; +- 2)
      bord:   1,  //Thickness of border drawn on hexagons. 0 turns this off.
      skirt: 20   //Height of hexagons (along the same axis as depth) in pixels.
    },
    gfx: {
      VCanvas: canvas[0],  //Do Not Adjust. Reference to the <canvas> for rendering.
      renderDepth: 5
    }
  });

  window.map = map;

  //
  // UI
  //

  //Map Panning
  canvas.on('mousedown', function(event) {
    var ox = event.clientX;
    var oy = event.clientY;
    $(window).on('mousemove.pan', function(event) {
      map.pan(event.clientX - ox, event.clientY - oy);
      ox = event.clientX;
      oy = event.clientY;
    });
    $(window).one('mouseup', function() {
      $(window).off('mousemove.pan');
    });
  });

  $(window).on('keydown', function(event) {
    // Panning
    if (event.which == 37) {
      map.pan(100, 0);
    } else if (event.which == 38) {
      map.pan(0, 100);
    } else if (event.which == 39) {
      map.pan(-100, 0);
    } else if (event.which == 40) {
      map.pan(0, -100);
    } else if (event.which == 33) {
      map.pan(0, 0, 1);
    } else if (event.which == 34) {
      map.pan(0, 0, -1);
    }

    // Zooming
    else if (event.which == 107) {
      map.zoom(0.1, 0.1);
    } else if (event.which == 187 && event.shiftKey) {
      map.zoom(0.1, 0.1);
    } else if (event.which == 109) {
      map.zoom(-0.1, -0.1);
    } else if (event.which == 189) {
      map.zoom(-0.1, -0.1)
    }

    // Slicing
    else if (event.which == 188 && event.shiftKey) {
      map.pan(0, 0, 1);
    } else if (event.which == 190 && event.shiftKey) {
      map.pan(0, 0, -1);
    }
  })

  //Map Resizing
  var old = [canvas[0].offsetWidth, canvas[0].offsetHeight];
  $(window).on('resize', function() {
    if (canvas[0].offsetWidth != old[0] || canvas[0].offsetHeight != old[1]) {
      map.windowResize(canvas[0].offsetWidth, canvas[0].offsetHeight);
      old = [canvas[0].offsetWidth, canvas[0].offsetHeight];
      map.renderViewport();
    }
  });

  $('#toggle_fullscreen').one('click', function on() {
    let $this = $(this);
    let $body = $(document.body);

    $this.addClass('fs');
    canvas.addClass('fs');
    $body.addClass('fs');
    window.scrollTo(0, 0); // Prevent odd positioning bug

    map.windowResize(canvas[0].offsetWidth, canvas[0].offsetHeight);
    map.chunk();
    map.renderViewport();

    $this.one('click', function off() {
      $this.removeClass('fs');
      canvas.removeClass('fs');
      $body.removeClass('fs');

      map.windowResize(canvas[0].offsetWidth, canvas[0].offsetHeight);
      map.chunk();
      map.renderViewport();

      $this.one('click', on);
    });
  });
});