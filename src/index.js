/**
 * With codesandbox we import our functions from the files they live in
 * rather than import that file in the HTML file like we usually do
 *
 * ALSO NOTE that there is NO main function being called.
 * index.js IS your main function and the code written in it is run
 * on page load.
 */
import "./styles.css";
import { initShaders } from "../lib/cuon-utils";
import getContext from "./Context";
import Camera from "./Camera";
import Controls from "./Controls";
import Ocean from "./Ocean";
import Sky from "./Sky";
import Ship from "./Ship";

const VERTEX_SHADER = `
  precision mediump float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec3 normal;
  
  uniform mat4 modelMatrix;
  uniform mat4 normalMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  
  varying vec3 vNormal;
  
  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
  }
  `;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vNormal;

  void main() {
    vec3 norm = normalize(vNormal);
    
    gl_FragColor = vec4(norm, 1.0);
  }
`;

// Get the rendering context for WebGL
var gl = getContext();

if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER))
  console.error("Could not init shaders");

const camera = new Camera([0, 3, 45], [0, 1, 0]);
const controls = new Controls(gl, camera);
const ship = new Ship();

function tick() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  Ocean.render(gl, camera);
  Sky.render(gl, camera);
  ship.render(gl, camera);
  controls.update();

  requestAnimationFrame(tick);
}

tick();

// Global polar scene state with wind speed control
window.polarScene = {
  isDay: true, // Start with day
  windSpeed: 0.8, // Start with moderate wind
};

// Enhanced scene controls including wind speed
document.addEventListener("keydown", function (event) {
  switch (event.key.toLowerCase()) {
    case " ": // Spacebar to toggle
    case "enter":
      window.polarScene.isDay = !window.polarScene.isDay;
      console.log(
        window.polarScene.isDay ? "Switched to DAY" : "Switched to NIGHT"
      );
      break;
    case "1": // 1 for day
      window.polarScene.isDay = true;
      console.log("Switched to DAY");
      break;
    case "2": // 2 for night
      window.polarScene.isDay = false;
      console.log("Switched to NIGHT");
      break;
    case "3": // 3 for calm wind
      window.polarScene.windSpeed = 0.2;
      console.log("Wind: CALM (gentle atmospheric movement)");
      break;
    case "4": // 4 for moderate wind
      window.polarScene.windSpeed = 0.8;
      console.log("Wind: MODERATE (normal polar conditions)");
      break;
    case "5": // 5 for strong wind
      window.polarScene.windSpeed = 1.5;
      console.log("Wind: STRONG (stormy Arctic conditions)");
      break;
    case "6": // 6 for extreme wind
      window.polarScene.windSpeed = 2.2;
      console.log("Wind: EXTREME (blizzard conditions!)");
      break;
  }
});

// Display ALL controls to user
console.log("🚢❄️ HMS TERROR ARCTIC EXPLORER ❄️🚢");
console.log("");
console.log("🎮 MOVEMENT CONTROLS:");
console.log("W/S - Move forward/backward");
console.log("A/D - Move left/right");
console.log("Q/E - Move down/up");
console.log("Arrow Keys - Alternative movement");
console.log("SHIFT + movement - Move faster");
console.log("Mouse drag - Look around");
console.log("Mouse wheel - Zoom in/out");
console.log("");
console.log("🌅 SCENE CONTROLS:");
console.log("SPACEBAR/ENTER - Toggle day/night");
console.log("1 - Day mode");
console.log("2 - Night mode");
console.log("");
console.log("🌬️ WIND & ATMOSPHERIC CONTROLS:");
console.log("3 - Calm wind (gentle movement)");
console.log("4 - Moderate wind (normal conditions)");
console.log("5 - Strong wind (stormy conditions)");
console.log("6 - Extreme wind (blizzard conditions!)");
console.log("");
console.log("🧭 EXPLORATION TIPS:");
console.log("- Fly around the ship to see details");
console.log("- Get close to see wood grain & rigging");
console.log("- Try both day & night for different atmospheres");
console.log("- Look up at the aurora during night!");
console.log("- Try different wind speeds to see atmospheric effects!");
console.log("- Strong winds create dramatic fog and snow movement!");
console.log("");
console.log("Currently:", window.polarScene.isDay ? "DAY" : "NIGHT");
console.log(
  "Wind Speed:",
  window.polarScene.windSpeed === 0.2
    ? "CALM"
    : window.polarScene.windSpeed === 0.8
    ? "MODERATE"
    : window.polarScene.windSpeed === 1.5
    ? "STRONG"
    : "EXTREME"
);
