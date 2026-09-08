# ♟️ Royal Chess

A complete browser-based chess game built with **HTML, CSS and JavaScript**, now featuring **VS AI** and **online multiplayer**.

Royal Chess is designed for GitHub Pages. No Node.js or database is required for normal local play and AI games.

> **Multiplayer note:** online multiplayer uses PeerJS for realtime browser-to-browser connections, so players need an internet connection.

---

## 🚀 Features

### ♟️ Full Chess Rules

- King
- Queen
- Rook
- Bishop
- Knight
- Pawn
- Normal moves
- Captures
- Pawn double-step
- Pawn diagonal captures
- Knight jumps
- Castling
- En passant
- Promotion
- Check
- Checkmate
- Stalemate
- Threefold repetition
- 50-move rule
- Insufficient material
- Resignation
- Draw by agreement

### 🤖 VS AI

Play against the built-in browser AI.

Difficulty levels:

- **Easy** — weaker and more unpredictable
- **Medium** — searches further and considers tactics
- **Hard** — deeper minimax search

You can choose:

- Play as White
- Play as Black

The AI supports the same legal chess move system as normal games, including:

- Captures
- Castling
- En passant
- Promotion
- Check
- Checkmate

The AI runs directly in your browser.

### 🌐 Online Multiplayer

Create or join a multiplayer room.

Features include:

- Host a game
- Generate a room code
- Join with a room code
- Automatic White/Black assignment
- Realtime move synchronization
- Board synchronization
- Promotion synchronization
- Resignation synchronization
- Draw result synchronization
- Disconnect detection
- Reconnect by creating/joining the room again

### 🎨 Interface

- Legal move highlighting
- Capture highlighting
- Last-move highlighting
- Check highlighting
- Move history
- Algebraic-style notation
- Undo
- Redo
- Board flipping
- Responsive mobile layout
- Rules and move-types guide

---

# 📁 Project Structure

```text
Royal-Chess/
│
├── index.html
├── style.css
├── chess.js
├── ai.js
├── app.js
└── README.md
```

---

# 📄 Files

## `index.html`

The main webpage.

Contains:

- Chess board
- Game controls
- AI menu
- Multiplayer controls
- Move list
- Game information
- Rules
- Promotion menu

---

## `style.css`

Controls the entire visual design.

Includes:

- Board styling
- Buttons
- Panels
- Mobile layout
- Move indicators
- Check indicators
- AI interface
- Multiplayer interface

---

## `chess.js`

The chess engine.

It handles the actual rules of chess:

- Legal move generation
- Piece movement
- Captures
- Castling
- En passant
- Promotion
- Check
- Checkmate
- Stalemate
- Draw detection
- Undo/redo state

---

## `ai.js`

The chess AI.

It uses a client-side **minimax search with alpha-beta pruning**.

It evaluates:

- Material
- Piece activity
- Mobility
- Pawn advancement
- Check situations
- Captures
- Promotion opportunities

No AI server is required.

---

## `app.js`

Connects everything together.

It handles:

- Board interaction
- Game modes
- AI turns
- Multiplayer connections
- Room codes
- Move synchronization
- UI updates
- Move history
- Promotion
- Game controls

---

# 🤖 Playing VS AI

Click:

```text
🤖 VS AI
```

Choose your colour:

```text
White
Black
```

Then choose:

```text
Easy
Medium
Hard
```

Click:

```text
Start AI Game
```

The game will begin immediately.

If you choose Black, the AI will make the first move.

---

# 🌐 Playing Multiplayer

## Host a Game

Click:

```text
🌐 Host Multiplayer
```

A room code will be generated.

Give that code to your opponent.

For example:

```text
A7K92P
```

Your opponent then enters that code and joins.

The host is automatically:

```text
White
```

The joining player is:

```text
Black
```

---

## Join a Game

Click:

```text
🔗 Join Multiplayer
```

Enter the six-character room code.

Then click:

```text
Join
```

Once connected, both players can make moves in realtime.

---

# 🌍 Multiplayer Technology

Multiplayer uses:

**PeerJS**

PeerJS provides the browser-to-browser connection used to transfer:

