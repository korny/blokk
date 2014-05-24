Pieces = {
  
  sameColor: function(piece1, piece2) {
    return (piece1.charCodeAt(0) & 32) == (piece2.charCodeAt(0) & 32);
  },
  
  enemyColor: function(piece1, piece2) {
    return !this.sameColor(piece1, piece2);
  },
  
  makePromotionMoves: function(moves, promotions) {
    var promotionMoves = [];
    for (var i in moves) {
      var move = moves[i];
      for (var p in promotions) {
        promotionMoves.push(
          { file: move.file, rank: move.rank, promotion: promotions[p] }
        );
      }
    }
    return promotionMoves;
  },
  
  makeRookMoves: function(cursor, board) {
    var moves = [];
    
    var rank, file;
    for (file = cursor.file + 1; file <= 7; file++) {
      moves.push({ file: file - cursor.file, rank: 0 });
      if (board[file][cursor.rank]) break;
    }
    for (file = cursor.file - 1; file >= 0; file--) {
      moves.push({ file: file - cursor.file, rank: 0 });
      if (board[file][cursor.rank]) break;
    }
    for (rank = cursor.rank + 1; rank <= 7; rank++) {
      moves.push({ file: 0, rank: rank - cursor.rank });
      if (board[cursor.file][rank]) break;
    }
    for (rank = cursor.rank - 1; rank >= 0; rank--) {
      moves.push({ file: 0, rank: rank - cursor.rank });
      if (board[cursor.file][rank]) break;
    }
    
    return moves;
  },
  
  makeBishopMoves: function(cursor, board) {
    var moves = [];
    
    var offset;
    for (offset = 1; cursor.file + offset <= 7 && cursor.rank + offset <= 7; offset++) {
      moves.push({ file: +offset, rank: +offset });
      if (board[cursor.file + offset][cursor.rank + offset]) break;
    }
    for (offset = 1; cursor.file + offset <= 7 && cursor.rank - offset >= 0; offset++) {
      moves.push({ file: +offset, rank: -offset });
      if (board[cursor.file + offset][cursor.rank - offset]) break;
    }
    for (offset = 1; cursor.file - offset >= 0 && cursor.rank + offset <= 7; offset++) {
      moves.push({ file: -offset, rank: +offset });
      if (board[cursor.file - offset][cursor.rank + offset]) break;
    }
    for (offset = 1; cursor.file - offset >= 0 && cursor.rank - offset >= 0; offset++) {
      moves.push({ file: -offset, rank: -offset });
      if (board[cursor.file - offset][cursor.rank - offset]) break;
    }
    
    return moves;
  },
  
  possibleMoves: function(piece, cursor, board) {
    var moves = [];
    var occupant;
    
    // TODO: check?
    switch (piece) {
    
    case 'P':  // black pawn
      // TODO: en passant
      if (cursor.rank == 7) console.error('Black pawn on 1st rank.')
      occupant = board[cursor.file][cursor.rank - 1];
      if (!occupant) {
        moves = [{ file: 0, rank: -1 }];
        if (cursor.rank == 6) {
          occupant = board[cursor.file][cursor.rank - 2];
          if (!occupant) moves.push({ file: 0, rank: -2 });
        }
      }
      if (cursor.file > 0) {
        occupant = board[cursor.file - 1][cursor.rank - 1];
        if (occupant && Pieces.enemyColor(piece, occupant)) moves.push({ file: -1, rank: -1 });
      }
      if (cursor.file < 7) {
        occupant = board[cursor.file + 1][cursor.rank - 1];
        if (occupant && Pieces.enemyColor(piece, occupant)) moves.push({ file: +1, rank: -1 });
      }
      if (cursor.rank == 1)
        moves = this.makePromotionMoves(moves, 'QRBN');
      break;
      
    case 'p':  // white pawn
      // TODO: en passant
      if (cursor.rank == 7) console.error('White pawn on 8th rank.')
      occupant = board[cursor.file][cursor.rank + 1];
      if (!occupant) {
        moves = [{ file: 0, rank: +1 }];
        if (cursor.rank == 1) {
          occupant = board[cursor.file][cursor.rank + 2];
          if (!occupant) moves.push({ file: 0, rank: +2 });
        }
      }
      if (cursor.file > 0) {
        occupant = board[cursor.file - 1][cursor.rank + 1];
        if (occupant && Pieces.enemyColor(piece, occupant)) moves.push({ file: -1, rank: +1 });
      }
      if (cursor.file < 7) {
        occupant = board[cursor.file + 1][cursor.rank + 1];
        if (occupant && Pieces.enemyColor(piece, occupant)) moves.push({ file: +1, rank: +1 });
      }
      if (cursor.rank == 6)
        moves = this.makePromotionMoves(moves, 'qrbn');
      break;
      
    case 'N':  // black knight
    case 'n':  // white knight
      moves = [
        { file: +2, rank: +1 },
        { file: +2, rank: -1 },
        { file: +1, rank: +2 },
        { file: +1, rank: -2 },
        { file: -1, rank: +2 },
        { file: -1, rank: -2 },
        { file: -2, rank: +1 },
        { file: -2, rank: -1 }
      ];
      break;
      
    case 'R':  // black rook
    case 'r':  // white rook
      moves = this.makeRookMoves(cursor, board);
      break;
    
    case 'B':  // black bishop
    case 'b':  // white bishop
      moves = this.makeBishopMoves(cursor, board);
      break;
    
    case 'q':  // white queen
    case 'Q':  // black queen
      moves = this.makeBishopMoves(cursor, board);
      moves = moves.concat(this.makeRookMoves(cursor, board));
      break;
      
    case 'k':  // white king
    case 'K':  // black king
      // TODO: castling
      moves = [
        { file: +1, rank: +1 },
        { file: +1, rank:  0 },
        { file: +1, rank: -1 },
        { file:  0, rank: +1 },
        { file:  0, rank: -1 },
        { file: -1, rank: +1 },
        { file: -1, rank:  0 },
        { file: -1, rank: -1 }
      ];
      break;
      
    }
    
    var possibleMoves = [];
    for (var i in moves) {
      var move = moves[i];
      var target_file = cursor.file + move.file;
      if (target_file < 0 || target_file > 7) continue;
      var target_rank = cursor.rank + move.rank;
      if (target_rank < 0 || target_rank > 7) continue;
      var occupant = board[target_file][target_rank];
      if (occupant) {
        if (Pieces.sameColor(occupant, piece)) continue;
        else move.capture = true;
      }
      else move.capture = false;
      possibleMoves.push({
        file: target_file,
        rank: target_rank,
        capture: move.capture,
        promotion: move.promotion
      });
    }
    return possibleMoves;
  },
  
  drawPiece: function(piece, ctx) {
    ctx.strokeStyle = 'black';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    switch (piece) {
    
    case 'P':  // black pawn
    case 'p':  // white pawn
      ctx.translate(45/80, 0);
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 22 9 C 19.792 9 18 10.792 18 13 C 18 13.885103 18.29397 14.712226 18.78125 15.375 C 16.829274 16.496917 15.5 18.588492 15.5 21 C 15.5 23.033947 16.442042 24.839082 17.90625 26.03125 C 14.907101 27.08912 10.5 31.578049 10.5 39.5 L 33.5 39.5 C 33.5 31.578049 29.092899 27.08912 26.09375 26.03125 C 27.557958 24.839082 28.5 23.033948 28.5 21 C 28.5 18.588492 27.170726 16.496917 25.21875 15.375 C 25.70603 14.712226 26 13.885103 26 13 C 26 10.792 24.208 9 22 9 z');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 22 9 C 19.792 9 18 10.792 18 13 C 18 13.885103 18.29397 14.712226 18.78125 15.375 C 16.829274 16.496917 15.5 18.588492 15.5 21 C 15.5 23.033947 16.442042 24.839082 17.90625 26.03125 C 14.907101 27.08912 10.5 31.578049 10.5 39.5 L 33.5 39.5 C 33.5 31.578049 29.092899 27.08912 26.09375 26.03125 C 27.557958 24.839082 28.5 23.033948 28.5 21 C 28.5 18.588492 27.170726 16.496917 25.21875 15.375 C 25.70603 14.712226 26 13.885103 26 13 C 26 10.792 24.208 9 22 9 z');
      break;
    
    case 'R':  // black rook
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z ');
      ctx.drawSVGPath('M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ');
      ctx.drawSVGPath('M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z ');
      ctx.drawSVGPath('M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z ');
      ctx.drawSVGPath('M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z ');
      ctx.drawSVGPath('M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ');
      ctx.drawSVGPath('M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z ');
      ctx.drawSVGPath('M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ');
      ctx.drawSVGPath('M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z ');
      ctx.drawSVGPath('M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z ');
      ctx.drawSVGPath('M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z ');
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.drawSVGPath('M 12,35.5 L 33,35.5 L 33,35.5');
      ctx.drawSVGPath('M 13,31.5 L 32,31.5');
      ctx.drawSVGPath('M 14,29.5 L 31,29.5');
      ctx.drawSVGPath('M 14,16.5 L 31,16.5');
      ctx.drawSVGPath('M 11,14 L 34,14');
      break;
    
    case 'r':  // white rook
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14');
      ctx.drawSVGPath('M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ');
      ctx.drawSVGPath('M 31,17 L 31,29.5 L 14,29.5 L 14,17');
      ctx.drawSVGPath('M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5');
      ctx.drawSVGPath('M 34,14 L 31,17 L 14,17 L 11,14');
      ctx.drawSVGPath('M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z ');
      ctx.drawSVGPath('M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z ');
      ctx.drawSVGPath('M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14');
      ctx.drawSVGPath('M 34,14 L 31,17 L 14,17 L 11,14');
      ctx.drawSVGPath('M 31,17 L 31,29.5 L 14,29.5 L 14,17');
      ctx.drawSVGPath('M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5');
      ctx.lineWidth = 1;
      ctx.drawSVGPath('M 11,14 L 34,14');
      break;
    
    case 'N':  // black knight
      ctx.lineWidth = 1;
      ctx.drawSVGPath('M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18');
      ctx.drawSVGPath('M 24,18 C 24.384461,20.911278 18.447064,25.368624 16,27 C 13,29 13.180802,31.342892 11,31 C 9.95828,30.055984 12.413429,27.962451 11,28 C 10,28 11.187332,29.231727 10,30 C 9,30 5.9968392,30.999999 6,26 C 6,24 12,14 12,14 C 12,14 13.885866,12.097871 14,10.5 C 13.273953,9.505631 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.281781,8.0080745 21,7 C 22,7 22,10 22,10');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18');
      ctx.drawSVGPath('M 24,18 C 24.384461,20.911278 18.447064,25.368624 16,27 C 13,29 13.180802,31.342892 11,31 C 9.95828,30.055984 12.413429,27.962451 11,28 C 10,28 11.187332,29.231727 10,30 C 9,30 5.9968392,30.999999 6,26 C 6,24 12,14 12,14 C 12,14 13.885866,12.097871 14,10.5 C 13.273953,9.505631 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.281781,8.0080745 21,7 C 22,7 22,10 22,10');
      ctx.strokeStyle = 'white';
      ctx.drawCircle(9, 25.5, 0.5);
      ctx.save();
      ctx.translate(16, -16);
      ctx.rotate(Math.PI * 0.17);
      ctx.scale(1, 1.8);
      ctx.drawCircle(15, 15.5, 0.5);
      ctx.restore();
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'transparent';
      ctx.drawSVGPath('M 24.55,10.4 L 24.25,11.5 L 24.8,11.6 C 27.901459,12.077147 31.123526,13.834204 33.375,18.09375 C 35.626474,22.353296 36.297157,29.05687 35.8,39 L 35.75,39.5 L 37.5,39.5 L 37.5,39 C 38.002843,28.94313 36.623526,22.146704 34.25,17.65625 C 31.876474,13.165796 28.461041,11.022853 25.0625,10.5 L 24.55,10.4 z ');
      break;
    
    case 'n':  // white knight
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18');
      ctx.drawSVGPath('M 24,18 C 24.384461,20.911278 18.447064,25.368624 16,27 C 13,29 13.180802,31.342892 11,31 C 9.95828,30.055984 12.413429,27.962451 11,28 C 10,28 11.187332,29.231727 10,30 C 9,30 5.9968392,30.999999 6,26 C 6,24 12,14 12,14 C 12,14 13.885866,12.097871 14,10.5 C 13.273953,9.505631 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.281781,8.0080745 21,7 C 22,7 22,10 22,10');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18');
      ctx.drawSVGPath('M 24,18 C 24.384461,20.911278 18.447064,25.368624 16,27 C 13,29 13.180802,31.342892 11,31 C 9.95828,30.055984 12.413429,27.962451 11,28 C 10,28 11.187332,29.231727 10,30 C 9,30 5.9968392,30.999999 6,26 C 6,24 12,14 12,14 C 12,14 13.885866,12.097871 14,10.5 C 13.273953,9.505631 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.281781,8.0080745 21,7 C 22,7 22,10 22,10');
      ctx.strokeStyle = 'black';
      ctx.drawCircle(9, 25.5, 0.5);
      ctx.save();
      ctx.translate(16, -16);
      ctx.rotate(Math.PI * 0.17);
      ctx.scale(1, 1.8);
      ctx.drawCircle(15, 15.5, 0.5);
      ctx.restore();
      ctx.lineWidth = 1;
      ctx.fillStyle = 'transparent';
      ctx.drawSVGPath('M 37,39 C 38,19 31.5,11.5 25,10.5');
      break;
    
    case 'B':  // black bishop
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 9,36 C 12.385255,35.027671 19.114744,36.430821 22.5,34 C 25.885256,36.430821 32.614745,35.027671 36,36 C 36,36 37.645898,36.541507 39,38 C 38.322949,38.972328 37.354102,38.986164 36,38.5 C 32.614745,37.527672 25.885256,38.958493 22.5,37.5 C 19.114744,38.958493 12.385255,37.527672 9,38.5 C 7.6458978,38.986164 6.6770511,38.972328 6,38 C 7.3541023,36.055343 9,36 9,36 z ');
      ctx.drawSVGPath('M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z ');
      ctx.drawCircle(22.5, 8, 2.5);
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 9,36 C 12.385255,35.027671 19.114744,36.430821 22.5,34 C 25.885256,36.430821 32.614745,35.027671 36,36 C 36,36 37.645898,36.541507 39,38 C 38.322949,38.972328 37.354102,38.986164 36,38.5 C 32.614745,37.527672 25.885256,38.958493 22.5,37.5 C 19.114744,38.958493 12.385255,37.527672 9,38.5 C 7.6458978,38.986164 6.6770511,38.972328 6,38 C 7.3541023,36.055343 9,36 9,36 z ');
      ctx.drawSVGPath('M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z ');
      ctx.drawCircle(22.5, 8, 2.5);
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.2;
      ctx.drawSVGPath('M 17.5,26 L 27.5,26');
      ctx.drawSVGPath('M 15,30 L 30,30');
      ctx.drawSVGPath('M 22.5,15.5 L 22.5,20.5');
      ctx.drawSVGPath('M 20,18 L 25,18');
      break;
    
    case 'b':  // white bishop
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 9,36 C 12.385255,35.027671 19.114744,36.430821 22.5,34 C 25.885256,36.430821 32.614745,35.027671 36,36 C 36,36 37.645898,36.541507 39,38 C 38.322949,38.972328 37.354102,38.986164 36,38.5 C 32.614745,37.527672 25.885256,38.958493 22.5,37.5 C 19.114744,38.958493 12.385255,37.527672 9,38.5 C 7.6458978,38.986164 6.6770511,38.972328 6,38 C 7.3541023,36.055343 9,36 9,36 z ');
      ctx.drawSVGPath('M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z ');
      ctx.drawCircle(22.5, 8, 2.5);
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 9,36 C 12.385255,35.027671 19.114744,36.430821 22.5,34 C 25.885256,36.430821 32.614745,35.027671 36,36 C 36,36 37.645898,36.541507 39,38 C 38.322949,38.972328 37.354102,38.986164 36,38.5 C 32.614745,37.527672 25.885256,38.958493 22.5,37.5 C 19.114744,38.958493 12.385255,37.527672 9,38.5 C 7.6458978,38.986164 6.6770511,38.972328 6,38 C 7.3541023,36.055343 9,36 9,36 z ');
      ctx.drawSVGPath('M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z ');
      ctx.drawCircle(22.5, 8, 2.5);
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = 'black';
      ctx.drawSVGPath('M 17.5,26 L 27.5,26');
      ctx.drawSVGPath('M 15,30 L 30,30');
      ctx.drawSVGPath('M 22.5,15.5 L 22.5,20.5');
      ctx.drawSVGPath('M 20,18 L 25,18');
      break;
    
    case 'q':  // white queen
      ctx.lineWidth = 1.5;
      ctx.drawCircle(6, 12, 2);
      ctx.drawCircle(14, 8.5, 2);
      ctx.drawCircle(22.5, 7.5, 2);
      ctx.drawCircle(31, 8.5, 2);
      ctx.drawCircle(39, 12, 2);
      ctx.drawSVGPath('M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,10.5 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z ');
      ctx.drawSVGPath('M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z ');
      ctx.shadowColor = 'transparent';
      ctx.drawCircle(6, 12, 2);
      ctx.drawCircle(14, 8.5, 2);
      ctx.drawCircle(22.5, 7.5, 2);
      ctx.drawCircle(31, 8.5, 2);
      ctx.drawCircle(39, 12, 2);
      ctx.drawSVGPath('M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,10.5 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z ');
      ctx.drawSVGPath('M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z ');
      ctx.lineWidth = 1;
      ctx.drawSVGPath('M 10.5,36 C 15.5,35 29,35 34,36');
      ctx.drawSVGPath('M 12,33.5 C 18,32.5 27,32.5 33,33.5');
      ctx.drawSVGPath('M 11.5,30 C 15,29 30,29 33.5,30');
      break;
    
    case 'Q':  // black queen
      ctx.lineWidth = 1;
      ctx.drawCircle(6, 12, 2);
      ctx.drawCircle(14, 8.5, 2);
      ctx.drawCircle(22.5, 7.5, 2);
      ctx.drawCircle(31, 8.5, 2);
      ctx.drawCircle(39, 12, 2);
      ctx.drawSVGPath('M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,10.5 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z ');
      ctx.drawSVGPath('M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z ');
      ctx.shadowColor = 'transparent';
      ctx.drawCircle(6, 12, 2);
      ctx.drawCircle(14, 8.5, 2);
      ctx.drawCircle(22.5, 7.5, 2);
      ctx.drawCircle(31, 8.5, 2);
      ctx.drawCircle(39, 12, 2);
      ctx.drawSVGPath('M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,10.5 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z ');
      ctx.drawSVGPath('M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z ');
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'white';
      ctx.drawSVGPath('M 10.5,36 C 15.5,35 29,35 34,36');
      ctx.drawSVGPath('M 12,33.5 C 18,32.5 27,32.5 33,33.5');
      ctx.drawSVGPath('M 11.5,30 C 15,29 30,29 33.5,30');
      break;
    
    case 'k':  // white king
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25');
      ctx.drawSVGPath('M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z ');
      ctx.drawSVGPath('M 22.5,11.625 L 22.5,6');
      ctx.drawSVGPath('M 20,8 L 25,8');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25');
      ctx.drawSVGPath('M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z ');
      ctx.drawSVGPath('M 22.5,11.625 L 22.5,6');
      ctx.drawSVGPath('M 20,8 L 25,8');
      ctx.drawSVGPath('M 11.5,29.5 C 17,27 27,27 32.5,30');
      ctx.drawSVGPath('M 11.5,37 C 17,34.5 27,34.5 32.5,37');
      ctx.drawSVGPath('M 11.5,33.5 C 17,31.5 27,31.5 32.5,33.5');
      break;
    
    case 'K':  // black king
      ctx.lineWidth = 3;
      ctx.drawSVGPath('M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25');
      ctx.drawSVGPath('M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z ');
      ctx.lineWidth = 1.5;
      ctx.drawSVGPath('M 22.5,11.625 L 22.5,6');
      ctx.drawSVGPath('M 20,8 L 25,8');
      ctx.shadowColor = 'transparent';
      ctx.drawSVGPath('M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25');
      ctx.drawSVGPath('M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z ');
      ctx.drawSVGPath('M 22.5,11.625 L 22.5,6');
      ctx.drawSVGPath('M 20,8 L 25,8');
      ctx.strokeStyle = 'white';
      ctx.fillStyle = 'transparent';
      ctx.lineWidth = 1.2;
      ctx.drawSVGPath('M 11.5,29.5 C 17,27 27,27 32.5,30');
      ctx.drawSVGPath('M 11.5,37 C 17,34.5 27,34.5 32.5,37');
      ctx.drawSVGPath('M 11.5,33.5 C 17,31.5 27,31.5 32.5,33.5');
      ctx.drawSVGPath('M 32,29.5 C 32,29.5 40.5,25.5 38.025969,19.846552 C 34.147406,13.996552 25,18 22.5,24.5 L 22.511718,26.596552 L 22.5,24.5 C 20,18 9.9063892,13.996552 6.9974672,19.846552 C 4.5,25.5 11.845671,28.846552 11.845671,28.846552');
      break;
      
    }
  }
}