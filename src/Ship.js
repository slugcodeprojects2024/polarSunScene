import { Vector3, Matrix4 } from "../../lib/cuon-matrix-cse160";
import { createProgram } from "../../lib/cuon-utils";

export default class Ship {
  constructor() {
    // buffers
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.uvBuffer = null;
    this.normalBuffer = null;

    // shader programs
    this.vertexShader = null;
    this.fragmentShader = null;
    this.program = null;

    // data arrays
    this.vertices = null;
    this.indices = null;
    this.uvs = null;
    this.normals = null;

    // transformations
    this.position = new Vector3([0, 0.9, 0]);
    this.rotation = new Vector3([0, 0, 0]);
    this.scale = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();

    this.generateDetailedShip();
    this.createDetailedShaders();
  }

  generateDetailedShip() {
    const vertices = [];
    const indices = [];
    const uvs = [];
    const normals = [];
    let indexOffset = 0;

    // Helper function to add a detailed box with UVs and normals
    const addDetailedBox = (x, y, z, width, height, depth, uvScale = 1.0) => {
      const hw = width / 2,
        hh = height / 2,
        hd = depth / 2;

      // Box vertices with proper UVs
      const boxVerts = [
        // Front face (z+)
        x - hw,
        y - hh,
        z + hd,
        x + hw,
        y - hh,
        z + hd,
        x + hw,
        y + hh,
        z + hd,
        x - hw,
        y + hh,
        z + hd,
        // Back face (z-)
        x + hw,
        y - hh,
        z - hd,
        x - hw,
        y - hh,
        z - hd,
        x - hw,
        y + hh,
        z - hd,
        x + hw,
        y + hh,
        z - hd,
        // Top face (y+)
        x - hw,
        y + hh,
        z - hd,
        x - hw,
        y + hh,
        z + hd,
        x + hw,
        y + hh,
        z + hd,
        x + hw,
        y + hh,
        z - hd,
        // Bottom face (y-)
        x - hw,
        y - hh,
        z + hd,
        x - hw,
        y - hh,
        z - hd,
        x + hw,
        y - hh,
        z - hd,
        x + hw,
        y - hh,
        z + hd,
        // Right face (x+)
        x + hw,
        y - hh,
        z + hd,
        x + hw,
        y - hh,
        z - hd,
        x + hw,
        y + hh,
        z - hd,
        x + hw,
        y + hh,
        z + hd,
        // Left face (x-)
        x - hw,
        y - hh,
        z - hd,
        x - hw,
        y - hh,
        z + hd,
        x - hw,
        y + hh,
        z + hd,
        x - hw,
        y + hh,
        z - hd,
      ];

      vertices.push(...boxVerts);

      // Box indices
      const faces = [
        [0, 1, 2],
        [0, 2, 3], // front
        [4, 5, 6],
        [4, 6, 7], // back
        [8, 9, 10],
        [8, 10, 11], // top
        [12, 13, 14],
        [12, 14, 15], // bottom
        [16, 17, 18],
        [16, 18, 19], // right
        [20, 21, 22],
        [20, 22, 23], // left
      ];

      faces.forEach((face) => {
        indices.push(
          face[0] + indexOffset,
          face[1] + indexOffset,
          face[2] + indexOffset
        );
      });

      // UVs with proper scaling
      const faceUVs = [
        // Front, Back, Top, Bottom, Right, Left
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // front
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // back
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // top
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // bottom
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // right
        [0, 0, uvScale, 0, uvScale, uvScale, 0, uvScale], // left
      ];

      faceUVs.forEach((faceUV) => {
        uvs.push(
          faceUV[0],
          faceUV[1],
          faceUV[2],
          faceUV[3],
          faceUV[4],
          faceUV[5],
          faceUV[6],
          faceUV[7]
        );
      });

      // Proper normals for each face
      const faceNormals = [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1], // front
        [0, 0, -1],
        [0, 0, -1],
        [0, 0, -1],
        [0, 0, -1], // back
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0], // top
        [0, -1, 0],
        [0, -1, 0],
        [0, -1, 0],
        [0, -1, 0], // bottom
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0], // right
        [-1, 0, 0],
        [-1, 0, 0],
        [-1, 0, 0],
        [-1, 0, 0], // left
      ];

      faceNormals.forEach((normal) => {
        normals.push(...normal);
      });

      indexOffset += 24;
    };

    // MAIN HULL - more detailed
    addDetailedBox(0, 0, 0, 18, 2.5, 5.5, 2.0); // Main hull
    addDetailedBox(8, 0.2, 0, 5, 2, 4.5, 1.5); // Forward section
    addDetailedBox(-8, 0.2, 0, 5, 2, 4.5, 1.5); // Aft section

    // HULL DETAILS
    addDetailedBox(12, -0.5, 0, 3, 1.5, 3.5, 1.0); // Bow section
    addDetailedBox(14, -0.3, 0, 1.5, 1, 2, 0.5); // Bow point
    addDetailedBox(-12, -0.3, 0, 3, 2, 4, 1.0); // Stern section

    // DECK PLANKING (multiple pieces for detail)
    for (let i = -8; i <= 8; i += 2) {
      addDetailedBox(i, 1.3, 0, 1.8, 0.1, 5, 0.5); // Deck planks
    }

    // MASTS (more realistic proportions)
    addDetailedBox(6, 8, 0, 0.4, 16, 0.4, 0.2); // Main mast
    addDetailedBox(10, 7, 0, 0.35, 14, 0.35, 0.2); // Fore mast
    addDetailedBox(-2, 6, 0, 0.3, 12, 0.3, 0.2); // Mizzen mast

    // YARDS (horizontal spars) - more detailed
    addDetailedBox(6, 11, 0, 5, 0.25, 0.25, 0.3); // Main top yard
    addDetailedBox(6, 9, 0, 4.5, 0.25, 0.25, 0.3); // Main upper yard
    addDetailedBox(6, 6, 0, 4, 0.25, 0.25, 0.3); // Main lower yard
    addDetailedBox(6, 3, 0, 3.5, 0.25, 0.25, 0.3); // Main boom

    addDetailedBox(10, 9, 0, 3.5, 0.2, 0.2, 0.3); // Fore upper yard
    addDetailedBox(10, 6.5, 0, 3, 0.2, 0.2, 0.3); // Fore lower yard
    addDetailedBox(10, 4, 0, 2.5, 0.2, 0.2, 0.3); // Fore boom

    addDetailedBox(-2, 8, 0, 2.5, 0.2, 0.2, 0.3); // Mizzen yard
    addDetailedBox(-2, 5, 0, 2, 0.2, 0.2, 0.3); // Mizzen boom

    // FURLED SAILS (as bundles on yards)
    addDetailedBox(6, 11, 0, 4.5, 0.8, 0.6, 0.5); // Main topsail
    addDetailedBox(6, 9, 0, 4, 0.9, 0.7, 0.5); // Main course
    addDetailedBox(10, 9, 0, 3, 0.7, 0.5, 0.5); // Fore topsail
    addDetailedBox(10, 6.5, 0, 2.5, 0.8, 0.6, 0.5); // Fore course
    addDetailedBox(-2, 8, 0, 2, 0.6, 0.4, 0.5); // Mizzen sail

    // RIGGING (stays and shrouds)
    addDetailedBox(8, 4, 0, 4, 0.05, 0.05, 0.1); // Forward stay
    addDetailedBox(2, 4, 0, 8, 0.05, 0.05, 0.1); // Main stay
    addDetailedBox(8, 6, 1.5, 0.05, 0.05, 3, 0.1); // Port shrouds
    addDetailedBox(8, 6, -1.5, 0.05, 0.05, 3, 0.1); // Starboard shrouds

    // DECK STRUCTURES - much more detailed
    addDetailedBox(4, 2, 0, 3, 2, 3, 1.0); // Main cabin
    addDetailedBox(4, 3, 0, 2.5, 0.8, 2.5, 0.5); // Cabin roof
    addDetailedBox(5, 3.5, 0, 1, 0.5, 1, 0.3); // Cabin chimney

    addDetailedBox(-5, 1.8, 0, 2.5, 1.5, 2.5, 0.8); // Aft cabin
    addDetailedBox(-5, 2.8, 0, 2, 0.6, 2, 0.4); // Aft cabin roof

    addDetailedBox(9, 1.5, 0, 2, 1, 2, 0.6); // Forward structure
    addDetailedBox(0, 1.6, 2, 1, 0.8, 0.5, 0.3); // Port rail
    addDetailedBox(0, 1.6, -2, 1, 0.8, 0.5, 0.3); // Starboard rail

    // SHIP'S BOATS
    addDetailedBox(2, 2.5, 1.8, 3, 0.8, 1, 0.4); // Port boat
    addDetailedBox(2, 2.5, -1.8, 3, 0.8, 1, 0.4); // Starboard boat

    // ANCHORS
    addDetailedBox(13, 0.5, 1.5, 0.5, 1.5, 0.3, 0.2); // Port anchor
    addDetailedBox(13, 0.5, -1.5, 0.5, 1.5, 0.3, 0.2); // Starboard anchor

    this.vertices = new Float32Array(vertices);
    this.indices = new Uint16Array(indices);
    this.uvs = new Float32Array(uvs);
    this.normals = new Float32Array(normals);
  }

  createDetailedShaders() {
    this.vertexShader = `
      precision mediump float;
      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 normal;

      uniform mat4 modelMatrix;
      uniform mat4 normalMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;

      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vNormal = (normalMatrix * vec4(normal, 1.0)).xyz;
        vUv = uv;
        vWorldPos = worldPos.xyz;
      }
    `;

    this.fragmentShader = `
      precision mediump float;
      
      uniform float uTime;
      uniform float uIsDay;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      // Noise function for wood grain
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        bool isDay = uIsDay > 0.5;
        vec3 normal = normalize(vNormal);
        
        // BASE WOOD COLORS
        vec3 darkWood = vec3(0.15, 0.1, 0.06);   // Dark weathered wood
        vec3 lightWood = vec3(0.25, 0.18, 0.12); // Lighter wood
        vec3 metalColor = vec3(0.3, 0.3, 0.35);  // Metal fittings
        
        // Determine material type based on world position
        float materialType = 0.0; // 0 = wood, 1 = metal, 2 = sail
        
        // Metal for masts and rigging
        if (abs(vWorldPos.x - 6.0) < 0.5 || abs(vWorldPos.x - 10.0) < 0.5 || abs(vWorldPos.x + 2.0) < 0.5) {
          if (vWorldPos.y > 3.0) materialType = 1.0; // Masts are metal
        }
        
        // Sails (furled) - lighter color
        if (vWorldPos.y > 5.0 && (abs(vWorldPos.z) < 1.0)) {
          materialType = 2.0;
        }
        
        vec3 baseColor;
        if (materialType < 0.5) {
          // WOOD TEXTURE
          float woodGrain = noise(vUv * 20.0 + vWorldPos.xz * 2.0);
          woodGrain += noise(vUv * 40.0) * 0.5;
          woodGrain += noise(vUv * 80.0) * 0.25;
          woodGrain /= 1.75;
          
          baseColor = mix(darkWood, lightWood, woodGrain);
          
          // Add planking lines
          float planks = sin(vUv.x * 30.0) * 0.1 + 0.9;
          baseColor *= planks;
          
          // Weathering
          float weathering = noise(vUv * 5.0 + vWorldPos.xz * 0.5) * 0.3;
          baseColor *= (0.8 + weathering);
          
        } else if (materialType < 1.5) {
          // METAL (masts, rigging)
          baseColor = metalColor;
          float metalNoise = noise(vUv * 50.0) * 0.2;
          baseColor += vec3(metalNoise);
          
        } else {
          // SAILS (canvas)
          baseColor = isDay ? vec3(0.8, 0.75, 0.7) : vec3(0.4, 0.38, 0.35);
          float canvas = noise(vUv * 15.0) * 0.1;
          baseColor += vec3(canvas);
        }
        
        // LIGHTING
        vec3 lightDir = isDay ? normalize(vec3(0.3, 0.8, -0.5)) : normalize(vec3(0.1, 1.0, 0.1));
        float lightIntensity = max(dot(normal, lightDir), 0.2);
        
        // Add rim lighting for dramatic effect
        vec3 viewDir = normalize(vec3(0.0, 1.0, 1.0)); // Approximate view direction
        float rimLight = 1.0 - max(dot(normal, viewDir), 0.0);
        rimLight = pow(rimLight, 3.0) * 0.3;
        
        vec3 color = baseColor * lightIntensity;
        color += rimLight * (isDay ? vec3(0.8, 0.6, 0.4) : vec3(0.2, 0.3, 0.5));
        
        // Atmospheric perspective (distance fog)
        float distance = length(vWorldPos);
        float fogFactor = exp(-distance * 0.01);
        vec3 fogColor = isDay ? vec3(0.9, 0.95, 1.0) : vec3(0.1, 0.15, 0.2);
        color = mix(fogColor, color, fogFactor);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
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
    if (this.program === null) {
      this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
      if (!this.program) {
        console.error("Could not compile ship shader");
        return;
      }
    }

    gl.useProgram(this.program);

    // Uniforms
    try {
      const uTime = gl.getUniformLocation(this.program, "uTime");
      if (uTime !== null && uTime !== -1) {
        gl.uniform1f(uTime, performance.now() / 1000);
      }

      const uIsDay = gl.getUniformLocation(this.program, "uIsDay");
      if (uIsDay !== null && uIsDay !== -1) {
        const isDayValue =
          window.polarScene && window.polarScene.isDay ? 1.0 : 0.0;
        gl.uniform1f(uIsDay, isDayValue);
      }
    } catch (error) {
      // Ignore
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