- Moves
- Promotion choices
- Game results
- Board state

The chess engine itself remains local in each player's browser.

---

# ⚠️ Multiplayer Requirements

Multiplayer requires:

- An internet connection
- A modern web browser
- JavaScript enabled

Because PeerJS is loaded from a CDN, the multiplayer feature will not work if the browser cannot access the PeerJS library.

Local chess and VS AI do not require a multiplayer connection.

---

# 🏰 Castling

Kingside:

```text
White: King e1 → g1
       Rook h1 → f1
```

Queenside:

```text
White: King e1 → c1
       Rook a1 → d1
```

The same rules apply to Black.

The King cannot castle:

- While in check
- Through check
- Into check
- If the King has moved
- If the relevant Rook has moved
- If pieces block the path

---

# 🎯 En Passant

En passant is available when an opposing pawn moves two squares forward and lands beside your pawn.

The capture must happen immediately on the following move.

---

# 👑 Promotion

When a pawn reaches the opposite end of the board, it can become:

- Queen
- Rook
- Bishop
- Knight

---

# ⚔️ Check

A King is in check when it is attacked by an enemy piece.

The player must remove the check before making another move.

---

# 💀 Checkmate

Checkmate occurs when:

1. A King is in check.
2. The player has no legal move that removes the check.

That player loses.

---

# 🤝 Draws

Royal Chess detects several draw conditions:

### Stalemate

No legal moves, but the King is not in check.

### Threefold Repetition

The same position occurs three times.

### 50-Move Rule

100 half-moves occur without a pawn move or capture.

### Insufficient Material

There is not enough material to produce a possible checkmate.

### Agreement

Players can agree to a draw.

---

# ↩️ Undo / Redo

Undo and redo are available in local games and AI games.

They are disabled during multiplayer games because both players must stay synchronized.

---

# 🔄 Flip Board

Click:

```text
Flip Board
```

to switch the board orientation.

This is especially useful when playing as Black.

---

# 🌐 GitHub Pages Installation

## 1. Create a Repository

Create a GitHub repository.

Example:

```text
Royal-Chess
```

---

## 2. Upload These Files

Upload:

```text
index.html
style.css
chess.js
ai.js
app.js
README.md
```

Make sure all files are in the repository root.

---

## 3. Enable GitHub Pages

Open:

```text
Settings → Pages
```

Under **Build and deployment**, choose:

```text
Deploy from a branch
```

Select:

```text
main
```

and:

```text
/ (root)
```

Then click:

```text
Save
```

---

# 🔗 Your Website

Your GitHub Pages address will normally be:

```text
https://YOUR-USERNAME.github.io/Royal-Chess/
```

Replace:

```text
YOUR-USERNAME
```

with your GitHub username.

---

# 📱 Mobile Support

Royal Chess is responsive and works on:

- iPhone
- iPad
- Android phones
- Android tablets
- Windows
- macOS
- Linux
- Desktop browsers

---

# 🧰 Technologies

Royal Chess uses:

- HTML5
- CSS3
- JavaScript
- PeerJS

The chess engine and AI are written specifically for this project.

---

# 🔒 Privacy

Local games and AI games are processed inside the browser.

Multiplayer uses PeerJS to establish a connection between players.

Royal Chess does not require a user account or database.

---

# 🚀 Future Ideas

Possible future additions:

- 🏆 ELO ratings
- 👤 Accounts
- 📊 Statistics
- 🥇 Leaderboards
- ⏱️ Chess clocks
- 💾 Save games
- 📤 PGN export
- 📥 PGN import
- 🧩 Chess puzzles
- 🤖 Stronger AI
- 🎨 Custom boards
- ♟️ Custom pieces
- 🔊 Chess sounds
- 🏅 Achievements
- 👥 Spectator mode
- 🏟️ Multiplayer tournaments
- 💬 Multiplayer chat
- 🔐 Private/password rooms

---

# ♟️ Royal Chess

**Think ahead. Make your move. Rule the board.**

```text
♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜
♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟

        ♟
      ROYAL
      CHESS

♙ ♙ ♙ ♙ ♙ ♙ ♙ ♙
♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖
```
