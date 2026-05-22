(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  let canvas = document.getElementById('warp-canvas');
  
  // Since we might have a WebGL context from previous versions, recreate the canvas to ensure a clean 2D context
  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'warp-canvas';
  newCanvas.style.width = '100%';
  newCanvas.style.height = '100%';
  newCanvas.style.display = 'block';
  preloader.replaceChild(newCanvas, canvas);
  
  const ctx = newCanvas.getContext('2d');
  
  let w, h;
  let stars = [];
  const STAR_COUNT = 2500; // Increased density

  let speed = 2; // Initial drift
  let targetSpeed = 35; // Warp speed
  
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    newCanvas.width = w;
    newCanvas.height = h;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  class Star {
    constructor() {
      this.init(true);
    }
    
    init(randomZ = false) {
      // Spread stars across a wider area to ensure the screen is filled
      this.x = (Math.random() - 0.5) * w * 2.5;
      this.y = (Math.random() - 0.5) * h * 2.5;
      this.z = randomZ ? Math.random() * w : w;
      
      // Individual length multiplier to create varied streak lengths (like the image)
      this.lengthMult = Math.random() * 2.0 + 0.5;
      
      // Assign a hue based on the Orion Nebula palette (Teal/Cyan, Magenta/Pink, Warm Orange)
      let r = Math.random();
      if (r < 0.4) {
          this.hue = 180 + Math.random() * 40; // Teal / Cyan (180-220)
      } else if (r < 0.8) {
          this.hue = 320 + Math.random() * 40; // Magenta / Pink (320-360)
      } else {
          this.hue = 10 + Math.random() * 20;  // Warm Orange / Red (10-30) for stars like Betelgeuse
      }
    }
    
    update() {
      this.z -= speed;
      if (this.z < 1) {
        this.init();
      }
    }
    
    draw() {
      // Calculate tail position in 3D based on current speed
      // This ensures streaks grow longer as speed increases, forming straight solid lines
      let tailZ = this.z + (speed * this.lengthMult * 1.5);
      
      // 3D to 2D Projection (using w for uniform scaling on both axes)
      let headX = w / 2 + (this.x / this.z) * (w / 2);
      let headY = h / 2 + (this.y / this.z) * (w / 2); 
      
      let tailX = w / 2 + (this.x / tailZ) * (w / 2);
      let tailY = h / 2 + (this.y / tailZ) * (w / 2);
      
      // Calculate depth ratio (1 is at the camera, 0 is far away)
      let depthRatio = 1 - (this.z / w);
      if (depthRatio < 0) depthRatio = 0;
      if (depthRatio > 1) depthRatio = 1;
      
      // Exponential brightness: stars fade out completely in the distance
      let brightness = Math.pow(depthRatio, 1.2);
      
      // Width gets thicker as it approaches the camera
      let lineWidth = brightness * 3.5 + 0.2;
      
      // Culling: don't draw if both ends are off-screen
      if ((headX < 0 || headX > w || headY < 0 || headY > h) && 
          (tailX < 0 || tailX > w || tailY < 0 || tailY > h)) {
          return;
      }
      
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.lineWidth = lineWidth;
      // Use HSL for vibrant colors. Fades to black in distance (0%), vibrant in mid (50%), white when close (100%)
      ctx.strokeStyle = `hsl(${this.hue}, 90%, ${brightness * 100}%)`;
      ctx.lineCap = 'round'; // Makes the ends of the streaks smooth
      ctx.stroke();
    }
  }
  
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
  }
  
  let animationFrame;
  let phase = 0;
  let startTime = Date.now();
  let timeInWarp = 0;
  
  // Orion Constellation Data
  const orionStarsList = [
      {id: 'betelgeuse', x: -0.15, y: -0.25, size: 6, color: '15, 100%, 75%', glow: 20}, // Top left (Red Supergiant)
      {id: 'bellatrix', x: 0.1, y: -0.2, size: 4, color: '210, 100%, 85%', glow: 15}, // Top right
      {id: 'alnitak', x: -0.06, y: -0.01, size: 3.5, color: '210, 100%, 90%', glow: 10}, // Belt left
      {id: 'alnilam', x: 0, y: 0, size: 3.5, color: '210, 100%, 90%', glow: 10}, // Belt mid
      {id: 'mintaka', x: 0.06, y: 0.01, size: 3.5, color: '210, 100%, 90%', glow: 10}, // Belt right
      {id: 'saiph', x: -0.12, y: 0.25, size: 4, color: '210, 100%, 85%', glow: 15}, // Bottom left
      {id: 'rigel', x: 0.15, y: 0.2, size: 7, color: '210, 100%, 95%', glow: 25}, // Bottom right (Blue Supergiant)
      {id: 'meissa', x: -0.02, y: -0.35, size: 2.5, color: '210, 100%, 85%', glow: 8}, // Head
      {id: 'sword1', x: -0.02, y: 0.08, size: 2, color: '330, 100%, 80%', glow: 15}, // Nebula region
      {id: 'sword2', x: -0.03, y: 0.12, size: 2.5, color: '330, 100%, 80%', glow: 30}, // M42 Orion Nebula center
      {id: 'sword3', x: -0.04, y: 0.16, size: 2, color: '330, 100%, 80%', glow: 15}
  ];
  const orionLinesList = [
      ['betelgeuse', 'alnitak'],
      ['bellatrix', 'mintaka'],
      ['alnitak', 'alnilam'],
      ['alnilam', 'mintaka'],
      ['alnitak', 'saiph'],
      ['mintaka', 'rigel'],
      ['meissa', 'betelgeuse'],
      ['meissa', 'bellatrix'],
      ['alnilam', 'sword1'],
      ['sword1', 'sword2'],
      ['sword2', 'sword3']
  ];
  let orionAlpha = 0;
  
  function animate() {
    // Solid black clear every frame. NO fading trails. 
    // This creates the crisp, sharp, distinct white lines seen in the image.
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    let now = Date.now();
    let elapsed = now - startTime;
    
    // Cinematic Sequencing
    if (phase === 0 && elapsed > 500) {
        phase = 1; 
    }
    if (phase === 1) {
        speed += (targetSpeed - speed) * 0.04; // Smooth acceleration into warp
        if (speed > targetSpeed - 2) {
            phase = 2;
            timeInWarp = now;
        }
    }
    if (phase === 2 && window.preloaderExitSignal) {
        phase = 3;
    }
    if (phase === 3) {
        speed *= 0.88; // Decelerate on exit
        if (speed < 0.1) speed = 0.1;
        
        // Fade in Orion Map
        orionAlpha += 0.015;
        if (orionAlpha > 1) orionAlpha = 1;
    }
    
    stars.forEach(star => {
      star.update();
      star.draw();
    });
    
    // Draw Orion Constellation Map
    if (orionAlpha > 0) {
        let minDim = Math.min(w, h);
        
        // Draw Lines
        ctx.lineWidth = 1;
        orionLinesList.forEach(pair => {
            let s1 = orionStarsList.find(s => s.id === pair[0]);
            let s2 = orionStarsList.find(s => s.id === pair[1]);
            if(s1 && s2) {
                ctx.beginPath();
                ctx.moveTo(w/2 + s1.x * minDim, h/2 + s1.y * minDim);
                ctx.lineTo(w/2 + s2.x * minDim, h/2 + s2.y * minDim);
                ctx.strokeStyle = `rgba(100, 150, 255, ${orionAlpha * 0.4})`;
                ctx.stroke();
            }
        });
        
        // Draw Stars and Nebula Glows
        orionStarsList.forEach(s => {
            let sx = w/2 + s.x * minDim;
            let sy = h/2 + s.y * minDim;
            
            // Glow
            let gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.glow);
            gradient.addColorStop(0, `hsla(${s.color}, ${orionAlpha})`);
            gradient.addColorStop(1, `hsla(${s.color}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sx, sy, s.glow, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = `hsla(0, 100%, 100%, ${orionAlpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Label
        ctx.fillStyle = `rgba(255, 255, 255, ${orionAlpha * 0.7})`;
        ctx.font = '16px "Orbitron", sans-serif, monospace';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '4px';
        ctx.fillText('ORION NEBULA', w/2, h/2 + 0.35 * minDim);
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  const minDuration = 6000; // Time in hyperspace
  
  function endPreloader() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - Math.max(elapsed, 2500)); 
    
    setTimeout(() => {
      // Trigger phase 3 (brake and show Orion Map)
      window.preloaderExitSignal = true; 
      
      // Allow 3.5 seconds to admire the star map before fading out
      setTimeout(() => {
          preloader.style.opacity = '0';
          preloader.style.pointerEvents = 'none';
          setTimeout(() => {
            cancelAnimationFrame(animationFrame);
            preloader.remove();
          }, 1500); // 1.5s CSS transition fade out
      }, 3500);
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
