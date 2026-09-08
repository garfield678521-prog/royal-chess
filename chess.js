const FILES = "abcdefgh";

const PIECES = {
  w: {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙"
  },

  b: {
    K: "♚",
    Q: "♛",
    R: "♜",
    B: "♝",
    N: "♞",
    P: "♟"
  }
};

const STARTING_BACK = [
  "R", "N", "B", "Q",
  "K", "B", "N", "R"
];

class ChessGame {

  constructor() {
    this.reset();
  }

  reset() {

    this.board =
      Array.from(
        { length: 8 },
        () => Array(8).fill(null)
      );

    for (let c = 0; c < 8; c++) {

      this.board[0][c] = {
        type: STARTING_BACK[c],
        color: "b"
      };

      this.board[1][c] = {
        type: "P",
        color: "b"
      };

      this.board[6][c] = {
        type: "P",
        color: "w"
      };

      this.board[7][c] = {
        type: STARTING_BACK[c],
        color: "w"
      };
    }

    this.turn = "w";

    this.castling = {
      w: {
        K: true,
        Q: true
      },

      b: {
        K: true,
        Q: true
      }
    };

    this.enPassant = null;

    this.halfmove = 0;
    this.fullmove = 1;

    this.history = [];
    this.future = [];

    this.positions = new Map();

    this.positions.set(
      this.positionKey(),
      1
    );

    this.lastMove = null;
    this.result = null;
  }

  opposite(color) {
    return color === "w" ? "b" : "w";
  }

  inside(r, c) {
    return (
      r >= 0 &&
      r < 8 &&
      c >= 0 &&
      c < 8
    );
  }

  cloneState() {

    return JSON.parse(
      JSON.stringify({
        board: this.board,
        turn: this.turn,
        castling: this.castling,
        enPassant: this.enPassant,
        halfmove: this.halfmove,
        fullmove: this.fullmove,
        lastMove: this.lastMove,
        result: this.result
      })
    );
  }

  restore(state) {
    Object.assign(this, state);
  }

  kingSquare(color) {

    for (let r = 0; r < 8; r++) {

      for (let c = 0; c < 8; c++) {

        const p = this.board[r][c];

        if (
          p &&
          p.color === color &&
          p.type === "K"
        ) {
          return [r, c];
        }
      }
    }

    return null;
  }

  isAttacked(r, c, attacker) {

    const b = this.board;

    // Pawn attacks
    const pawnRow =
      r + (attacker === "w" ? 1 : -1);

    for (const dc of [-1, 1]) {

      if (
        this.inside(pawnRow, c + dc)
      ) {

        const p =
          b[pawnRow][c + dc];

        if (
          p &&
          p.color === attacker &&
          p.type === "P"
        ) {
          return true;
        }
      }
    }

    // Knight attacks
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];

    for (const [dr, dc] of knightMoves) {

      const rr = r + dr;
      const cc = c + dc;

      if (!this.inside(rr, cc)) continue;

      const p = b[rr][cc];

      if (
        p &&
        p.color === attacker &&
        p.type === "N"
      ) {
        return true;
      }
    }

    // King attacks
    for (let dr = -1; dr <= 1; dr++) {

      for (let dc = -1; dc <= 1; dc++) {

        if (!dr && !dc) continue;

        const rr = r + dr;
        const cc = c + dc;

        if (!this.inside(rr, cc)) continue;

        const p = b[rr][cc];

        if (
          p &&
          p.color === attacker &&
          p.type === "K"
        ) {
          return true;
        }
      }
    }

