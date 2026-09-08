/* Royal Chess AI — reliable client-side minimax */
const AI_VALUES = { P:100, N:320, B:330, R:500, Q:900, K:20000 };

function aiCloneGame(source) {
  const g = new ChessGame();
  g.restore(source.cloneState());
  g.history = [];
  g.future = [];
  g.positions = new Map([[g.positionKey(), 1]]);
  return g;
}

function aiEvaluate(g, aiColor) {
  if (g.result) {
    if (g.result.includes('wins by checkmate')) {
      const winner = g.result.startsWith('White') ? 'w' : 'b';
      return winner === aiColor ? 1000000 : -1000000;
    }
    return 0;
  }
  let score = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p=g.board[r][c]; if(!p) continue;
    let v=AI_VALUES[p.type];
    if(p.type==='P') v += (p.color==='w' ? 6-r : r-1)*6;
    if(r>=2&&r<=5&&c>=2&&c<=5) v+=4;
    score += p.color===aiColor ? v : -v;
  }
  const myMoves=g.allLegalMoves(aiColor).length;
  const opp=g.opposite(aiColor);
  const oppMoves=g.allLegalMoves(opp).length;
  score += (myMoves-oppMoves)*2;
  if(g.inCheck(opp)) score+=35;
  if(g.inCheck(aiColor)) score-=35;
  return score;
}

function aiOrderMoves(g,moves){
  return [...moves].sort((a,b)=>{
    const score=m=>{
      const target=g.board[m.to[0]][m.to[1]];
      let s=0;
      if(target) s+=AI_VALUES[target.type]*10-AI_VALUES[m.piece];
      if(m.enPassant) s+=900;
      if(m.promotion) s+=8000;
      if(m.castle) s+=50;
      return s;
    };
    return score(b)-score(a);
  });
}

function aiSearch(g,depth,alpha,beta,aiColor){
  if(depth<=0 || g.result) return aiEvaluate(g,aiColor);
  const moves=aiOrderMoves(g,g.allLegalMoves(g.turn));
  if(!moves.length) return aiEvaluate(g,aiColor);
  const max=g.turn===aiColor;
  if(max){
    let best=-Infinity;
    for(const m of moves){
      const n=aiCloneGame(g);
      if(!n.makeMove(m,m.promotion?'Q':'Q')) continue;
      const v=aiSearch(n,depth-1,alpha,beta,aiColor);
      if(v>best) best=v;
      if(v>alpha) alpha=v;
      if(beta<=alpha) break;
    }
    return best;
  }
  let best=Infinity;
  for(const m of moves){
    const n=aiCloneGame(g);
    if(!n.makeMove(m,m.promotion?'Q':'Q')) continue;
    const v=aiSearch(n,depth-1,alpha,beta,aiColor);
    if(v<best) best=v;
    if(v<beta) beta=v;
    if(beta<=alpha) break;
  }
  return best;
}

function chooseAIMove(g,aiColor,difficulty='medium'){
  if(g.turn!==aiColor) return null;
  const moves=aiOrderMoves(g,g.allLegalMoves(aiColor));
  if(!moves.length) return null;
  if(difficulty==='easy' && Math.random()<0.55)
    return moves[Math.floor(Math.random()*Math.min(moves.length,8))];
  const depth=difficulty==='hard'?3:difficulty==='medium'?2:1;
  let best=null,bestScore=-Infinity;
  for(const m of moves){
    const n=aiCloneGame(g);
    if(!n.makeMove(m,m.promotion?'Q':'Q')) continue;
    const s=aiSearch(n,depth-1,-Infinity,Infinity,aiColor)+(Math.random()*0.01);
    if(s>bestScore){bestScore=s;best=m;}
  }
  return best || moves[0];
}
