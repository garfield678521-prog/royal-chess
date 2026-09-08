const game = new ChessGame();

const board = document.getElementById("board");
const moveList = document.getElementById("moveList");
const turnStatus = document.getElementById("turnStatus");
const gameStatus = document.getElementById("gameStatus");

let selected = null;
let legalMoves = [];
let flipped = false;
let moveNotations = [];
let promotionMove = null;

const names = { w: "White", b: "Black" };

let mode = "local"; // local | ai | multiplayer
let humanColor = "w";
let aiColor = "b";
let aiDifficulty = "medium";
let aiThinking = false;

let peer = null;
let peerConnection = null;
let roomCode = "";
let myColor = null;
let isHost = false;

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function clearSelection() {
  selected = null;
  legalMoves = [];
}

function render() {
  board.innerHTML = "";

  for (let visualRow = 0; visualRow < 8; visualRow++) {
    for (let visualCol = 0; visualCol < 8; visualCol++) {
      const r = flipped ? 7 - visualRow : visualRow;
      const c = flipped ? 7 - visualCol : visualCol;

      const square = document.createElement("div");
      square.className = "square " + ((r + c) % 2 ? "dark" : "light");

      if (selected && selected[0] === r && selected[1] === c) {
        square.classList.add("selected");
      }

      if (game.lastMove &&
          ((game.lastMove.from[0] === r && game.lastMove.from[1] === c) ||
           (game.lastMove.to[0] === r && game.lastMove.to[1] === c))) {
        square.classList.add("last");
      }

      const king = game.kingSquare(game.turn);
      if (king && king[0] === r && king[1] === c && game.inCheck(game.turn)) {
        square.classList.add("check");
      }

      const move = legalMoves.find(m => m.to[0] === r && m.to[1] === c);
      if (move) {
        const marker = document.createElement("div");
        marker.className = game.board[r][c] ? "legal-capture" : "legal-dot";
        square.appendChild(marker);
      }

      const piece = game.board[r][c];
      if (piece) {
        const span = document.createElement("span");
        span.className = "piece " + (piece.color === "w" ? "white-piece" : "black-piece");
        span.textContent = PIECES[piece.color][piece.type];
        square.appendChild(span);
      }

      if (visualCol === 0) {
        const rank = document.createElement("span");
        rank.className = "coords rank";
        rank.textContent = 8 - r;
        square.appendChild(rank);
      }

      if (visualRow === 7) {
        const file = document.createElement("span");
        file.className = "coords file";
        file.textContent = FILES[c];
        square.appendChild(file);
      }

      square.onclick = () => clickSquare(r, c);
      board.appendChild(square);
    }
  }

  renderMoves();

  if (game.result) {
    turnStatus.textContent = game.result;
  } else if (mode === "multiplayer" && myColor) {
    turnStatus.textContent = game.turn === myColor ? `${names[myColor]} — your move` : `${names[game.turn]} — opponent's move`;
  } else if (mode === "ai") {
    turnStatus.textContent = game.turn === humanColor ? `${names[humanColor]} — your move` : `🤖 AI (${names[aiColor]}) thinking...`;
  } else {
    turnStatus.textContent = `${names[game.turn]} to move`;
  }

  gameStatus.textContent = (!game.result && game.inCheck(game.turn)) ? "CHECK!" : "";

  setText("halfmove", game.halfmove);
  setText("positionCount", game.positions.get(game.positionKey()) || 1);
  setText("whiteState", game.result && game.result.startsWith("White") ? "Winner" : "Playing");
  setText("blackState", game.result && game.result.startsWith("Black") ? "Winner" : "Playing");

  updateModeUI();
}

function renderMoves() {
  moveList.innerHTML = "";
  for (let i = 0; i < moveNotations.length; i += 2) {
    const row = document.createElement("div");
    row.className = "move-row";
    row.innerHTML = `<span>${Math.floor(i / 2) + 1}.</span><span>${moveNotations[i] || ""}</span><span>${moveNotations[i + 1] || ""}</span>`;
    moveList.appendChild(row);
  }
  moveList.scrollTop = moveList.scrollHeight;
}

function isHumanTurn() {
  if (mode === "local") return true;
  if (mode === "ai") return game.turn === humanColor && !aiThinking;
  if (mode === "multiplayer") return game.turn === myColor && !!peerConnection;
  return false;
}