    // Rooks / Queens
    const straight = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];

    for (const [dr, dc] of straight) {

      let rr = r + dr;
      let cc = c + dc;

      while (this.inside(rr, cc)) {

        const p = b[rr][cc];

        if (p) {

          if (
            p.color === attacker &&
            (p.type === "R" ||
             p.type === "Q")
          ) {
            return true;
          }

          break;
        }

        rr += dr;
        cc += dc;
      }
    }

    // Bishops / Queens
    const diagonal = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ];

    for (const [dr, dc] of diagonal) {

      let rr = r + dr;
      let cc = c + dc;

      while (this.inside(rr, cc)) {

        const p = b[rr][cc];

        if (p) {

          if (
            p.color === attacker &&
            (p.type === "B" ||
             p.type === "Q")
          ) {
            return true;
          }

          break;
        }

        rr += dr;
        cc += dc;
      }
    }

    return false;
  }

  inCheck(color) {

    const king = this.kingSquare(color);

    if (!king) return true;

    return this.isAttacked(
      king[0],
      king[1],
      this.opposite(color)
    );
  }

  pseudoMoves(r, c) {

    const p = this.board[r][c];

    if (!p) return [];

    const moves = [];

    const add = (
      rr,
      cc,
      extra = {}
    ) => {

      if (!this.inside(rr, cc)) return;

      const target =
        this.board[rr][cc];

      if (
        !target ||
        target.color !== p.color
      ) {

        moves.push({
          from: [r, c],
          to: [rr, cc],
          piece: p.type,
          ...extra
        });
      }
    };

    // Pawn
    if (p.type === "P") {

      const direction =
        p.color === "w" ? -1 : 1;

      const startRow =
        p.color === "w" ? 6 : 1;

      const promotionRow =
        p.color === "w" ? 0 : 7;

      const one = r + direction;

      if (
        this.inside(one, c) &&
        !this.board[one][c]
      ) {

        add(
          one,
          c,
          {
            promotion:
              one === promotionRow
          }
        );

        const two =
          r + direction * 2;

        if (
          r === startRow &&
          !this.board[two][c]
        ) {

          add(
            two,
            c,
            {
              doublePawn: true
            }
          );
        }
      }

      for (const dc of [-1, 1]) {

        const rr = r + direction;
        const cc = c + dc;

        if (!this.inside(rr, cc)) continue;

        const target =
          this.board[rr][cc];

        if (
          target &&
          target.color !== p.color
        ) {

          add(
            rr,
            cc,
            {
              capture: true,
              promotion:
                rr === promotionRow
            }
          );
        }

        if (
          this.enPassant &&
          this.enPassant[0] === rr &&
          this.enPassant[1] === cc
        ) {

          add(
            rr,
            cc,
            {
              capture: true,
              enPassant: true
            }
          );
        }
      }

      return moves;
    }

    // Knight
    if (p.type === "N") {

      const jumps = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]
      ];

      for (const [dr, dc] of jumps) {
        add(r + dr, c + dc);
      }

      return moves;
    }

    // King
    if (p.type === "K") {

      for (let dr = -1; dr <= 1; dr++) {

        for (let dc = -1; dc <= 1; dc++) {

          if (dr || dc) {
            add(r + dr, c + dc);
          }
        }
      }

      // Castling
      if (!this.inCheck(p.color)) {

        const row =
          p.color === "w" ? 7 : 0;

        // Kingside
        if (
          this.castling[p.color].K &&
          this.board[row][7] &&
          this.board[row][7].type === "R" &&
          !this.board[row][5] &&
          !this.board[row][6] &&
          !this.isAttacked(
            row,
            5,
            this.opposite(p.color)
          ) &&
          !this.isAttacked(
            row,
            6,
            this.opposite(p.color)
          )
        ) {

          moves.push({
            from: [r, c],
            to: [row, 6],
            piece: "K",
            castle: "K"
          });
        }

        // Queenside
        if (
          this.castling[p.color].Q &&
          this.board[row][0] &&
          this.board[row][0].type === "R" &&
          !this.board[row][1] &&
          !this.board[row][2] &&
          !this.board[row][3] &&
          !this.isAttacked(
            row,
            3,
            this.opposite(p.color)
          ) &&
          !this.isAttacked(
            row,
            2,
            this.opposite(p.color)
          )
        ) {

          moves.push({
            from: [r, c],
            to: [row, 2],
            piece: "K",
            castle: "Q"
          });
        }
      }

      return moves;
    }

    // Sliding pieces
    let directions = [];

    if (p.type === "B") {

      directions = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ];

    } else if (p.type === "R") {

      directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ];

    } else if (p.type === "Q") {

      directions = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ];
    }

    for (const [dr, dc] of directions) {

      let rr = r + dr;
      let cc = c + dc;

      while (this.inside(rr, cc)) {

        const target =
          this.board[rr][cc];

        if (!target) {

          moves.push({
            from: [r, c],
            to: [rr, cc],
            piece: p.type
          });

        } else {

          if (target.color !== p.color) {

            moves.push({
              from: [r, c],
              to: [rr, cc],
              piece: p.type,
              capture: true
            });
          }

          break;
        }

        rr += dr;
        cc += dc;
      }
    }

    return moves;
  }

  legalMovesFor(r, c) {

    const piece = this.board[r][c];

    if (
      !piece ||
      piece.color !== this.turn
    ) {
      return [];
    }

    const candidates =
      this.pseudoMoves(r, c);

    return candidates.filter(move => {

      const saved = this.cloneState();

      this.applyRawMove(move, "Q");

      const safe =
        !this.inCheck(piece.color);

      this.restore(saved);

      return safe;
    });
  }

  applyRawMove(move, promotion = "Q") {

    const [r, c] = move.from;
    const [rr, cc] = move.to;

    const piece = this.board[r][c];

    this.board[rr][cc] = piece;
    this.board[r][c] = null;

    // En passant capture
    if (move.enPassant) {
      this.board[r][cc] = null;
    }

    // Castling rook
    if (move.castle) {

      const row = r;

      const rookFrom =
        move.castle === "K" ? 7 : 0;

      const rookTo =
        move.castle === "K" ? 5 : 3;

      this.board[row][rookTo] =
        this.board[row][rookFrom];

      this.board[row][rookFrom] = null;
    }

    // Promotion
    if (move.promotion) {

      this.board[rr][cc] = {
        type: promotion,
        color: piece.color
      };
    }
  }

  makeMove(move, promotion = "Q") {

    const legal =
      this.legalMovesFor(
        move.from[0],
        move.from[1]
      ).find(m =>
        m.to[0] === move.to[0] &&
        m.to[1] === move.to[1] &&
        !!m.enPassant === !!move.enPassant &&
        !!m.castle === !!move.castle
      );

    if (!legal) return false;

    this.history.push(
      this.cloneState()
    );

    this.future = [];

    const piece =
      this.board[
        move.from[0]
      ][
        move.from[1]
      ];

    const captured =
      this.board[
        move.to[0]
      ][
        move.to[1]
      ];

    this.applyRawMove(
      legal,
      promotion
    );

    // Castling rights
    if (piece.type === "K") {

      this.castling[piece.color].K = false;
      this.castling[piece.color].Q = false;
    }

    if (piece.type === "R") {

      if (
        piece.color === "w" &&
        move.from[0] === 7
      ) {

        if (move.from[1] === 0)
          this.castling.w.Q = false;

        if (move.from[1] === 7)
          this.castling.w.K = false;
      }

      if (
        piece.color === "b" &&
        move.from[0] === 0
      ) {

        if (move.from[1] === 0)
          this.castling.b.Q = false;

        if (move.from[1] === 7)
          this.castling.b.K = false;
      }
    }

    // Captured rook
    if (
      captured &&
      captured.type === "R"
    ) {

      if (
        captured.color === "w" &&
        move.to[0] === 7
      ) {

        if (move.to[1] === 0)
          this.castling.w.Q = false;

        if (move.to[1] === 7)
          this.castling.w.K = false;
      }

      if (
        captured.color === "b" &&
        move.to[0] === 0
      ) {

        if (move.to[1] === 0)
          this.castling.b.Q = false;

        if (move.to[1] === 7)
          this.castling.b.K = false;
      }
    }

    // En passant target
    this.enPassant = null;

    if (
      piece.type === "P" &&
      Math.abs(
        move.to[0] -
        move.from[0]
      ) === 2
    ) {

      this.enPassant = [
        (move.from[0] +
         move.to[0]) / 2,

        move.from[1]
      ];
    }

    // 50-move clock
    if (
      piece.type === "P" ||
      captured ||
      legal.enPassant
    ) {

      this.halfmove = 0;

    } else {

      this.halfmove++;
    }

    if (piece.color === "b") {
      this.fullmove++;
    }

    const notation =
      this.generateNotation(
        legal,
        captured,
        promotion
      );

    this.lastMove = {
      ...legal,
      notation
    };

    this.turn =
      this.opposite(this.turn);

    const key =
      this.positionKey();

    this.positions.set(
      key,
      (this.positions.get(key) || 0) + 1
    );

    this.updateResult();

    return true;
  }

  generateNotation(
    move,
    captured,
    promotion
  ) {

    if (move.castle) {
      return move.castle === "K"
        ? "O-O"
        : "O-O-O";
    }

    let result = "";

    if (move.piece === "P") {

      if (
        captured ||
        move.enPassant
      ) {
        result =
          FILES[move.from[1]];
      }

    } else {

      result = move.piece;
    }

    if (
      captured ||
      move.enPassant
    ) {
      result += "x";
    }

    result +=
      FILES[move.to[1]] +
      (8 - move.to[0]);

    if (move.promotion) {
      result += "=" + promotion;
    }

    const originalTurn = this.turn;

    this.turn =
      this.opposite(this.turn);

    const check =
      this.inCheck(this.turn);

    const mate =
      check &&
      this.allLegalMoves(
        this.turn
      ).length === 0;

    this.turn = originalTurn;

    if (mate) {
      result += "#";
    } else if (check) {
      result += "+";
    }

    return result;
  }

  allLegalMoves(color = this.turn) {

    const oldTurn = this.turn;

    this.turn = color;

    const moves = [];

    for (let r = 0; r < 8; r++) {

      for (let c = 0; c < 8; c++) {

        if (
          this.board[r][c] &&
          this.board[r][c].color === color
        ) {

          moves.push(
            ...this.legalMovesFor(r, c)
          );
        }
      }
    }

    this.turn = oldTurn;

    return moves;
  }

  positionKey() {

    let boardString = "";

    for (const row of this.board) {

      for (const p of row) {

        boardString += p
          ? p.color + p.type
          : "--";
      }
    }

    let rights = "";

    if (this.castling.w.K) rights += "K";
    if (this.castling.w.Q) rights += "Q";
    if (this.castling.b.K) rights += "k";
    if (this.castling.b.Q) rights += "q";

    return (
      boardString +
      "|" +
      this.turn +
      "|" +
      rights +
      "|" +
      (this.enPassant
        ? this.enPassant.join(",")
        : "-")
    );
  }

  insufficientMaterial() {

    const pieces = [];

    for (const row of this.board) {

      for (const p of row) {

        if (
          p &&
          p.type !== "K"
        ) {
          pieces.push(p);
        }
      }
    }

    // King vs king
    if (pieces.length === 0) {
      return true;
    }

    // King + bishop/knight vs king
    if (pieces.length === 1) {

      return (
        pieces[0].type === "B" ||
        pieces[0].type === "N"
      );
    }

    // No pawns, rooks or queens
    if (
      pieces.some(p =>
        p.type === "P" ||
        p.type === "R" ||
        p.type === "Q"
      )
    ) {
      return false;
    }

    // Only bishops on same colour
    if (
      pieces.every(
        p => p.type === "B"
      )
    ) {

      const colours = [];

      for (let r = 0; r < 8; r++) {

        for (let c = 0; c < 8; c++) {

          const p = this.board[r][c];

          if (
            p &&
            p.type === "B"
          ) {

            colours.push(
              (r + c) % 2
            );
          }
        }
      }

      return colours.every(
        x => x === colours[0]
      );
    }

    return false;
  }

  updateResult() {

    const legal =
      this.allLegalMoves(this.turn);

    const check =
      this.inCheck(this.turn);

    this.result = null;

    if (legal.length === 0) {

      if (check) {

        this.result =
          this.opposite(this.turn) === "w"
            ? "White wins by checkmate"
            : "Black wins by checkmate";

      } else {

        this.result =
          "Draw by stalemate";
      }

      return;
    }

    if (this.insufficientMaterial()) {

      this.result =
        "Draw by insufficient material";

      return;
    }

    if (
      (this.positions.get(
        this.positionKey()
      ) || 0) >= 3
    ) {

      this.result =
        "Draw by threefold repetition";

      return;
    }

    if (this.halfmove >= 100) {

      this.result =
        "Draw by 50-move rule";
    }
  }

  undo() {

    if (!this.history.length) {
      return false;
    }

    this.future.push(
      this.cloneState()
    );

    this.restore(
      this.history.pop()
    );

    return true;
  }

  redo() {

    if (!this.future.length) {
      return false;
    }

    this.history.push(
      this.cloneState()
    );

    this.restore(
      this.future.pop()
    );

    return true;
  }
}
