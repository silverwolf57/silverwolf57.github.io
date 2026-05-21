(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  // Initialize WebGL
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.warn("WebGL not supported, falling back.");
    preloader.style.display = 'none';
    return;
  }

  // --- Vertex Shader ---
  // A simple shader that renders a full-screen quad
  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // --- Fragment Shader ---
  // Using the exact advanced shader logic provided by the user (with slight color tuning for Interstellar vibe)
  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float iFade; // Controls hyper-acceleration when exiting the preloader

    // Pseudo-random hash for noise
    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    // Value Noise for nebula texture
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f); // Smoothstep
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Fractional Brownian Motion (fBm) for dense nebula clouds
    float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
            v += amp * noise(p);
            p *= 2.0;
            amp *= 0.5;
        }
        return v;
    }

    void main() {
        // 1. Normalize and center coordinates
        vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        
        // 2. Convert to polar coordinates
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        // Prevent division by zero
        if (radius < 0.001) radius = 0.001;

        // Dynamic time parameter (accelerates during exit sequence)
        float t = iTime * (1.0 + iFade * 3.0);

        // 3. Nebula Layer (Nebula background)
        // Use 1/radius for depth projection, scroll outward with time
        vec2 nebulaUV = vec2(angle * 2.0, 1.0 / radius - t * 0.5);
        float nebulaNoise = fbm(nebulaUV * 1.5 + fbm(nebulaUV * 0.8));
        
        // Interstellar Palette: Deep Crimson to Cyan/Teal
        vec3 nebulaColor1 = vec3(0.15, 0.02, 0.2); // Deep Magenta/Purple
        vec3 nebulaColor2 = vec3(0.05, 0.3, 0.4);  // Deep Teal
        vec3 nebulaColor = mix(nebulaColor1, nebulaColor2, sin(angle + t) * 0.5 + 0.5);
        vec3 bgNebula = nebulaColor * nebulaNoise * (radius * 1.5); 

        // 4. Warp Streaks Layer (Flowing light particles)
        float sectors = 90.0;
        float sectorId = floor(angle * sectors / 6.28318);
        
        float rand = hash(vec2(sectorId, 14.37));
        
        float streaks = 0.0;
        vec3 streakColor = vec3(0.0);
        
        // Only generate particles in some sectors
        if (rand > 0.25) {
            float speed = 2.5 + iFade * 5.0; // Speed up greatly on exit
            float zProgress = fract(rand * 10.0 - t * speed); 
            
            // Perspective projection (1/Z)
            float particleRadius = 0.02 / (zProgress + 0.01);
            float distToParticle = abs(radius - particleRadius);
            
            float angleDist = fract(angle * sectors / 6.28318) - 0.5;
            
            // Calculate intensity based on radial stretch and angular deviation
            float streakIntensity = smoothstep(0.4, 0.0, distToParticle * 2.0) * 
                                    smoothstep(0.5, 0.0, abs(angleDist) * (radius * 15.0));
            
            // Streak Colors: Ice Blue, Crimson, Gold
            vec3 col1 = vec3(0.7, 0.9, 1.0); // Ice blue/White
            vec3 col2 = vec3(0.9, 0.1, 0.3); // Crimson
            vec3 col3 = vec3(1.0, 0.8, 0.4); // Gold
            
            vec3 pCol = mix(col1, col2, sin(rand * 6.28) * 0.5 + 0.5);
            pCol = mix(pCol, col3, zProgress); 
            
            streaks += streakIntensity * (1.0 - zProgress); 
            streakColor += pCol * streaks;
        }

        // 5. Final Mix (Nebula + Streaks + Central Glow)
        vec3 finalColor = bgNebula + streakColor * 1.8;
        
        // Central burst of white light (Gargantua throat)
        finalColor += vec3(1.0, 0.95, 0.9) * (0.015 / (radius + 0.01));

        gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // --- Compile Shaders ---
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  // --- Buffer Data (Full screen quad) ---
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Two triangles forming a rectangle covering the screen
  const positions = [
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // --- Get Uniform Locations ---
  const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
  const iTimeLocation = gl.getUniformLocation(program, "iTime");
  const iFadeLocation = gl.getUniformLocation(program, "iFade");

  let w, h;
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Animation Loop ---
  let startTime = Date.now();
  let animationFrame;
  let fadeState = 0.0; // Transitions from 0 to 1 when entering the site
  
  function render() {
    let elapsed = (Date.now() - startTime) / 1000.0;
    
    // Accelerate the visual speed smoothly when the preloader is exiting
    if (window.preloaderExitSignal) {
        fadeState += 0.015;
        if (fadeState > 1.0) fadeState = 1.0;
    }

    gl.uniform2f(iResolutionLocation, w, h);
    gl.uniform1f(iTimeLocation, elapsed);
    gl.uniform1f(iFadeLocation, fadeState);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationFrame = requestAnimationFrame(render);
  }
  
  render();

  // --- Exit Logic ---
  const minDuration = 4500; // Minimum viewing time for the cinematic effect
  
  function endPreloader() {
    window.preloaderExitSignal = true; // Triggers the hyper-acceleration shader effect
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - elapsed);
    
    setTimeout(() => {
      // Start CSS opacity fade
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      
      // Cleanup after fade finishes
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        preloader.remove();
        
        // Optional: Release WebGL context
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }, 1500); // Wait for the 1.5s CSS transition
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
