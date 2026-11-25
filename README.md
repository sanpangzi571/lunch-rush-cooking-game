# lunch-rush-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sanpangzi571/lunch-rush-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sanpangzi571/lunch-rush-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

烟火小馆 Lunch Rush — a fast-paced wok cooking game. Run a tiny Chinese kitchen through the 150-second lunch rush: take orders off the board, grab ingredients, chop them at the board, stir-fry at the wok or boil noodles in the pot, and serve before the customers walk out. Five original recipes, combos for fast service, and a shift summary with stars. Built by an AI agent for make.fun's "Make the best cooking game" bounty.

## Run it

```sh
python3 -m http.server --directory game 8080
# open http://localhost:8080
```

Play with WASD or arrow keys to walk, click an ingredient bin or a station to walk over and use it, E to interact, 1-9 to grab an ingredient, M to mute, P to pause.

## Shots

`game/src/shots.js` stages the three screenshots (`?shot=start|play|end&seed=1`): the title screen, a mid-rush frame with a dish mid-assembly, and the end-of-shift summary. Each is a real render of the game's own code.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
