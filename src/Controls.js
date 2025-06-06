import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";

export default class Controls {
  constructor(gl, camera, rotation = [0, 0, 0]) {
    this.canvas = gl.canvas;
    this.camera = camera;

    this.mouse = new Vector3(); // will use as vector2
    this.rotation = new Vector3(rotation);
    this.matrix = new Matrix4();
    this.dragging = false;

    // Movement properties
    this.keys = {};
    this.moveSpeed = 0.5;
    this.fastMoveSpeed = 1.5;
    this.mouseSensitivity = 50;

    this.setHandlers();
  }

  setHandlers() {
    // Mouse controls (existing)
    this.canvas.onmousedown = (e) => {
      this.dragging = true;

      let x = (e.clientX / e.target.clientWidth) * 2.0 - 1.0;
      let y = (-e.clientY / e.target.clientHeight) * 2.0 + 1.0;

      this.mouse.elements.set([x, y, 0]);
    };

    this.canvas.onmouseup = this.canvas.onmouseleave = (e) => {
      this.dragging = false;
    };

    this.canvas.onmousemove = (e) => {
      let x = (e.clientX / e.target.clientWidth) * 2.0 - 1.0;
      let y = (-e.clientY / e.target.clientHeight) * 2.0 + 1.0;

      if (this.dragging) {
        let dx = x - this.mouse.elements[0];
        let dy = y - this.mouse.elements[1];

        this.rotation.elements[0] -= dy * this.mouseSensitivity;
        this.rotation.elements[1] += dx * this.mouseSensitivity;

        this.mouse.elements.set([x, y, 0]);
      }
    };

    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomSpeed = 2.0;
      const forward = this.getForwardVector();

      if (e.deltaY < 0) {
        // Zoom in
        this.camera.position.elements[0] += forward[0] * zoomSpeed;
        this.camera.position.elements[1] += forward[1] * zoomSpeed;
        this.camera.position.elements[2] += forward[2] * zoomSpeed;
      } else {
        // Zoom out
        this.camera.position.elements[0] -= forward[0] * zoomSpeed;
        this.camera.position.elements[1] -= forward[1] * zoomSpeed;
        this.camera.position.elements[2] -= forward[2] * zoomSpeed;
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  getForwardVector() {
    const rx = (this.camera.rotation.elements[0] * Math.PI) / 180;
    const ry = (this.camera.rotation.elements[1] * Math.PI) / 180;

    return [
      -Math.sin(ry) * Math.cos(rx),
      Math.sin(rx),
      -Math.cos(ry) * Math.cos(rx),
    ];
  }

  getRightVector() {
    const ry = (this.camera.rotation.elements[1] * Math.PI) / 180;

    return [Math.cos(ry), 0, Math.sin(ry)];
  }

  handleMovement() {
    const currentSpeed =
      this.keys["ShiftLeft"] || this.keys["ShiftRight"]
        ? this.fastMoveSpeed
        : this.moveSpeed;

    const forward = this.getForwardVector();
    const right = this.getRightVector();

    let movement = [0, 0, 0];

    // WASD movement
    if (this.keys["KeyW"]) {
      movement[0] += forward[0] * currentSpeed;
      movement[1] += forward[1] * currentSpeed;
      movement[2] += forward[2] * currentSpeed;
    }
    if (this.keys["KeyS"]) {
      movement[0] -= forward[0] * currentSpeed;
      movement[1] -= forward[1] * currentSpeed;
      movement[2] -= forward[2] * currentSpeed;
    }
    if (this.keys["KeyA"]) {
      movement[0] -= right[0] * currentSpeed; // A moves left (subtract right vector)
      movement[1] -= right[1] * currentSpeed;
      movement[2] -= right[2] * currentSpeed;
    }
    if (this.keys["KeyD"]) {
      movement[0] += right[0] * currentSpeed; // D moves right (add right vector)
      movement[1] += right[1] * currentSpeed;
      movement[2] += right[2] * currentSpeed;
    }

    // QE for up/down
    if (this.keys["KeyQ"]) {
      movement[1] -= currentSpeed; // Move down
    }
    if (this.keys["KeyE"]) {
      movement[1] += currentSpeed; // Move up
    }

    // Arrow keys as alternative
    if (this.keys["ArrowUp"]) {
      movement[0] += forward[0] * currentSpeed;
      movement[1] += forward[1] * currentSpeed;
      movement[2] += forward[2] * currentSpeed;
    }
    if (this.keys["ArrowDown"]) {
      movement[0] -= forward[0] * currentSpeed;
      movement[1] -= forward[1] * currentSpeed;
      movement[2] -= forward[2] * currentSpeed;
    }
    if (this.keys["ArrowLeft"]) {
      movement[0] -= right[0] * currentSpeed;
      movement[1] -= right[1] * currentSpeed;
      movement[2] -= right[2] * currentSpeed;
    }
    if (this.keys["ArrowRight"]) {
      movement[0] += right[0] * currentSpeed;
      movement[1] += right[1] * currentSpeed;
      movement[2] += right[2] * currentSpeed;
    }

    // Apply movement
    this.camera.position.elements[0] += movement[0];
    this.camera.position.elements[1] += movement[1];
    this.camera.position.elements[2] += movement[2];
  }

  update() {
    this.handleMovement();

    // Smooth camera rotation (existing code)
    let x =
      0.8 * this.camera.rotation.elements[0] + 0.2 * this.rotation.elements[0];
    let y =
      0.8 * this.camera.rotation.elements[1] + 0.2 * this.rotation.elements[1];

    this.camera.rotation.elements.set([x, y, 0]);

    // Update camera matrices
    this.camera.calculateViewProjection();
  }
}
