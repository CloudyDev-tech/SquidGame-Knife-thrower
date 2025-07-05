# SquidGame Knife Thrower

A multiplayer browser game where players compete in knife throwing challenges inspired by Squid Game. Players can choose from different characters and test their throwing skills in real-time against others.

## Game Concept
- Inspired by the deadly challenges from Squid Game
- Players throw knives at targets to score points
- Last player standing wins the round
- Simple controls with mouse and keyboard

## Features
- Multiplayer gameplay (connect with friends)
- 7 unique playable characters
- Responsive character selection screen
- Real-time score tracking
- Smooth canvas animations

## Installation
1. Clone the repository: `git clone [repo-url]`
2. Install dependencies: `npm install`
3. Start server: `node src/server.js`
4. Open `public/index.html` in browser

## How to Play
1. Select your character
2. Aim with mouse cursor
3. Click to throw knife
4. Score points by hitting targets
5. Avoid obstacles

## Technical Details
- Built with Node.js for backend
- Socket.io for real-time multiplayer
- HTML5 Canvas for game rendering
- Vanilla JavaScript for game logic

## Errors Faced
1. Character selection layout issues (fixed with CSS flex)
2. Image loading problems (fixed path corrections)
3. Socket.io connection drops (added reconnection logic)
4. Canvas performance (optimized rendering)
