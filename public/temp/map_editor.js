// browser engine detection
var Prototype = {
  Browser: {
    IE:     !!(window.attachEvent &&
      navigator.userAgent.indexOf('Opera') === -1),
    Opera:  navigator.userAgent.indexOf('Opera') > -1,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 &&
      navigator.userAgent.indexOf('KHTML') === -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
  }
};

document.setTitle = function(text) {
  this.title = this.originalTitle + text;
}
document.originalTitle = document.title;

DrawEngine = {
  initialize: function() {
    setInterval(this.fps, 1000);
  },
  fps: (function() {
    function fps() {
      var text = ' - ';
      for (taskName in fps.frames) {
        text += taskName + ': ' + fps.frames[taskName] + ' fps ';
        fps.frames[taskName] = 0;
      }
      // if (fps.max) text += ' (of ' + fps.max + ')';
      document.setTitle(text);
    }
    fps.frames = [];
    fps.max = 30;
    fps.pause = false;
    return fps;
  })(),
  startLoop: function(name, callback, maxFPS) {
    var fps = this.fps;
    if (!maxFPS) maxFPS = fps.max;
    fps.frames[name] = 0;
    setInterval(function() {
      if (!fps.pause) callback();
      fps.frames[name]++;
    }, 1000 / maxFPS);
  }
}