function clickSquare(r, c) {
  if (game.result || !isHumanTurn()) return;

  const piece = game.board[r][c];

  if (selected) {
    const move = legalMoves.find(m => m.to[0] === r && m.to[1] === c);

    if (move) {
      if (move.promotion) {
        promotionMove = move;
        showPromotion();
      } else {
        playMove(move);
      }
      return;
    }

    if (piece && piece.color === game.turn) {
      selected = [r, c];
      legalMoves = game.legalMovesFor(r, c);
      render();
      return;
    }

    clearSelection();
    render();
    return;
  }

  if (piece && piece.color === game.turn) {
    selected = [r, c];
    legalMoves = game.legalMovesFor(r, c);
    render();
  }
}

function playMove(move, promotion = "Q", remote = false) {
  const ok = game.makeMove(move, promotion);
  if (!ok) return false;

  moveNotations.push(game.lastMove.notation);
  clearSelection();
  promotionMove = null;

  if (mode === "multiplayer" && !remote && peerConnection) {
    peerConnection.send({
      type: "move",
      move: {
        from: move.from,
        to: move.to,
        castle: move.castle || null,
        enPassant: !!move.enPassant,
        promotion: !!move.promotion
      },
      promotion
    });
  }

  render();

  if (mode === "ai" && !game.result && game.turn === aiColor) {
    runAI();
  }
  return true;
}

function showPromotion() {
  const modal = document.getElementById("promotionModal");
  const choices = document.getElementById("promotionChoices");
  choices.innerHTML = "";

  const color = game.turn;
  for (const type of ["Q", "R", "B", "N"]) {
    const button = document.createElement("button");
    button.textContent = PIECES[color][type];
    button.onclick = () => {
      playMove(promotionMove, type);
      modal.classList.add("hidden");
    };
    choices.appendChild(button);
  }
  modal.classList.remove("hidden");
}

function newLocalGame() {
  mode = "local";
  aiThinking = false;
  game.reset();
  moveNotations = [];
  clearSelection();
  render();
}

function startAI(color = "w", difficulty = "medium") {
  mode = "ai";
  humanColor = color;
  aiColor = color === "w" ? "b" : "w";
  aiDifficulty = difficulty;
  aiThinking = false;
  game.reset();
  moveNotations = [];
  clearSelection();
  flipped = color === "b";
  render();
  if (game.turn === aiColor) runAI();
}

function runAI() {
  if (mode !== "ai" || game.result || game.turn !== aiColor) return;
  aiThinking = true;
  render();

  setTimeout(() => {
    if (mode !== "ai" || game.result || game.turn !== aiColor) {
      aiThinking = false;
      render();
      return;
    }

    const move = chooseAIMove(game, aiColor, aiDifficulty);
    if (move) playMove(move, move.promotion ? "Q" : "Q");
    aiThinking = false;
    render();
  }, 250);
}

function statePayload() {
  return {
    board: game.board,
    turn: game.turn,
    castling: game.castling,
    enPassant: game.enPassant,
    halfmove: game.halfmove,
    fullmove: game.fullmove,
    lastMove: game.lastMove,
    result: game.result,
    moveNotations
  };
}

