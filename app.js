const game = new ChessGame();

const board =
  document.getElementById("board");

const moveList =
  document.getElementById("moveList");

const turnStatus =
  document.getElementById("turnStatus");

const gameStatus =
  document.getElementById("gameStatus");

let selected = null;
let legalMoves = [];
let flipped = false;

let moveNotations = [];
let promotionMove = null;

const names = {
  w: "White",
  b: "Black"
};


function render() {

  board.innerHTML = "";

  for (let visualRow = 0; visualRow < 8; visualRow++) {

    for (let visualCol = 0; visualCol < 8; visualCol++) {

      const r =
        flipped
          ? 7 - visualRow
          : visualRow;

      const c =
        flipped
          ? 7 - visualCol
          : visualCol;

      const square =
        document.createElement("div");

      square.className =
        "square " +
        ((r + c) % 2
          ? "dark"
          : "light");


      // Selected square

      if (
        selected &&
        selected[0] === r &&
        selected[1] === c
      ) {

        square.classList.add(
          "selected"
        );
      }


      // Last move

      if (
        game.lastMove &&
        (
          (
            game.lastMove.from[0] === r &&
            game.lastMove.from[1] === c
          ) ||
          (
            game.lastMove.to[0] === r &&
            game.lastMove.to[1] === c
          )
        )
      ) {

        square.classList.add(
          "last"
        );
      }


      // Check

      const king =
        game.kingSquare(game.turn);

      if (
        king &&
        king[0] === r &&
        king[1] === c &&
        game.inCheck(game.turn)
      ) {

        square.classList.add(
          "check"
        );
      }


      // Legal move indicator

      const move =
        legalMoves.find(
          m =>
            m.to[0] === r &&
            m.to[1] === c
        );

      if (move) {

        const marker =
          document.createElement("div");

        marker.className =
          game.board[r][c]
            ? "legal-capture"
            : "legal-dot";

        square.appendChild(marker);
      }


      // Piece

      const piece =
        game.board[r][c];

      if (piece) {

        const span =
          document.createElement("span");

        span.className =
          "piece " +
          (
            piece.color === "w"
              ? "white-piece"
              : "black-piece"
          );

        span.textContent =
          PIECES[
            piece.color
          ][
            piece.type
          ];

        square.appendChild(span);
      }


      // Coordinates

      if (visualCol === 0) {

        const rank =
          document.createElement("span");

        rank.className =
          "coords rank";

        rank.textContent =
          8 - r;

        square.appendChild(rank);
      }

      if (visualRow === 7) {

        const file =
          document.createElement("span");

        file.className =
          "coords file";

        file.textContent =
          FILES[c];

        square.appendChild(file);
      }


      square.onclick =
        () => clickSquare(r, c);

      board.appendChild(square);
    }
  }


  renderMoves();


  if (game.result) {

    turnStatus.textContent =
      game.result;

  } else {

    turnStatus.textContent =
      `${names[game.turn]} to move`;
  }


  gameStatus.textContent =
    (
      !game.result &&
      game.inCheck(game.turn)
    )
      ? "CHECK!"
      : "";


  document.getElementById(
    "halfmove"
  ).textContent =
    game.halfmove;


  document.getElementById(
    "positionCount"
  ).textContent =
    game.positions.get(
      game.positionKey()
    ) || 1;
}


function clickSquare(r, c) {

  if (game.result) {
    return;
  }


  const piece =
    game.board[r][c];


  // Already selected

  if (selected) {

    const move =
      legalMoves.find(
        m =>
          m.to[0] === r &&
          m.to[1] === c
      );


    if (move) {

      if (move.promotion) {

        promotionMove = move;

        showPromotion();

      } else {

        game.makeMove(move);

        moveNotations.push(
          game.lastMove.notation
        );

        selected = null;
        legalMoves = [];

        render();
      }

      return;
    }


    // Select another own piece

    if (
      piece &&
      piece.color === game.turn
    ) {

      selected = [r, c];

      legalMoves =
        game.legalMovesFor(r, c);

      render();

      return;
    }


    selected = null;
    legalMoves = [];

    render();

    return;
  }


  // Select piece

  if (
    piece &&
    piece.color === game.turn
  ) {

    selected = [r, c];

    legalMoves =
      game.legalMovesFor(r, c);

    render();
  }
}


function renderMoves() {

  moveList.innerHTML = "";

  for (
    let i = 0;
    i < moveNotations.length;
    i += 2
  ) {

    const row =
      document.createElement("div");

    row.className =
      "move-row";

    row.innerHTML = `
      <span>${Math.floor(i / 2) + 1}.</span>
      <span>${moveNotations[i] || ""}</span>
      <span>${moveNotations[i + 1] || ""}</span>
    `;

    moveList.appendChild(row);
  }

  moveList.scrollTop =
    moveList.scrollHeight;
}


function showPromotion() {

  const modal =
    document.getElementById(
      "promotionModal"
    );

  const choices =
    document.getElementById(
      "promotionChoices"
    );

  choices.innerHTML = "";

  const color =
    game.turn;

  for (
    const type of
    ["Q", "R", "B", "N"]
  ) {

    const button =
      document.createElement("button");

    button.textContent =
      PIECES[color][type];

    button.onclick = () => {

      game.makeMove(
        promotionMove,
        type
      );

      moveNotations.push(
        game.lastMove.notation
      );

      promotionMove = null;

      modal.classList.add(
        "hidden"
      );

      selected = null;
      legalMoves = [];

      render();
    };

    choices.appendChild(button);
  }

  modal.classList.remove(
    "hidden"
  );
}


// New Game

document
  .getElementById("newGame")
  .onclick = () => {

    game.reset();

    moveNotations = [];

    selected = null;
    legalMoves = [];

    render();
  };


// Flip

document
  .getElementById("flipBoard")
  .onclick = () => {

    flipped = !flipped;

    render();
  };


// Undo

document
  .getElementById("undo")
  .onclick = () => {

    if (game.undo()) {

      moveNotations.pop();

      selected = null;
      legalMoves = [];

      render();
    }
  };


// Redo

document
  .getElementById("redo")
  .onclick = () => {

    if (game.redo()) {

      if (game.lastMove) {

        moveNotations.push(
          game.lastMove.notation
        );
      }

      selected = null;
      legalMoves = [];

      render();
    }
  };


// Resign

document
  .getElementById("resign")
  .onclick = () => {

    if (game.result) return;

    game.result =
      `${names[game.opposite(game.turn)]} wins by resignation`;

    render();
  };


// Draw

document
  .getElementById("drawOffer")
  .onclick = () => {

    if (game.result) return;

    if (
      confirm(
        "Agree to a draw?"
      )
    ) {

      game.result =
        "Draw by agreement";

      render();
    }
  };


// Rules

document
  .getElementById("rulesBtn")
  .onclick = () => {

    document
      .getElementById("rulesModal")
      .classList.remove("hidden");
  };


// Close rules

document
  .getElementById("closeRules")
  .onclick = () => {

    document
      .getElementById("rulesModal")
      .classList.add("hidden");
  };


// Click outside rules

document
  .getElementById("rulesModal")
  .onclick = event => {

    if (
      event.target.id ===
      "rulesModal"
    ) {

      event.currentTarget
        .classList.add("hidden");
    }
  };


// Start

render();
