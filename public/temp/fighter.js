var Prototype = {
  Browser: {
    IE: !!(window.attachEvent && navigator.userAgent.indexOf('Opera') === -1),
    Opera:  navigator.userAgent.indexOf('Opera') > -1,
    WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
    Gecko:  navigator.userAgent.indexOf('Gecko') > -1 &&
      navigator.userAgent.indexOf('KHTML') === -1,
    MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
  }
};

var Fighter = {
  
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
  HEXAGON_SIZE: 42,  // length of a hexagon edge
  
  initialize: function() {
    DrawEngine.initialize();
    document.setTitle('Starting...');
    this.setupBackgroundCanvas();
    this.setupFighterCanvas();
    this.setupGridCanvas();
    this.setupSelectionCanvas();
    this.setupHexagon();
    this.deluxe = Prototype.Browser.WebKit;
    this.setupDisplay();
    document.setTitle('');
  },
  
  setupBackgroundCanvas: function() {
    this.background = Shapes.initCanvas('background', this.WIDTH, this.HEIGHT, 'black');
  },
  
  setupFighterCanvas: function() {
    this.fighter = Shapes.initCanvas('fighter', this.WIDTH, this.HEIGHT, 'transparent');
  },
  
  setupGridCanvas: function() {
    this.grid = Shapes.initCanvas('grid', this.WIDTH, this.HEIGHT, 'transparent');
  },
  
  setupSelectionCanvas: function() {
    this.selection = Shapes.initCanvas('selection', this.WIDTH, this.HEIGHT);
    this.selection.canvas.onmousemove = this.selectionMouseMove;
    this.selection.canvas.onmouseout = this.selectionMouseOut;
    this.selection.canvas.onclick = this.selectionClick;
    this.selection.canvas.test = this;
    this.selection.canvas.onmouseout();  // initialize
  },
  
  hexagonAtEventCoordinates: function(event) {
    var x = event.offsetX || event.layerX;
    var y = event.offsetY || event.layerY;
    return this.getHexagonCoordinates(x, y);
  },
  
  selectionMouseMove: function(event) {
    if (this.selectionFixed) return;
    var hexagon = Fighter.hexagonAtEventCoordinates(event);
    var selectedHexagon = this.context.selectedHexagon;
    if (!selectedHexagon ||
        hexagon.col !== selectedHexagon.col ||
        hexagon.row !== selectedHexagon.row) {
      this.context.selectedHexagon = hexagon;
      this.context.needsUpdate = true;
    }
  },
  
  selectionMouseOut: function(event) {
    if (this.selectionFixed) return;
    this.context.selectedHexagon = null;
    this.context.needsUpdate = true;
  },
  
  selectionClick: function(event) {
    if (this.selectionFixed) {
      var clickedHexagon = Fighter.hexagonAtEventCoordinates(event);
      var selectedHexagon = this.context.selectedHexagon;
      if (selectedHexagon &&
          clickedHexagon.col === selectedHexagon.col &&
          clickedHexagon.row === selectedHexagon.row) {
        this.selectionFixed = false;
        return;
      }
      var move = true;  // moves(clickedHexagon, selectedHexagon);
      if (move) {
        var sourceHexagon = this.context.selectedHexagon;
        // Game.movePiece(sourceHexagon, targetSquare, move);
        this.selectionFixed = false;
        this.onmousemove(event);
        this.selectionFixed = true;
        return;
      }
    }
    this.selectionFixed = false;
    this.onmousemove(event);
    this.selectionFixed = true;
  },
  
  setupHexagon: function() {
    this.PERFECT_HEXAGON = Math.sqrt(3) / 2;
    this.row_height = this.HEXAGON_SIZE * Math.sqrt(3);  // configure this!
    this.col_width = Math.round(this.row_height * this.PERFECT_HEXAGON);
    this.w = Math.ceil(this.col_width * 2 / 3);
    this.fac = (this.row_height / 2) / (this.col_width - this.w);
  },
  
  setupDisplay: function() {
    var test = this;
    test.initHexagonPattern();
    test.drawHexagonPattern();
    DrawEngine.startLoop('selection', test.updateSelection, 25);
    DrawEngine.startLoop('fighter', test.drawFighter, 25);
  },
  
  getHexagonCoordinates: function(col, row) {
    var hex_col = Math.floor(col / this.col_width);  // column size factor
    if (hex_col & 1) row -= Math.floor(this.row_height / 2);  // odd row offset
    var hex_row = Math.floor(row / this.row_height);  // row size factor
    
    // rectangle to hexagon magic
    var x = col % this.col_width;   // x inside the rectangle, from left
    if (x < 0) x += this.col_width;
    var y = row % this.row_height;  // y inside the rectangle, from top
    if (y < 0) y += this.row_height;
    if (x >= this.w) {
      x -= this.w;
      var yfac = y / this.fac;
      if (x > yfac) {
        hex_col += 1;
        if (hex_col & 1) hex_row -= 1;
      }
      yfac = (this.row_height - y) / this.fac;
      if (x >= yfac) {
        hex_col += 1;
        if ((hex_col & 1) == 0) hex_row += 1;
      }
    }
    
    return { col: hex_col, row: hex_row };
  },
    
  getPixelForHexagonCoordinates: function(col, row, selectedHexagon) {
    var parity = ((col & 1) * 2 + (row & 1));  // checkerboard

    var pixel = [
      { red: 0xee, green: 0xee, blue: 0xee },
      { red: 0xcc, green: 0xcc, blue: 0xcc },
      { red: 0xaa, green: 0xaa, blue: 0xaa },
      { red: 0x99, green: 0x99, blue: 0x99 }
    ][parity];  // color
    
    if (selectedHexagon && col == selectedHexagon.col && row == selectedHexagon.row) {
      pixel = { red: 255, green: 0, blue: 0 };  // current hexagon
    }
    
    return pixel;
  },
  
  initHexagonPattern: function() {
    var context = this.grid;
    context.clear();
    
    var hexSize = this.HEXAGON_SIZE;
    var colSize = hexSize * 1.5;
    var rowSize = 2 * hexSize * Math.sin(Math.PI / 3);
    if (!context.hexagon) {
      var sixtyDegrees = Math.PI/3;
      context.hexagon = function(x, y, full) {
        this.save();
        this.translate(x * colSize, y * rowSize);
        if (x % 2) this.translate(0, rowSize / 2);
        if (full === 'clear') {
          this.clearRect(
            -hexSize / 2 - 2, -3,
            hexSize * 2 + 4, rowSize + 6
          );
          this.restore();
          return;
        }
        this.beginPath();
        for (var i = full ? 6 : 3; i > 0; i--) {  // turtle time!
          this.moveTo(0, 0);
          this.translate(hexSize, 0);
          this.lineTo(0, 0);
          if (i > 1) this.rotate(sixtyDegrees);
        }
        this.stroke();
        this.restore();
      };
      this.selection.hexagon = context.hexagon;
    }
  },
  
  drawHexagonPattern: function() {
    var context = this.grid;
    context.clear();
    
    var hexSize = this.HEXAGON_SIZE;
    var colSize = hexSize * 1.5;
    var rowSize = 2 * hexSize * Math.sin(Math.PI / 3);
    
    // grid
    var sizeX = Math.ceil(context.canvas.width / colSize);
    var sizeY = Math.ceil(context.canvas.height / rowSize);
    context.save();
    context.lineWidth = 1;
    context.strokeStyle = 'lime';
    for (var x = -1; x < sizeX; x++) {
      for (var y = -1; y < sizeY; y++) {
        context.hexagon(x, y);
      }
    }
    context.restore();
  },
  
  updateSelection: function(frame, frames) {
    var context = Fighter.selection;
    // if (!context.needsUpdate) return 'skipped';
    
    // remove old hexagon
    var oldSelectedHexagon = context.oldSelectedHexagon;
    if (oldSelectedHexagon) {
      context.hexagon(oldSelectedHexagon.col, oldSelectedHexagon.row, 'clear');
      context.oldSelectedHexagon = null;
    }
    
    // draw selected hexagon
    var selectedHexagon = context.selectedHexagon;
    if (selectedHexagon) {
      var pulse = 1 + Math.sin(Math.PI * 2 * (frame / frames.maxFPS)) / 2;
      context.lineWidth = 1 + pulse;
      context.strokeStyle = 'hsl(120,100%,' + (60 + 40 * pulse) + '%)';
      context.hexagon(selectedHexagon.col, selectedHexagon.row, true);
      context.oldSelectedHexagon = selectedHexagon;
    }
    
    context.needsUpdate = false;
  },
  
  drawFighter: function(frame, frames) {
    var context = Fighter.fighter;
    if (Fighter.deluxe) {
      context.fillStyle = 'hsla(0,0%,0%,0.3)';
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      // context.clear();
    }
    else {
      context.clear();
    }
    
    if (!context.drawWarpGondolaAt) {
      context.drawWarpGondolaAt = function(x, y, rot) {
        this.save();
        this.translate(x, y);
        this.rotate(rot);
        this.fillStyle = 'gray';
        this.drawCircle(0, -3, 0.5);
        this.fillRect(-0.6, -3, 1.2, 8);
        this.fillStyle = 'hsla(250,100%,50%,1)';
        this.fillRect(-0.2, -3, 0.4, 8);
        this.restore();
      };
      context.drawFighterBodyAt = function(x, y) {
        this.fillStyle = 'silver';
        this.strokeStyle = 'gray';
        this.lineWidth = 0.5;
        this.beginPath();
        this.moveTo(0, -1);
        this.lineTo(-4.5, -2);
        this.lineTo(-3.5, 2);
        this.lineTo(0, 3);
        this.lineTo(3.5, 2);
        this.lineTo(4.5, -2);
        this.lineTo(0, -1);
        this.fill();
        this.stroke();
        this.strokeStyle = 'transparent';
        this.fillStyle = 'hsla(250,100%,50%,1)';
        this.save();
          this.strokeStyle = 'gray';
          this.lineWidth = 0.3;
          this.scale(1, 3);
          this.drawCircle(0, -0.2, 1);
        this.restore();
        this.fillRect(-2.6, -2.2, 0.2, 2);
        this.fillRect(-2.1, -2.1, 0.2, 2);
        this.fillRect( 1.9, -2.1, 0.2, 2);
        this.fillRect( 2.4, -2.2, 0.2, 2);
      };
      context.drawFighterMoving = function(a, b, c, frame, frames) {
        this.save();
          var pulse1 = (1 + Math.sin(c + frame / frames.maxFPS * a)) / 2;
          var pulse2 = (1 + Math.cos(c + frame / frames.maxFPS * b)) / 2;
          this.strokeStyle = 'transparent';
          this.translate(pulse1 * this.canvas.width, pulse2 * this.canvas.height);
          this.zoom(5);
          this.rotate((frame / frames.maxFPS) * c);
          this.drawFighterBodyAt(0, 0);
          this.drawWarpGondolaAt(-4, 0, -0.2);
          this.drawWarpGondolaAt( 4, 0,  0.2);
        this.restore();
      };
    }
    
    frame /= 5;
    context.drawFighterMoving(1.2, 1.4, 1, frame, frames);
    context.drawFighterMoving(-1.1, -0.6, 7, frame, frames);
    context.drawFighterMoving(-0.4, 1.9, 0.2, frame, frames);
    context.drawFighterMoving(0.5, 0.5, 1.4, frame, frames);
    context.drawFighterMoving(1.2, -0.5, 6, frame, frames);
    context.drawFighterMoving(1.0, 1.2, 4, frame, frames);
    context.drawFighterMoving(-0.4, 0.7, 3.2, frame, frames);
    context.drawFighterMoving(-0.6, -1.1, 2.4, frame, frames);
    context.drawFighterMoving(1.1, -0.8, -1, frame, frames);
    context.drawFighterMoving(-0.5, 1.1, 3, frame, frames);
    context.drawFighterMoving(-1.5, -0.8, -2, frame, frames);
    context.drawFighterMoving(-0.7, 0.2, 2, frame, frames);
  }
  
};