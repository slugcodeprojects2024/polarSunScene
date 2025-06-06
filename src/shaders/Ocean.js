const VertexShader = `
  precision mediump float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec3 normal;

  uniform mat4 modelMatrix;
  uniform mat4 normalMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uIsDay;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec2 vUv;

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
    vec4 transformedPosition = modelMatrix * vec4(position, 1.0);

    // Create varied ice surface with pressure ridges and broken ice
    float largeScale = noise(transformedPosition.xz * 0.02);
    float mediumScale = noise(transformedPosition.xz * 0.1) * 0.3;
    float smallScale = noise(transformedPosition.xz * 0.5) * 0.1;
    
    // Pressure ridges - raised areas of crushed ice
    float ridgeHeight = smoothstep(0.7, 0.9, largeScale) * 2.0;
    
    // Ice floe boundaries - creates separated ice chunks like a real ice pack
    float floePattern = noise(transformedPosition.xz * 0.008);
    float floeEdges = abs(fract(floePattern * 4.0) - 0.5) * 2.0;
    floeEdges = smoothstep(0.8, 0.95, floeEdges) * 1.2;
    
    // Broken ice areas - lower chaotic terrain where ship could be trapped
    float brokenIce = noise(transformedPosition.xz * 0.06 + vec2(50.0));
    brokenIce = smoothstep(0.4, 0.6, brokenIce) * 0.8;
    
    // Ice chunks and variation - enhanced for ice pack look
    float iceHeight = (largeScale + mediumScale + smallScale) * 0.7 + ridgeHeight + floeEdges - brokenIce;
    transformedPosition.y += iceHeight;

    // Calculate view direction for reflections
    vec4 viewPos = viewMatrix * transformedPosition;
    vViewDir = -viewPos.xyz;

    gl_Position = projectionMatrix * viewPos;
    
    // Perturb normal for ice surface variation
    vec3 perturbedNormal = normal;
    float dx = noise(transformedPosition.xz * 0.3 + vec2(1.0, 0.0)) - noise(transformedPosition.xz * 0.3 - vec2(1.0, 0.0));
    float dz = noise(transformedPosition.xz * 0.3 + vec2(0.0, 1.0)) - noise(transformedPosition.xz * 0.3 - vec2(0.0, 1.0));
    perturbedNormal += vec3(dx * 0.3, 0.0, dz * 0.3);
    
    vNormal = normalize((normalMatrix * vec4(perturbedNormal, 1.0)).xyz);
    vWorldPos = transformedPosition.xyz;
    vUv = uv;
  }
`;

