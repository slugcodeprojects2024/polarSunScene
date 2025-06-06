const VertexShader = `
  precision mediump float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec3 normal;

  uniform mat4 modelMatrix;
  uniform mat4 normalMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  varying vec3 vPos;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    vPos = modelPosition.xyz;
  }
`;

const FragmentShader = `
  precision mediump float;

  // 4D Perlin noise functions
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float cnoise(vec4 P) {
    vec4 Pi0 = floor(P);
    vec4 Pi1 = Pi0 + 1.0;
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec4 Pf0 = fract(P);
    vec4 Pf1 = Pf0 - 1.0;
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 ixy00 = permute(ixy0 + iw0);
    vec4 ixy01 = permute(ixy0 + iw1);
    vec4 ixy10 = permute(ixy1 + iw0);
    vec4 ixy11 = permute(ixy1 + iw1);

    vec4 gx00 = ixy00 * (1.0 / 7.0);
    vec4 gy00 = floor(gx00) * (1.0 / 7.0);
    vec4 gz00 = floor(gy00) * (1.0 / 6.0);
    gx00 = fract(gx00) - 0.5;
    gy00 = fract(gy00) - 0.5;
    gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);

    vec4 gx01 = ixy01 * (1.0 / 7.0);
    vec4 gy01 = floor(gx01) * (1.0 / 7.0);
    vec4 gz01 = floor(gy01) * (1.0 / 6.0);
    gx01 = fract(gx01) - 0.5;
    gy01 = fract(gy01) - 0.5;
    gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);

    vec4 gx10 = ixy10 * (1.0 / 7.0);
    vec4 gy10 = floor(gx10) * (1.0 / 7.0);
    vec4 gz10 = floor(gy10) * (1.0 / 6.0);
    gx10 = fract(gx10) - 0.5;
    gy10 = fract(gy10) - 0.5;
    gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gx10) - abs(gz10);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);

    vec4 gx11 = ixy11 * (1.0 / 7.0);
    vec4 gy11 = floor(gx11) * (1.0 / 7.0);
    vec4 gz11 = floor(gy11) * (1.0 / 6.0);
    gx11 = fract(gx11) - 0.5;
    gy11 = fract(gy11) - 0.5;
    gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);

    vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
    vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
    vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
    vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
    vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
    vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
    vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
    vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
    vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
    vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
    vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
    vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
    vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
    vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
    vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
    vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

    vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x;
    g0100 *= norm00.y;
    g1000 *= norm00.z;
    g1100 *= norm00.w;
    vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x;
    g0101 *= norm01.y;
    g1001 *= norm01.z;
    g1101 *= norm01.w;
    vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x;
    g0110 *= norm10.y;
    g1010 *= norm10.z;
    g1110 *= norm10.w;
    vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x;
    g0111 *= norm11.y;
    g1011 *= norm11.z;
    g1111 *= norm11.w;

    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);

    vec4 fade_xyzw = smoothstep(vec4(0.0), vec4(1.0), Pf0);
    vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
    vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
    vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
    vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
    float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
    return 2.2 * n_xyzw;
  }

  // Fractal Brownian Motion for atmospheric effects
  float fbm(vec4 pos) {
    float value = 0.0;
    float amplitud = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitud * abs(cnoise(pos * frequency));
      pos *= 2.0;
      amplitud *= 0.5;
    }
    return value;
  }

  // Simple hash for stars
  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  // Polar scene settings
  #define SUN_POS vec3(0.0, 25.0, -35.0)
  #define SUN_SIZE 8.0
  #define SUNDOG_OFFSET 22.0
  #define GROUND_LEVEL 0.0

  uniform float uTime;
  uniform float uIsDay; // 1.0 = day, 0.0 = night
  uniform float uWindSpeed; // Wind speed control
  varying vec3 vPos;

  void main() {
    bool isDay = uIsDay > 0.5;
    vec3 color;

    if (isDay) {
      // Polar day colors
      vec3 skyColor = vec3(0.7, 0.8, 0.9);
      vec3 horizonColor = vec3(0.8, 0.85, 0.9);
      
      // Sky gradient
      float horizonGradient = clamp(vPos.y / 20.0 + 0.5, 0.0, 1.0);
      color = mix(horizonColor, skyColor, horizonGradient);

      // Sun
      float d = distance(SUN_POS, vPos);
      float sunIntensity = SUN_SIZE / d;
      vec3 sunColor = vec3(1.0, 0.95, 0.8);
      color = mix(color, sunColor, sunIntensity);

      // Sundogs
      vec3 leftSundogPos = SUN_POS + vec3(-SUNDOG_OFFSET, 0.0, 0.0);
      vec3 rightSundogPos = SUN_POS + vec3(SUNDOG_OFFSET, 0.0, 0.0);
      
      float leftSundogDist = distance(leftSundogPos, vPos);
      float rightSundogDist = distance(rightSundogPos, vPos);
      
      float leftSundogIntensity = (SUN_SIZE * 0.4) / leftSundogDist;
      float rightSundogIntensity = (SUN_SIZE * 0.4) / rightSundogDist;
      
      vec3 leftSundogColor = vec3(0.95, 0.85, 0.7);
      vec3 rightSundogColor = vec3(0.95, 0.87, 0.72);
      
      color = mix(color, leftSundogColor, clamp(leftSundogIntensity * 0.3, 0.0, 0.4));
      color = mix(color, rightSundogColor, clamp(rightSundogIntensity * 0.3, 0.0, 0.4));

    } else {
      // Polar night colors
      color = vec3(0.02, 0.03, 0.08);

      // Stars
      vec3 starPos = normalize(vPos);
      float starField = hash(floor(starPos.x * 100.0) + floor(starPos.y * 100.0) * 100.0 + floor(starPos.z * 100.0) * 10000.0);
      if (starField > 0.995) {
        float starBrightness = (starField - 0.995) / 0.005;
        color += vec3(0.8, 0.9, 1.0) * starBrightness * 2.0;
      }

      // Aurora effect
      if (vPos.y > 20.0 && vPos.y < 35.0) {
        float auroraIntensity = sin(vPos.x * 0.01 + uTime * 0.3) * 0.5 + 0.5;
        auroraIntensity *= smoothstep(20.0, 25.0, vPos.y) * smoothstep(35.0, 30.0, vPos.y);
        color += vec3(0.2, 0.8, 0.4) * auroraIntensity * 0.3;
      }
    }

    // FIXED: Omnidirectional atmospheric effects
    // Base fog layer - no directional offset, just time-based animation
    float fog = fbm(vec4(vPos * 0.008, uTime * 0.05 * uWindSpeed));
    
    // Secondary detail layer with subtle movement
    vec3 windSway = vec3(
      sin(uTime * uWindSpeed * 0.2) * 2.0,
      cos(uTime * uWindSpeed * 0.15) * 1.0,
      sin(uTime * uWindSpeed * 0.25) * 1.5
    );
    fog += fbm(vec4((vPos + windSway) * 0.03, uTime * 0.1 * uWindSpeed)) * 0.3;
    
    // Fine detail layer for texture - position-based variation
    fog += fbm(vec4(vPos * 0.08 + sin(uTime * uWindSpeed * 0.1) * 0.5, uTime * 0.15)) * 0.2;
    
    // Height attenuation - more fog near ground
    float heightFactor = 1.0 - smoothstep(GROUND_LEVEL, GROUND_LEVEL + 30.0, vPos.y);
    heightFactor = pow(heightFactor, 0.8);
    fog *= heightFactor;
    
    // Day/night intensity adjustment  
    float fogIntensity = isDay ? fog * 0.6 : fog * 0.4;
    fogIntensity = clamp(fogIntensity, 0.0, 1.0);
    
    // Height-based fog density
    float heightDensity = 1.0 - smoothstep(GROUND_LEVEL, GROUND_LEVEL + 50.0, vPos.y);
    fogIntensity *= heightDensity;
    
    // Adaptive fog color
    vec3 fogColor = isDay ? vec3(0.92, 0.95, 1.0) : vec3(0.88, 0.92, 0.98);
    
    // Apply fog with light scattering
    color = mix(color, fogColor, fogIntensity * 0.7);
    
    // FIXED: Omnidirectional snow effect - extends higher and all around
    if (vPos.y < 25.0) {
      // Create swirling snow patterns that work in all directions
      vec3 snowPos = vPos + vec3(
        sin(uTime * uWindSpeed * 0.8 + vPos.x * 0.01) * 3.0,
        cos(uTime * uWindSpeed * 0.6 + vPos.z * 0.01) * 1.5,
        sin(uTime * uWindSpeed * 0.9 + vPos.y * 0.01) * 2.0
      );
      
      float snowNoise = fbm(vec4(snowPos * 0.12, uTime * 0.3 * uWindSpeed));
      snowNoise += fbm(vec4(snowPos * 0.25, uTime * 0.5 * uWindSpeed)) * 0.5;
      
      // Make snow more visible and omnidirectional
      snowNoise = clamp(snowNoise - 0.2, 0.0, 1.0) * 1.5;
      
      // Height-based snow intensity
      float snowHeightFactor = 1.0 - smoothstep(GROUND_LEVEL, 25.0, vPos.y);
      snowNoise *= snowHeightFactor * uWindSpeed * 0.3;
      
      // Add snow to scene
      color += vec3(1.0, 0.98, 0.95) * snowNoise * 0.2;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export { VertexShader, FragmentShader };