function loadPayload(data) {
  game.board = data.board;
  game.turn = data.turn;
  game.castling = data.castling;
  game.enPassant = data.enPassant;
  game.halfmove = data.halfmove;
  game.fullmove = data.fullmove;
  game.lastMove = data.lastMove;
  game.result = data.result;
  game.history = [];
  game.future = [];
  game.positions = new Map();
  game.positions.set(game.positionKey(), 1);
  moveNotations = data.moveNotations || [];
  clearSelection();
  render();
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function setConnection(conn, color, host) {
  peerConnection = conn;
  myColor = color;
  isHost = host;

  conn.on("open", () => {
    setText("roomStatus", `Connected • You are ${names[myColor]}`);
    if (isHost) {
      conn.send({ type: "sync", state: statePayload() });
    }
    render();
  });

  conn.on("data", data => {
    if (!data || !data.type) return;

    if (data.type === "move") {
      playMove(data.move, data.promotion || "Q", true);
    }

    if (data.type === "sync") {
      loadPayload(data.state);
    }

    if (data.type === "reset") {
      loadPayload(data.state);
    }

    if (data.type === "result") {
      game.result = data.result;
      render();
    }
  });

  conn.on("close", () => {
    peerConnection = null;
    setText("roomStatus", "Opponent disconnected");
    render();
  });

  conn.on("error", () => {
    setText("roomStatus", "Connection error");
  });
}

function hostMultiplayer() {
  if (typeof Peer === "undefined") {
    alert("Multiplayer needs an internet connection so PeerJS can connect players.");
    return;
  }

  if (peer) peer.destroy();

  mode = "multiplayer";
  myColor = "w";
  isHost = true;
  roomCode = randomRoomCode();
  game.reset();
  moveNotations = [];
  clearSelection();
  flipped = false;

  peer = new Peer("royal-chess-" + roomCode.toLowerCase());

  peer.on("open", () => {
    setText("roomCode", roomCode);
    setText("roomStatus", "Waiting for Black to join…");
    document.getElementById("multiplayerPanel").classList.remove("hidden");
    render();
  });

  peer.on("connection", conn => {
    if (peerConnection) conn.close();
    setConnection(conn, "w", true);
  });

  peer.on("error", err => {
    console.error(err);
    setText("roomStatus", "Could not create room. Try again.");
  });

  document.getElementById("multiplayerPanel").classList.remove("hidden");
  render();
}

function joinMultiplayer() {
  if (typeof Peer === "undefined") {
    alert("Multiplayer needs an internet connection so PeerJS can connect players.");
    return;
  }

  const code = document.getElementById("joinCode").value.trim().toUpperCase();
  if (!code) return alert("Enter a room code.");

  if (peer) peer.destroy();

  mode = "multiplayer";
  myColor = "b";
  isHost = false;
  roomCode = code;
  game.reset();
  moveNotations = [];
  clearSelection();
  flipped = true;

  peer = new Peer();

  peer.on("open", () => {
    const conn = peer.connect("royal-chess-" + code.toLowerCase(), { reliable: true });
    setConnection(conn, "b", false);
  });

  peer.on("error", err => {
    console.error(err);
    setText("roomStatus", "Could not join room. Check the code.");
  });

  document.getElementById("multiplayerPanel").classList.remove("hidden");
  setText("roomCode", code);
  setText("roomStatus", "Connecting…");
  render();
}

function leaveMultiplayer() {
  if (peerConnection) peerConnection.close();
  if (peer) peer.destroy();
  peer = null;
  peerConnection = null;
  myColor = null;
  roomCode = "";
  isHost = false;
  document.getElementById("multiplayerPanel").classList.add("hidden");
  newLocalGame();
}

function broadcastResult() {
  if (peerConnection) peerConnection.send({ type: "result", result: game.result });
}

// Controls
document.getElementById("newGame").onclick = newLocalGame;
document.getElementById("flipBoard").onclick = () => { flipped = !flipped; render(); };

document.getElementById("undo").onclick = () => {
  if (mode === "multiplayer" || aiThinking) return;
  if (game.undo()) {
    moveNotations.pop();
    clearSelection();
    render();
  }
};

document.getElementById("redo").onclick = () => {
  if (mode === "multiplayer" || aiThinking) return;
  if (game.redo()) {
    if (game.lastMove) moveNotations.push(game.lastMove.notation);
    clearSelection();
    render();
  }
};

document.getElementById("resign").onclick = () => {
  if (game.result || (mode === "multiplayer" && !isHumanTurn())) return;
  game.result = `${names[game.opposite(game.turn)]} wins by resignation`;
  broadcastResult();
  render();
};

document.getElementById("drawOffer").onclick = () => {
  if (game.result || (mode === "multiplayer" && !isHumanTurn())) return;
  if (confirm("Agree to a draw?")) {
    game.result = "Draw by agreement";
    broadcastResult();
    render();
  }
};

document.getElementById("rulesBtn").onclick = () => document.getElementById("rulesModal").classList.remove("hidden");
document.getElementById("closeRules").onclick = () => document.getElementById("rulesModal").classList.add("hidden");
document.getElementById("rulesModal").onclick = e => {
  if (e.target.id === "rulesModal") e.currentTarget.classList.add("hidden");
};

document.getElementById("aiBtn").onclick = () => document.getElementById("aiModal").classList.remove("hidden");
document.getElementById("closeAI").onclick = () => document.getElementById("aiModal").classList.add("hidden");

document.getElementById("startAI").onclick = () => {
  const color = document.getElementById("aiColor").value;
  const difficulty = document.getElementById("aiDifficulty").value;
  document.getElementById("aiModal").classList.add("hidden");
  startAI(color, difficulty);
};

document.getElementById("hostGame").onclick = hostMultiplayer;
document.getElementById("joinGame").onclick = joinMultiplayer;
document.getElementById("leaveGame").onclick = leaveMultiplayer;

document.getElementById("closeMulti").onclick = () => {
  document.getElementById("multiplayerPanel").classList.add("hidden");
};

// Prevent accidental stale promotion modal
document.getElementById("promotionModal").onclick = e => {
  if (e.target.id === "promotionModal") e.currentTarget.classList.add("hidden");
};

render();

const joinGame2 = document.getElementById("joinGame2");
if (joinGame2) joinGame2.onclick = joinMultiplayer;
