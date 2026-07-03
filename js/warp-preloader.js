(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  if (sessionStorage.getItem('warpPreloaderSeen')) {
    preloader.remove();
    return;
  }
  sessionStorage.setItem('warpPreloaderSeen', 'true');

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
      
      // Assign realistic star colors (O, B, A, F, G, K, M classifications roughly)
      let r = Math.random();
      if (r < 0.4) {
          // Blue/White (Hot stars)
          this.hue = 210 + Math.random() * 30; // 210-240
          this.sat = 40 + Math.random() * 40; // 40-80%
      } else if (r < 0.7) {
          // Pure White
          this.hue = 0;
          this.sat = 0; // 0%
      } else if (r < 0.85) {
          // Yellow/White (Sun-like)
          this.hue = 40 + Math.random() * 20; // 40-60
          this.sat = 30 + Math.random() * 30; // 30-60%
      } else {
          // Orange/Red (Cool stars)
          this.hue = 10 + Math.random() * 20; // 10-30
          this.sat = 60 + Math.random() * 30; // 60-90%
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
      // Use HSL for realistic colors. Fades to black in distance (0%), vibrant in mid (50%), white when close (100%)
      ctx.strokeStyle = `hsl(${this.hue}, ${this.sat}%, ${brightness * 100}%)`;
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
  
  // Generate a random full-sky starfield
  const bgStars = [];
  for (let i = 0; i < 300; i++) {
      bgStars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.5
      });
  }
  let bgStarAlpha = 0;
  
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
        
        // Fade in Background Stars
        bgStarAlpha += 0.015;
        if (bgStarAlpha > 1) bgStarAlpha = 1;
    }
    
    stars.forEach(star => {
      star.update();
      star.draw();
    });
    
    // Draw Background Starfield
    if (bgStarAlpha > 0) {
        bgStars.forEach(s => {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * bgStarAlpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  const minDuration = 5000; // 5 seconds in hyperspace
  
  function endPreloader() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - Math.max(elapsed, 2500)); 
    
    setTimeout(() => {
      // Trigger phase 3 (brake and show Background Stars)
      window.preloaderExitSignal = true; 
      
      // Allow 2 seconds to admire the star map before fading out
      setTimeout(() => {
          preloader.style.opacity = '0';
          preloader.style.pointerEvents = 'none';
          setTimeout(() => {
            cancelAnimationFrame(animationFrame);
            preloader.remove();
          }, 1500); // 1.5s CSS transition fade out
      }, 2000);
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