var Game = {
  
  name: 'Map Editor Demo',
  
  offset: { x: 0, y: 0 },
  
  initialize: function() {
    DrawEngine.initialize();
    document.setTitle('Starting...');
    this.setupKeyControls();
    this.display = Shapes.initCanvas('display');
    this.displaySprites = Shapes.initCanvas('sprites');
    this.minimap = Shapes.initCanvas('minimap');
    this.minimapSprites = Shapes.initCanvas('minimap-sprites');
    this.minimapSelection = Shapes.initCanvas('minimap-selection');
    this.map = Game.initMap({
      width: 80, height: 60,
      base: ['navajowhite', 'blanchedalmond']
      // base: ['yellowgreen', 'silver']
    });
    this.setupMapEditor();
    this.setupDisplay();
    this.setupSprites(100);
    document.setTitle('');
  },
  
  setupSprites: function(spriteCount) {
    this.sprites = [];
    var maxSpeed = 0.1;
    var minSpeed = 0.05;
    for (var i = 0; i < spriteCount; i++) {
      var speed = Random.nextFraction() * (maxSpeed - minSpeed) + minSpeed;
      var dir = Random.nextInRange(-Math.PI, Math.PI);
      this.sprites[i] = {
        x: Random.next(this.map.width),
        y: Random.next(this.map.height),
        dx: speed * Math.cos(dir),
        dy: speed * Math.sin(dir),
        color: ['red', 'lime', 'blue'][Random.next(3)]
      }
    };
    
    // draw map
    DrawEngine.startLoop('map-sprites', function() {
      Game.drawMinimapSprites();
    }, 10);  //Prototype.Browser.WebKit ? null : 5);
    DrawEngine.startLoop('sprites', function() {
      Game.drawDisplaySprites();
    });
    DrawEngine.startLoop('move-sprites', function() {
      Game.moveSprites();
    });
  },
  
  setupKeyControls: function() {
    window.onkeypress = function(event) {
      switch (event.keyCode) {
        case 37:    // left
        case 38:    // up
        case 39:    // right
        case 40: {  // down
          window.onkeydown(event, true);
        }
      }
    };
    window.onkeydown = function(event, pressed) {
      if (Prototype.Browser.WebKit) pressed = true;
      var radius = document.getElementById('radius');
      switch (event.which || event.keyCode) {
        case 32: {  // space
          DrawEngine.fps.pause = !DrawEngine.fps.pause;
          break;
        }
        case 13: {  // return
          break;
        }
        case 43: {  // +
          if (radius.value < 30) radius.value++;
          break;
        }
        case 45: {  // -
          if (radius.value > 1) radius.value--;
          break;
        }
        case 48: {  // 0
          radius.value = 20;
          break;
        }
        case 37: {  // left
          if (pressed && Game.offset.x > 0) Game.offset.x--;
          break;
        }
        case 39: {  // right
          if (pressed && Game.offset.x < 60) Game.offset.x++;
          break;
        }
        case 38: {  // up
          if (pressed && Game.offset.y > 0) Game.offset.y--;
          break;
        }
        case 40: {  // down
          if (pressed && Game.offset.y < 45) Game.offset.y++;
          break;
        }
        default: {
          if (event.keyCode >= 49 && event.keyCode <= 57) {
            radius.value = (event.keyCode - 48) * 2 - 1;
          }
          else document.title += ' ' + event.keyCode;
        }
      }
    }
  },
  
  initMap: function(options) {
    var map = [];
    if (options.copy) {
      options.height = options.copy.height;
      options.width = options.copy.width;
    }
    map.height = options.height;
    map.width = options.width;
    map.base = options.base;
    for (var row = 0; row < map.height; row++) {
      var newRow = []
      for (var column = 0; column < map.width; column++) {
        newRow[column] = map.base ? Random.nextElement(map.base) : null;
      }
      map[row] = newRow;
    };
    return map;
  },

  setupMapEditor: function() {
    var map = this.map;
    var ctx = this.minimapSelection;

    // draw map
    DrawEngine.startLoop('map', function() {
      Game.drawMinimap();
    });
    DrawEngine.startLoop('map-selection', function() {
      Game.drawMinimapSelection();
    });

    // track mouse button
    var mouseDown = false;
    ctx.canvas.onmousedown = function(event) {
      mouseDown = true;
      ctx.canvas.onmousemove(event);
    };
    ctx.canvas.onmouseup = ctx.canvas.onmouseout = function(event) {
      mouseDown = false;
    };

    // tracke mouse movement
    var color = 'yellowgreen';
    ctx.canvas.onmousemove = function(event) {
      if (!mouseDown) return;
      var click = {
        x: event.offsetX || event.layerX - this.style.left,
        y: event.offsetY || event.layerY - this.style.top
      };

      var radius = parseInt(document.getElementById('radius').value);
      // document.setTitle('x: ' + click.x + ', y: ' + click.y);
      if (radius > 30) radius = 30;
      else if (radius < 1) radius = 1;

      for (var x = -radius; x <= radius; x++) {
        for (var y = -radius; y <= radius; y++) {
          if (x*x + y*y < radius*radius) {
            var column = Math.floor((click.x + x) / 5);
            var row = Math.floor((click.y + y) / 5);
            if (map[row] && map[row][column]) map[row][column] = color;
          }
        }
      }
      Game.display.fresh = Game.minimap.fresh = false;
    };

    function setColor(event) {
      color = this.style.backgroundColor;
    }
    var brushChoices = document.getElementById('brush-choices');
    for (var i in brushChoices.children) {
      var button = brushChoices.children[i];
      if (button.tagName != 'LI') continue;
      // button.color = button.className;
      button.style.backgroundColor = button.className;
      button.onclick = setColor;
    };

  },

  setupDisplay: function() {
    DrawEngine.startLoop('display', function() {
      Game.draw();
    });
  },

  drawMinimap: function() {
    var map = this.map;
    if (this.minimap.fresh) return;
    var ctx = this.minimap;
    if (ctx.oldMap == undefined) {
      ctx.oldMap = Game.initMap({ copy: map, base: null });
    }
    for (var row = 0; row < map.length; row++) {
      for (var column = 0; column < map[row].length; column++) {
        var color = map[row][column];
        var oldColor = ctx.oldMap[row][column];
        if (color == oldColor) continue;
        ctx.drawSquare(0.5 + column * 5, 0.5 + row * 5, 5, color, 'gray', 0.2);
        ctx.oldMap[row][column] = color;
      }
    }
    this.minimap.fresh = true;
  },

  drawMinimapSelection: function() {
    ctx = this.minimapSelection;
    // offset changed?
    if (ctx.oldOffset === undefined) {
      ctx.oldOffset = { x: -1, y: -1 };
    }
    var offset = Game.offset;
    if (ctx.oldOffset.x == offset.x && ctx.oldOffset.y == offset.y) return;
    ctx.oldOffset.x = offset.x;
    ctx.oldOffset.y = offset.y;
    ctx.clear();
    ctx.drawRect(0.5 + offset.x * 5, 0.5 + offset.y * 5, 100, 75,
      'transparent', 'black');
    // document.title += ',';
  },
  
  drawMinimapSprites: function() {
    var sprites = this.sprites;
    var ctx = this.minimapSprites;
    ctx.clear();
    
    // clear
    // if (!ctx.oldSprites) ctx.oldSprites = [];
    // for (var i = 0; i < ctx.oldSprites.length; i++) {
    //   var sprite = ctx.oldSprites[i];
    //   ctx.clearRect(sprite.x * 5, sprite.y * 5, 5, 5);
    // };
    
    // draw
    for (var i = 0; i < sprites.length; i++) {
      var sprite = sprites[i];
      ctx.fillStyle = sprite.color;
      ctx.fillRect(2 + sprite.x * 5, 2 + sprite.y * 5, 2, 2);
      // ctx.oldSprites[i] = { x: sprite.x, y: sprite.y };
    };
  },
  
  moveSprites: function() {
    var sprites = this.sprites;
    var max = { x: this.map.width - 1, y: this.map.height - 1 };
    for (var i = 0; i < sprites.length; i++) {
      var sprite = sprites[i];
      // move
      sprite.x += sprite.dx;
      sprite.y += sprite.dy;
      // bounce
      if (sprite.x < 0) {
        sprite.dx = -sprite.dx;
        sprite.x = -sprite.x;
      }
      else if (sprite.x > max.x) {
        sprite.dx = -sprite.dx;
        sprite.x = 2 * max.x - sprite.x;
      }
      if (sprite.y < 0) {
        sprite.dy = -sprite.dy;
        sprite.y = -sprite.y;
      }
      else if (sprite.y > max.y) {
        sprite.dy = -sprite.dy;
        sprite.y = 2 * max.y - sprite.y;
      }
    };
  },
  
  drawDisplaySprites: function() {
    var sprites = this.sprites;
    var ctx = this.displaySprites;
    ctx.clear();
    
    var offset = Game.offset;
    
    // clear
    // if (!ctx.oldSprites) ctx.oldSprites = [];
    // for (var i = 0; i < ctx.oldSprites.length; i++) {
    //   var sprite = ctx.oldSprites[i];
    //   if (!sprite) document.title += i;
    //   var x = sprite.x - offset.x;
    //   if (x < 0 || x >= 20) continue;
    //   var y = sprite.y - offset.y;
    //   if (y < 0 || y >= 15) continue;
    //   ctx.clearRect(x * 40, y * 40, 40, 40);
    // };
    
    for (var i = 0; i < sprites.length; i++) {
      var sprite = sprites[i];
      // ctx.oldSprites[i] = { x: sprite.x, y: sprite.y };
      var x = sprite.x - offset.x;
      if (x < -1 || x >= 20) continue;
      var y = sprite.y - offset.y;
      if (y < -1 || y >= 15) continue;
      ctx.drawCircle(
        20 + x * 40, 20 + y * 40,
        10, sprite.color, 'black', 2);
    };
  },
  
  draw: function() {
    var map = this.map;
    var ctx = this.display;
    
    // offset changed?
    if (ctx.oldOffset === undefined) {
      ctx.oldOffset = { x: -1, y: -1 };
    }
    var offset = Game.offset;
    if (ctx.oldOffset.x != offset.x || ctx.oldOffset.y != offset.y) {
      ctx.oldOffset.x = offset.x;
      ctx.oldOffset.y = offset.y;
      var redraw = true;
      this.display.fresh = false;
    }

    if (this.display.fresh) return;

    // map cache
    if (ctx.oldMap === undefined) {
      ctx.oldMap = Game.initMap({ copy: map, base: null });
    }

    // draw map
    for (var row = 0; row < 15; row++) {
      for (var column = 0; column < 20; column++) {
        var color = map[row + offset.y][column + offset.x];
        if (!redraw) {
          var oldColor = ctx.oldMap[row + offset.y][column + offset.x];
          if (color == oldColor) continue;
        }
        ctx.globalAlpha = 1;
        ctx.drawSquare(column * 40, row * 40, 40, color, 'transparent');
        ctx.globalAlpha = 0.3;
        ctx.drawSquare(0.5 + column * 40, 0.5 + row * 40, 39,
          'transparent', 'black', 1);
        ctx.oldMap[row + offset.y][column + offset.x] = color;
      }
    }
    // document.title += '.';
    this.display.fresh = true;
  }
}

setTimeout(function() {
  Game.initialize();
}, 100);  // wait for dom load