const FragmentShader = `
  precision mediump float;
  
  #define SUN_POS vec3(0.0, 25.0, -35.0)
  #define GROUND_LEVEL 0.0
  
  uniform float uTime;
  uniform float uIsDay;
  uniform float uWindSpeed;
  uniform vec3 uCameraPos;
  
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec2 vUv;

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

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // MUCH SIMPLER: Natural snow effect using smooth noise
  vec3 calculateNaturalSnow(vec3 worldPos, vec3 baseColor) {
    // Create gentle, smooth snow patterns
    vec2 snowCoords = worldPos.xz * 0.05;
    
    // Add falling motion - snow drifts down over time
    snowCoords.y += uTime * uWindSpeed * 0.8;
    
    // Add horizontal wind drift
    snowCoords.x += sin(uTime * uWindSpeed * 0.3 + worldPos.z * 0.02) * 2.0;
    snowCoords.x += cos(uTime * uWindSpeed * 0.4 + worldPos.y * 0.01) * 1.5;
    
    // Generate smooth snow density using fractal noise
    float snowDensity = fbm(snowCoords);
    snowDensity += fbm(snowCoords * 2.1 + vec2(100.0)) * 0.5;
    snowDensity += fbm(snowCoords * 4.3 + vec2(200.0)) * 0.25;
    
    // Make snow appear in patches, not everywhere
    snowDensity = smoothstep(0.4, 0.8, snowDensity);
    
    // Height-based snow intensity (less at higher altitudes, but still visible)
    float heightFactor = 1.0 - smoothstep(0.0, 50.0, worldPos.y) * 0.6;
    snowDensity *= heightFactor;
    
    // Wind intensity affects snow density
    snowDensity *= uWindSpeed * 0.4;
    
    // Distance fade - less snow in the far distance to avoid overwhelming effect
    float distance = length(worldPos - uCameraPos);
    float distanceFade = 1.0 - smoothstep(20.0, 100.0, distance);
    snowDensity *= distanceFade;
    
    // Soft snow color
    vec3 snowColor = vec3(1.0, 0.98, 0.95) * snowDensity * 0.3;
    
    return baseColor + snowColor;
  }

  // IMPROVED: Softer atmospheric fog
  vec3 calculateSoftAtmosphere(vec3 worldPos, vec3 baseColor, bool isDay) {
    // Distance-based atmospheric perspective
    float distance = length(worldPos - uCameraPos);
    float distanceFog = 1.0 - exp(-distance * 0.005);
    
    // Gentle wind variation in the atmosphere
    float windNoise = noise(worldPos.xz * 0.01 + uTime * uWindSpeed * 0.05) * 0.3 + 0.7;
    
    // Soft height-based atmospheric haze
    float heightFactor = 1.0 - smoothstep(0.0, 60.0, worldPos.y);
    heightFactor = smoothstep(0.0, 1.0, heightFactor); // Smoother falloff
    
    // Combine atmospheric factors
    float atmosphereIntensity = distanceFog * heightFactor * windNoise * uWindSpeed * 0.2;
    atmosphereIntensity = clamp(atmosphereIntensity, 0.0, 0.6);
    
    // Soft atmospheric colors
    vec3 atmosphereColor = isDay ? vec3(0.88, 0.91, 0.95) : vec3(0.82, 0.85, 0.90);
    
    return mix(baseColor, atmosphereColor, atmosphereIntensity);
  }

  void main() {
    bool isDay = uIsDay > 0.5;
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    
    // Ice type variation
    float iceType = noise(vWorldPos.xz * 0.03);
    
    // Base ice colors
    vec3 smoothIceColor = isDay ? vec3(0.9, 0.95, 1.0) : vec3(0.7, 0.75, 0.85);
    vec3 roughIceColor = isDay ? vec3(0.85, 0.88, 0.92) : vec3(0.65, 0.7, 0.78);
    vec3 snowIceColor = isDay ? vec3(0.98, 0.99, 1.0) : vec3(0.8, 0.82, 0.88);
    
    // Mix ice types
    vec3 baseColor;
    float roughness;
    if (iceType < 0.3) {
      baseColor = smoothIceColor;
      roughness = 0.1;
    } else if (iceType < 0.7) {
      baseColor = roughIceColor;
      roughness = 0.7;
    } else {
      baseColor = snowIceColor;
      roughness = 0.9;
    }
    
    // Ice cracks and details
    float cracks = 0.0;
    cracks += smoothstep(0.98, 0.99, noise(vWorldPos.xz * 0.5));
    cracks += smoothstep(0.97, 0.98, noise(vWorldPos.xz * 0.3 + 100.0));
    cracks += smoothstep(0.96, 0.98, noise(vWorldPos.xz * 0.15 + 200.0));
    baseColor = mix(baseColor, vec3(0.15, 0.25, 0.35), cracks * 0.8);
    
    // Ice floe boundaries
    float floePattern = noise(vWorldPos.xz * 0.008);
    float floeBoundaries = abs(fract(floePattern * 4.0) - 0.5) * 2.0;
    floeBoundaries = smoothstep(0.8, 0.95, floeBoundaries);
    baseColor = mix(baseColor, vec3(0.2, 0.3, 0.4), floeBoundaries * 0.6);
    
    // Frost patterns
    float frost = fbm(vWorldPos.xz * 2.0);
    frost = smoothstep(0.6, 0.8, frost);
    baseColor = mix(baseColor, vec3(0.95, 0.97, 1.0), frost * 0.3);
    
    // LIGHTING
    vec3 lightPos = isDay ? SUN_POS : vec3(0.0, 50.0, 0.0);
    vec3 lightDir = normalize(lightPos - vWorldPos);
    
    // Diffuse lighting
    float diffuse = max(dot(norm, lightDir), 0.0);
    float ambient = isDay ? 0.4 : 0.2;
    float lightIntensity = diffuse + ambient;
    
    // Specular highlights
    vec3 halfVector = normalize(lightDir + viewDir);
    float specular = pow(max(dot(norm, halfVector), 0.0), 128.0 * (1.0 - roughness));
    
    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 2.0);
    fresnel = mix(0.04, 1.0, fresnel);
    
    // Sky reflection
    vec3 reflectDir = reflect(-viewDir, norm);
    vec3 skyColor = isDay ? 
      mix(vec3(0.8, 0.85, 0.95), vec3(0.5, 0.7, 0.9), reflectDir.y) :
      mix(vec3(0.1, 0.15, 0.25), vec3(0.05, 0.1, 0.2), reflectDir.y);
    
    // Sun reflection
    float sunReflection = 0.0;
    if (isDay) {
      vec3 sunDir = normalize(lightPos);
      float sunDot = max(dot(reflectDir, sunDir), 0.0);
      sunReflection = pow(sunDot, 256.0) * (1.0 - roughness);
    }
    
    // Combine lighting
    vec3 color = baseColor * lightIntensity;
    color += vec3(1.0, 0.95, 0.85) * specular * (isDay ? 1.0 : 0.3);
    color = mix(color, skyColor, fresnel * (1.0 - roughness) * 0.5);
    color += vec3(1.0, 0.95, 0.8) * sunReflection * 3.0;
    
    // Ice subsurface scattering
    float subsurface = max(dot(norm, -lightDir), 0.0) * 0.5;
    color += vec3(0.3, 0.5, 0.7) * subsurface * 0.1 * (1.0 - roughness);
    
    // Ice sparkles
    if (isDay && roughness < 0.5) {
      float sparkle = noise(vWorldPos.xz * 20.0 + uTime * 0.05);
      sparkle *= noise(vWorldPos.xz * 30.0 - uTime * 0.03);
      if (sparkle > 0.9) {
        color += vec3(1.0) * (sparkle - 0.9) * 10.0;
      }
    }
    
    // Apply NEW natural snow and soft atmosphere
    color = calculateNaturalSnow(vWorldPos, color);
    color = calculateSoftAtmosphere(vWorldPos, color, isDay);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
export { VertexShader, FragmentShader };
