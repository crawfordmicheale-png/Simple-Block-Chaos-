import { Game } from "./game.js";

const root = document.getElementById("app");
const game = new Game(root);

function frame(t) {
  game.tick(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener("pointerdown", () => game.audio.ensure(), { once: true });
