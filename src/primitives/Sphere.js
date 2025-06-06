import { Vector3, Matrix4 } from "../../lib/cuon-matrix-cse160";
import { createProgram } from "../../lib/cuon-utils";
import { VertexShader, FragmentShader } from "../shaders/Normal";

export default class Sphere {
  constructor(radius = 0.5, widthSegments = 3, heightSegments = 2) {
    // buffers
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.uvBuffer = null;
    this.normalBuffer = null;

    // shader programs
    this.vertexShader = VertexShader;
    this.fragmentShader = FragmentShader;
    this.program = null;

    // data arrays
    this.vertices = null;
    this.indices = null;
    this.uvs = null;
    this.normals = null;

    // transformations
    this.position = new Vector3([0, 0, 0]);
    this.rotation = new Vector3([0, 0, 0]);
    this.scale = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    this.generateSphere(radius, widthSegments, heightSegments);
  }

  setShaders(vertShader, fragShader) {
    this.vertexShader = vertShader;
    this.fragmentShader = fragShader;

    this.program = null;
  }

  generateSphere(radius, widthSegments, heightSegments) {
    let index = 0;
    const grid = [];

    const vertex = new Vector3();
    const normal = new Vector3();

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let j = 0; j <= heightSegments; j++) {
      const row = [];

      const v = j / heightSegments;

      let uOffset = 0;
      // special cases for poles
      if (j === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (j === heightSegments) {
        uOffset = -0.5 / widthSegments;
      }

      for (let i = 0; i <= widthSegments; i++) {
        const u = i / widthSegments;

        vertex.elements[0] =
          -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);

        vertex.elements[1] = radius * Math.cos(v * Math.PI);

        vertex.elements[2] =
          radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);

        vertices.push(...vertex.elements);
        normal.set(vertex).normalize();

        normals.push(...normal.elements);

        uvs.push(u + uOffset, 1 - v);

        row.push(index++);
      }

      grid.push(row);
    }

    for (let j = 0; j < heightSegments; j++) {
      for (let i = 0; i < widthSegments; i++) {
        const a = grid[j][i + 1];
        const b = grid[j][i];
        const c = grid[j + 1][i];
        const d = grid[j + 1][i + 1];

        if (j !== 0) indices.push(a, b, d);
        if (j !== heightSegments - 1) indices.push(b, c, d);
      }
    }

    this.vertices = new Float32Array(vertices);
    this.indices = new Uint16Array(indices);
    this.uvs = new Float32Array(uvs);
    this.normals = new Float32Array(normals);
  }

  calculateMatrix() {
    let [x, y, z] = this.position.elements;
    let [rx, ry, rz] = this.rotation.elements;
    let [sx, sy, sz] = this.scale.elements;

    this.modelMatrix
      .setTranslate(x, y, z)
      .rotate(rx, 1, 0, 0)
      .rotate(ry, 0, 1, 0)
      .rotate(rz, 0, 0, 1)
      .scale(sx, sy, sz);

    this.normalMatrix.set(this.modelMatrix).invert().transpose();
  }

  render(gl, camera) {
    // only render once a valid shader program is in use
    if (this.program === null) {
      this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

      if (!this.program) {
        console.error("could not compile shader");
        return; // Exit early if shader compilation failed
      }
    }

    // Additional check to make sure program is valid
    if (!this.program) {
      console.error("Invalid shader program");
      return;
    }

    // tell webGL to use this objects program
    gl.useProgram(this.program);

    // ENHANCED UNIFORM HANDLING - Updated for Wind Speed Control
    try {
      if (this.program) {
        // Time uniform
        const uTime = gl.getUniformLocation(this.program, "uTime");
        if (uTime !== null && uTime !== -1) {
          gl.uniform1f(uTime, performance.now() / 1000);
        }

        // Day/night control uniform
        const uIsDay = gl.getUniformLocation(this.program, "uIsDay");
        if (uIsDay !== null && uIsDay !== -1) {
          const isDayValue =
            window.polarScene && window.polarScene.isDay ? 1.0 : 0.0;
          gl.uniform1f(uIsDay, isDayValue);
        }

        // NEW: Wind speed uniform
        const uWindSpeed = gl.getUniformLocation(this.program, "uWindSpeed");
        if (uWindSpeed !== null && uWindSpeed !== -1) {
          const windValue =
            window.polarScene && window.polarScene.windSpeed !== undefined
              ? window.polarScene.windSpeed
              : 0.8;
          gl.uniform1f(uWindSpeed, windValue);
        }
      }
    } catch (error) {
      // Silently ignore if uniform doesn't exist or other issues
      console.warn("Uniform handling error:", error);
    }

    if (this.vertexBuffer === null) this.vertexBuffer = gl.createBuffer();
    if (this.indexBuffer === null) this.indexBuffer = gl.createBuffer();
    if (this.uvBuffer === null) this.uvBuffer = gl.createBuffer();
    if (this.normalBuffer === null) this.normalBuffer = gl.createBuffer();

    this.calculateMatrix();
    camera.calculateViewProjection();

    const position = gl.getAttribLocation(this.program, "position");
    const uv = gl.getAttribLocation(this.program, "uv");
    const normal = gl.getAttribLocation(this.program, "normal");
    const modelMatrix = gl.getUniformLocation(this.program, "modelMatrix");
    const normalMatrix = gl.getUniformLocation(this.program, "normalMatrix");
    const viewMatrix = gl.getUniformLocation(this.program, "viewMatrix");
    const projectionMatrix = gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );

    gl.uniformMatrix4fv(modelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(normalMatrix, false, this.normalMatrix.elements);
    gl.uniformMatrix4fv(viewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(
      projectionMatrix,
      false,
      camera.projectionMatrix.elements
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uv);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.DYNAMIC_DRAW);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}
