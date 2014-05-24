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

var Game = {
  
  squareSize: 80,
  board: null,
  currentPlayer: 'white',
  
  initialize: function() {
    DrawEngine.initialize();
    document.setTitle('Starting...');
    this.setupBoard();
    this.setupBoardCanvas();
    this.setupPiecesCanvas();
    this.setupSelectionCanvas();
    this.boardCanvas.canvas.width = 
      this.boardCanvas.canvas.height =
      this.piecesCanvas.canvas.width =
      this.piecesCanvas.canvas.height =
      this.selectionCanvas.canvas.width =
      this.selectionCanvas.canvas.height = 8 * this.squareSize;
    this.setupDisplay();
    document.setTitle('');
  },
  
  setupBoard: function() {
    var board = new Array(8);
    for (var file = 8; file--;) board[file] = new Array(8);
    this.board = board;
    
    // starting position
    var pawnRank = 'PPPPPPPP', kingRank = 'RNBQKBNR';  // lower case = white pieces
    for (file = 8; file--;) {
      board[file][0] = kingRank[file].toLowerCase();
      board[file][1] = pawnRank[file].toLowerCase();
      board[file][6] = pawnRank[file];
      board[file][7] = kingRank[file];
    }
    this.board.needsUpdate = true;
  },
  
  setupBoardCanvas: function() {
    this.boardCanvas = Shapes.initCanvas('board');
  },
  
  setupPiecesCanvas: function() {
    this.piecesCanvas = Shapes.initCanvas('pieces');
  },
  
  setupSelectionCanvas: function() {
    this.selectionCanvas = Shapes.initCanvas('selection');
    this.selectionCanvas.canvas.onmousemove = this.boardMouseMove;
    this.selectionCanvas.canvas.onmouseout = this.boardMouseOut;
    this.selectionCanvas.canvas.onclick = this.boardClick;
    this.selectionCanvas.canvas.onmouseout();  // initialize
    this.selectionCanvas.canvas.board = this.board;
  },
  
  squareAtEventCoordinates: function(event) {
    var x = event.offsetX || event.layerX;
    var y = event.offsetY || event.layerY;
    return {
      file:     Math.floor(x / Game.squareSize),
      rank: 7 - Math.floor(y / Game.squareSize)
    };
  },
  
  boardMouseMove: function(event) {
    if (this.selectionFixed) return;
    var square = Game.squareAtEventCoordinates(event);
    var selectedSquare = this.selectedSquare;
    if (!selectedSquare ||
        square.rank != selectedSquare.rank ||
        square.file != selectedSquare.file) {
      this.selectedSquare = square;
      this.needsUpdate = true;
    }
  },
  
  boardMouseOut: function(event) {
    if (this.selectionFixed) return;
    this.selectedSquare = null;
    this.needsUpdate = true;
  },
  
  boardClick: function(event) {
    if (this.selectionFixed) {
      var board = this.board, targetSquare = Game.squareAtEventCoordinates(event);
      var selectedSquare = this.selectedSquare;
      if (selectedSquare &&
        targetSquare.rank === selectedSquare.rank &&
        targetSquare.file === selectedSquare.file) {
          this.selectionFixed = false;
          return;
      }
      var move = board.moves[targetSquare.file][targetSquare.rank];
      if (move) {
        var sourceSquare = this.selectedSquare;
        Game.movePiece(sourceSquare, targetSquare, move);
        this.selectionFixed = false;
        this.onmousemove(event);
        return;
      }
    }
    this.selectionFixed = false;
    this.onmousemove(event);
    this.selectionFixed = true;
  },
  
  movePiece: function(sourceSquare, targetSquare, move) {
    var piece = Game.board[sourceSquare.file][sourceSquare.rank];
    Game.board[sourceSquare.file][sourceSquare.rank] = null;
    if (move.promotion) {
      do {
        piece = prompt('Please choose a piece for promotion ' +
          '(q for Queen, r for Rook, b for Bishop, n for Knight):', 'q');
      } while (!piece.match(/^[qrbn]$/i));
      if (Game.currentPlayer == 'white')
        piece = piece.toLowerCase();
      else
        piece = piece.toUpperCase();
    }
    var target = Game.board[targetSquare.file][targetSquare.rank];
    Game.board[targetSquare.file][targetSquare.rank] = piece;
    Game.drawPieces(sourceSquare, targetSquare);
    if (target && target.match(/k/i)) {
      if (target === 'k') alert('Black wins.');
      if (target === 'K') alert('White wins.');
      Game.currentPlayer = null;
    }
    else {
      Game.currentPlayer = (Game.currentPlayer === 'white') ? 'black' : 'white';
    }
  },
  
  pieceBelongsToPlayer: function(piece, player) {
    return this.pieceBelongsToWhite(piece) === (player === 'white');
  },
  
  pieceBelongsToWhite: function(piece) {
    return ((piece.charCodeAt(0) & 32) === 32);
  },
  
  setupDisplay: function() {
    var game = this;
    game.drawBoard();
    game.drawPieces();
    DrawEngine.startLoop('pieces', function() {
      return game.drawSelection();
    }, 30);
  },
  
  drawBoard: function() {
    var ctx = this.boardCanvas;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'black';
    ctx.strokeStyle = 'transparent';
    for (var file = 8; file--;) {
      for (var rank = 8; rank--;) {
        var color = (file + rank) % 2 ? 'white' : 'black';
        ctx.shadowColor = (color === 'black') ? 'black' : 'transparent';
        ctx.fillStyle = color;
        ctx.drawSquare(file * Game.squareSize, (7 - rank) * Game.squareSize, Game.squareSize);
      }
    }
  },
  
  updateSelection: function(cursor) {
    var board = this.board;
    if (!board.moves) {
      board.moves = new Array(8);
      for (var file = 8; file--;) board.moves[file] = new Array(8);
    }
    for (var file = 8; file--;) {
      for (var rank = 8; rank--;) {
        board.moves[file][rank] = null;
      }
    }
    
    if (!cursor || !Game.currentPlayer) {
      board.hasMoves = false;
      return;
    }
    rank = cursor.rank;
    file = cursor.file;
    if (rank === undefined || file === undefined) return;
    if (rank > 7 || file > 7) return;
    var piece = board[file][rank];
    if (!piece || !Game.pieceBelongsToPlayer(piece, Game.currentPlayer)) {
      board.hasMoves = false;
      return;
    }
    
    var moves = Pieces.possibleMoves(piece, cursor, board);
    for (var i in moves) {
      var move = moves[i];
      board.moves[move.file][move.rank] = move;
    }
    board.hasMoves = moves.length > 0;
  },
  
  drawPieces: function() {
    var board = this.board;
    var ctx = this.piecesCanvas;
    
    ctx.shadowBlur = 8;
    if (arguments.length) {
      for (var i = 0; i < arguments.length; i++) {
        var square = arguments[i];
        var piece = board[square.file][square.rank];
        this.drawPiece(piece, square.file, square.rank, ctx);
      }
    }
    else {  // draw all pieces
      for (var file = 8; file--;) {
        for (var rank = 8; rank--;) {
          var piece = board[file][rank];
          this.drawPiece(piece, file, rank, ctx);
        }
      }
    }
  },
  
  drawPiece: function(piece, file, rank, canvas) {
    canvas.save();
    canvas.translate(file * Game.squareSize, (7 - rank) * Game.squareSize);
    canvas.clearRect(0, 0, Game.squareSize, Game.squareSize);
    if (piece) {
      canvas.shadowColor = (file + rank) % 2 ? 'black' : 'white';
      canvas.fillStyle = piece.search(/[A-Z]/) > -1 ? 'black' : 'white';
      canvas.zoom(Game.squareSize/45);
      Pieces.drawPiece(piece, canvas);
    }
    canvas.restore();
  },
  
  drawSelection: function() {
    var ctx = this.selectionCanvas;
    if (!ctx.canvas.needsUpdate) return 'skipped';
    ctx.clear();
    
    var cursor = ctx.canvas.selectedSquare;
    this.updateSelection(cursor);
    
    var board = this.board;
    for (var file = 8; file--;) {
      for (var rank = 8; rank--;) {
        // ctx.clearRect(file * Game.squareSize, (7 - rank) * Game.squareSize, Game.squareSize, Game.squareSize);
        var piece = board[file][rank];
        if (piece && board.hasMoves && rank == cursor.rank && file == cursor.file) {
          ctx.shadowBlur = 9;
          ctx.shadowColor = '#284';
          ctx.drawSquare(
            2.5 + file * Game.squareSize,
            2.5 + (7 - rank) * Game.squareSize,
            Game.squareSize - 5, 'transparent', ctx.shadowColor, 5);
        }
        var move = board.moves[file][rank];
        if (move) {
          ctx.shadowBlur = 9;
          ctx.lineWidth = 5;
          ctx.save();
          ctx.translate(
            Game.squareSize / 2 + file * Game.squareSize,
            Game.squareSize / 2 + (7 - rank) * Game.squareSize);
          if (move.capture) {
            ctx.shadowColor = ctx.strokeStyle = '#a22';
            // ctx.lineCap = 'butt';
            // ctx.drawLine(-15, -15,  30, 30);
            // ctx.drawLine( 15, -15, -30, 30);
          }
          else {
            ctx.shadowColor = ctx.strokeStyle = '#284';
          }
          ctx.drawCircle(0, 0, Game.squareSize / 5, 'transparent');
          if (move.promotion) {
            ctx.shadowColor = ctx.strokeStyle = 'gold';
            // ctx.globalAlpha = 0.3;
            ctx.drawCircle(0, 0, Game.squareSize / 5 - 4);
          }
          ctx.restore();
        }
      }
    }
    
    ctx.canvas.needsUpdate = false;
  }
}