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

var Test = {
  
  WIDTH: window.innerWidth,
  HEIGHT: window.innerHeight,
  HEXAGON_SIZE: 42,  // length of a hexagon edge
  
  initialize: function() {
    DrawEngine.initialize();
    document.setTitle('Starting...');
    this.setupPanelCanvas();
    this.setupGridCanvas();
    this.setupSelectionCanvas();
    this.setupHexagon();
    this.setupDisplay();
    document.setTitle('');
  },
  
  setupPanelCanvas: function() {
    this.panel = Shapes.initCanvas('panel', this.WIDTH, this.HEIGHT, 'black');
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
    var hexagon = Test.hexagonAtEventCoordinates(event);
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
      var clickedHexagon = Test.hexagonAtEventCoordinates(event);
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
    DrawEngine.startLoop('hex', test.updateSelection, 20);
  },
  
  drawHexagons: function() {
    var context = this.panel;
    context.clear();
    
    var imageData = context.createImageData(this.WIDTH, this.HEIGHT);
    var data = imageData.data;
    var selectedHexagon = this.selection.selectedHexagon;
    var i = 0;
    var x = 0, y = 0;
    for (var y = 0; y < this.HEIGHT; y++) {
      for (var x = 0; x < this.WIDTH; x++) {
        var coordinates = this.getHexagonCoordinates(x, y);
        var pixel = this.getPixelForHexagonCoordinates(coordinates.col, coordinates.row, selectedHexagon);
        data[i++] = pixel.red;    // red
        data[i++] = pixel.green;  // green
        data[i++] = pixel.blue;   // blue
        data[i++] = 255; // alpha
      }
    }
    
    context.rotate(Math.PI / 3);
    context.putImageData(imageData, 0, 0);
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
  
  updateSelection: function(frame, frames, max) {
    var context = Test.selection;
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
  }
  
};