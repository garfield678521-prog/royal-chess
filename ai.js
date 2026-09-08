/* Royal Chess AI - client-side minimax engine */
const AI_VALUES = {
  P: 100,
  N: 320,
  B: 330,
  R: 500,
  Q: 900,
  K: 20000
};

function aiCloneGame(source) {
  const g = new ChessGame();
  g.restore(source.cloneState());
  g.history = [];
  g.future = [];
  g.positions = new Map();
  g.positions.set(g.positionKey(), 1);
  return g;
}

function aiEvaluate(game, aiColor) {
  if (game.result) {
    if (game.result.includes("wins by checkmate")) {
      const winner = game.result.startsWith("White") ? "w" : "b";
      return winner === aiColor ? 1000000 : -1000000;
    }
    return 0;
  }

  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = game.board[r][c];
      if (!p) continue;
      let value = AI_VALUES[p.type];

      // Small positional bonuses make the AI less random.
      if (p.type === "P") {
        const advance = p.color === "w" ? 6 - r : r - 1;
        value += advance * 6;
      }
      if (r >= 2 && r <= 5 && c >= 2 && c <= 5) value += 4;

      score += p.color === aiColor ? value : -value;
    }
  }

  const mobility = game.allLegalMoves(aiColor).length;
  const enemyMobility = game.allLegalMoves(game.opposite(aiColor)).length;
  score += (mobility - enemyMobility) * 2;

  if (game.inCheck(game.opposite(aiColor))) score += 35;
  if (game.inCheck(aiColor)) score -= 35;

  return score;
}

function aiMoveKey(m) {
  return [
    m.from[0], m.from[1], m.to[0], m.to[1],
    m.castle || "", m.enPassant ? "ep" : "", m.promotion ? "p" : ""
  ].join(",");
}

function aiOrderMoves(game, moves) {
  return [...moves].sort((a, b) => {
    const score = (m) => {
      let s = 0;
      const target = game.board[m.to[0]][m.to[1]];
      if (target) s += AI_VALUES[target.type] * 10 - AI_VALUES[m.piece];
      if (m.promotion) s += 8000;
      if (m.castle) s += 50;
      return s;
    };
    return score(b) - score(a);
  });
}

function aiSearch(game, depth, alpha, beta, maximizingColor) {
  if (depth === 0 || game.result) {
    return aiEvaluate(game, maximizingColor);
  }

  const moves = aiOrderMoves(game, game.allLegalMoves(game.turn));
  if (!moves.length) return aiEvaluate(game, maximizingColor);

  const maximizing = game.turn === maximizingColor;

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = aiCloneGame(game);
      next.makeMove(move, move.promotion ? "Q" : "Q");
      const value = aiSearch(next, depth - 1, alpha, beta, maximizingColor);
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = aiCloneGame(game);
    next.makeMove(move, move.promotion ? "Q" : "Q");
    const value = aiSearch(next, depth - 1, alpha, beta, maximizingColor);
    best = Math.min(best, value);
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return best;
}

function chooseAIMove(game, aiColor, difficulty = "medium") {
  const depth = difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2;
  const moves = aiOrderMoves(game, game.allLegalMoves(aiColor));
  if (!moves.length) return null;

  // Easy occasionally chooses a weaker legal move.
  if (difficulty === "easy" && Math.random() < 0.45) {
    return moves[Math.floor(Math.random() * Math.min(moves.length, 8))];
  }

  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = aiCloneGame(game);
    next.makeMove(move, move.promotion ? "Q" : "Q");
    const score = aiSearch(next, depth - 1, -Infinity, Infinity, aiColor);

    // Tiny randomness prevents identical games.
    const adjusted = score + (Math.random() * 0.5);
    if (adjusted > bestScore) {
      bestScore = adjusted;
      bestMove = move;
    }
  }

  return bestMove;
}
