# 🎮 Vampire Survivors Style Game - React + Canvas

A complete, production-ready **Vampire Survivors / swarm-style game boilerplate** built with React and HTML5 Canvas. Features smooth 60fps gameplay, excellent gamefeel, and a clean, extensible architecture.

## ✨ Features

- **Smooth 60fps Game Loop** - Uses `requestAnimationFrame` with delta time
- **Canvas Rendering** - All gameplay rendered on HTML5 Canvas
- **Player Controls** - WASD movement + mouse aiming
- **Auto-Attack System** - Automatically fires at nearest enemy
- **Enemy Swarm System** - Periodic spawn waves with increasing difficulty
- **Collision Detection** - Player ↔ enemies, projectiles ↔ enemies
- **Damage & Knockback** - Hit reactions with knockback physics
- **Excellent Gamefeel**:
  - Camera shake on hit
  - Screen flash effects
  - Invulnerability frames with visual feedback
  - Projectile trails
  - Enemy hit flash
  - Smooth camera following
- **Clean Architecture** - Separation between logic, rendering, and systems

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The game will open at `http://localhost:3000`

## 🎯 Controls

- **WASD** or **Arrow Keys** - Move player
- **Mouse** - Aim direction (player auto-attacks nearest enemy)
- **ESC** - Pause/Resume game
- **R** - Restart (when game over)

## 📁 Project Structure

```
src/
├── game/
│   ├── engine.js              # Main game loop & state management
│   ├── entities/
│   │   ├── player.js          # Player entity with movement & combat
│   │   ├── enemy.js           # Enemy AI & different enemy types
│   │   └── projectile.js      # Projectile physics & rendering
│   └── systems/
│       ├── spawnSystem.js     # Enemy spawning & difficulty scaling
│       └── collisionSystem.js # Collision detection & resolution
├── components/
│   └── GameCanvas.jsx         # Main React canvas component
├── hooks/
│   └── useGame.js             # React hook for game lifecycle
├── utils/
│   └── math.js                # Math utilities (lerp, easing, etc.)
└── App.jsx                    # Main app component
```

## 🎨 Game Architecture

### Game Engine (`engine.js`)
- Main game loop using `requestAnimationFrame`
- Delta time calculation for frame-rate independent movement
- Input handling (keyboard + mouse)
- Camera system with smooth following and shake effects
- Screen flash effects
- Game state management (running, paused, game over)

### Entities
- **Player** - Health, movement, aiming, invulnerability, attack cooldown
- **Enemy** - Multiple types (basic, fast, tank), AI movement, health
- **Projectile** - Physics, lifetime, trails, piercing capability

### Systems
- **SpawnSystem** - Manages enemy waves, difficulty scaling over time
- **CollisionSystem** - Handles all collision detection and damage application

### Utilities
- Math functions: `lerp()`, `clamp()`, `distance()`, `normalize()`
- Easing functions: `easeInOutCubic()`, `easeOutElastic()`, etc.
- Angle utilities: `angleBetween()`, `normalizeAngle()`
- Spawn helpers: `randomSpawnOnEdge()`, `randomSpawnAroundRadius()`

## 🔧 Customization

### Adding New Enemy Types

Edit `src/game/entities/enemy.js`:

```javascript
case 'your-type':
  this.maxHealth = 30;
  this.speed = 100;
  this.damage = 15;
  this.radius = 14;
  this.color = '#00FF00';
  break;
```

### Modifying Player Stats

Edit `src/game/entities/player.js`:

```javascript
this.speed = 200;           // Movement speed
this.maxHealth = 100;       // Maximum health
this.damage = 10;           // Base damage
this.attackCooldown = 0.4;  // Time between attacks
```

### Adjusting Difficulty

Edit `src/game/systems/spawnSystem.js`:

```javascript
this.spawnInterval = 2.0;              // Seconds between spawns
this.baseEnemiesPerSpawn = 2;          // Starting enemies per wave
this.difficultyIncreaseInterval = 30;  // Seconds between difficulty increases
```

## 🎯 Future Improvements (TODOs)

The codebase includes TODO markers for planned enhancements:

- [ ] **Power-ups & Upgrades** - Leveling system, stat upgrades
- [ ] **More Enemy Types** - Bosses, ranged enemies, special abilities
- [ ] **Weapon Variety** - Different attack patterns, AoE attacks
- [ ] **Particle Effects** - Death animations, impact effects
- [ ] **Sound Effects** - Audio feedback for hits, deaths, etc.
- [ ] **Persistent Stats** - High scores, unlockables
- [ ] **Mobile Support** - Touch controls
- [ ] **Better Difficulty Scaling** - Enemy speed/health increases over time
- [ ] **Experience Orbs** - XP drops from enemies
- [ ] **Multiple Weapons** - Simultaneous weapon systems

## 🛠️ Technical Details

### Performance
- Efficient collision detection using squared distance checks
- Entity pooling ready (arrays managed by systems)
- Canvas clearing and rendering optimized
- Delta time prevents physics issues on different frame rates

### Gamefeel Techniques
- **Camera Shake** - Intensity based on hit timing
- **Knockback** - Directional force with smooth decay
- **Hit Flash** - Brief color changes on damage
- **Screen Flash** - Full-screen overlay on player hit
- **Invulnerability Frames** - Visual flashing feedback
- **Smooth Camera** - Lerped following with offset
- **Projectile Trails** - Motion blur effect

### Code Quality
- Comprehensive JSDoc comments
- Clean separation of concerns
- Idiomatic React patterns
- Modular, extensible design
- No external game libraries

## 📝 License

This is a boilerplate project intended for educational and development purposes. Feel free to use it as a starting point for your own game!

## 🤝 Contributing

This is a learning project, but feel free to fork and expand it! Some ideas:
- Add your own enemy types
- Create new weapon systems
- Implement power-up mechanics
- Add visual effects and polish

---

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
