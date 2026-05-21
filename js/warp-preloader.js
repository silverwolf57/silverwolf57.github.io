(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  const ctx = canvas.getContext('2d');
  
  let w, h;
  let particles = [];
  const PARTICLE_COUNT = 3000;
  
  // Interstellar Tunnel Geometry Parameters
  const TUNNEL_RADIUS = 250; 
  const MAX_DEPTH = 2500;
  
  // Hyperspace Speeds
  let baseSpeed = 15;
  let warpSpeed = 0;
  
  // Cinematic Interstellar Poster Palette
  const colors = [
    [255, 255, 255], // Pure White (Superhot plasma)
    [150, 230, 255], // Ice Blue / Cyan
    [20,  120, 180], // Deep Teal
    [220, 20,  60],  // Crimson / Magenta
    [255, 100, 120], // Soft Red / Pink
    [255, 200, 100]  // Bright Gold / Dust
  ];
  
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  class Particle {
    constructor() {
      this.init(true);
    }
    
    init(randomZ = false) {
      this.angle = Math.random() * Math.PI * 2;
      
      // Spread particles radially to create a very thick, cloudy tunnel wall
      let distribution = Math.random();
      // Use square root distribution to cluster more particles near the inner surface
      this.radiusOffset = (Math.sqrt(distribution) * 400) - 100; 
      
      this.z = randomZ ? Math.random() * MAX_DEPTH : MAX_DEPTH;
      this.pz = this.z;
      
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.r = c[0];
      this.g = c[1];
      this.b = c[2];
      
      // Particle thickness
      this.size = Math.random() * 2.5 + 0.5;
    }
    
    update(speedMultiplier) {
      this.pz = this.z;
      this.z -= (baseSpeed + speedMultiplier);
      
      // When particle passes behind the camera, respawn it at the deep end of the tunnel
      if (this.z <= 1) {
        this.init();
        this.z = MAX_DEPTH;
        this.pz = this.z;
      }
    }
    
    draw(time, twist) {
      // 1. Calculate dynamic radius with sine wave undulation (The Interstellar Throat ripple)
      let currentR = TUNNEL_RADIUS + this.radiusOffset + Math.sin(this.z * 0.003 - time) * 150;
      let prevR    = TUNNEL_RADIUS + this.radiusOffset + Math.sin(this.pz * 0.003 - time) * 150;
      
      // 2. Calculate Corkscrew Twist based on depth
      let curAngle  = this.angle + this.z * twist;
      let prevAngle = this.angle + this.pz * twist;
      
      // 3. 3D to 2D Cylindrical Projection
      let x = w / 2 + (Math.cos(curAngle) * currentR * w) / this.z;
      let y = h / 2 + (Math.sin(curAngle) * currentR * w) / this.z;
      
      let px = w / 2 + (Math.cos(prevAngle) * prevR * w) / this.pz;
      let py = h / 2 + (Math.sin(prevAngle) * prevR * w) / this.pz;
      
      // Don't draw if both points are offscreen (performance optimization)
      if ((x < 0 || x > w || y < 0 || y > h) && (px < 0 || px > w || py < 0 || py > h)) return;
      
      // 4. Depth fading (dark in the deep distance, bright near the camera)
      let depthRatio = 1 - (this.z / MAX_DEPTH);
      if (depthRatio < 0) depthRatio = 0;
      
      let opacity = Math.pow(depthRatio, 1.2);
      
      // 5. Size scaling (Perspective: things get bigger as they get closer)
      let strokeSize = this.size * (w / this.z) * 0.6;
      if (strokeSize > 40) strokeSize = 40; // Cap thickness to avoid massive blobs
      
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.lineWidth = strokeSize;
      ctx.strokeStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`;
      ctx.stroke();
    }
  }
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
  
  let animationFrame;
  let phase = 0; 
  let startTime = Date.now();
  let timeInWarp = 0;
  let globalTime = 0;
  let twistFactor = 0.003; // Initial strong corkscrew twist
  
  function animate() {
    globalTime += 0.04; // Controls the speed of the wall ripples
    
    // Clear background with high alpha for smooth, thick glowing trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 0, 5, 0.25)'; // Deep void color
    ctx.fillRect(0, 0, w, h);
    
    // Additive blending creates intense, bright overlaps simulating superheated gas
    ctx.globalCompositeOperation = 'lighter'; 
    
    let now = Date.now();
    let elapsed = now - startTime;
    
    // Cinematic Sequence Phase Logic
    if (phase === 0 && elapsed > 500) {
        phase = 1; // Begin pulling into the wormhole
    }
    if (phase === 1) {
        warpSpeed += (140 - warpSpeed) * 0.02; // Massive acceleration through the tube
        twistFactor += (0.0005 - twistFactor) * 0.03; // Straighten the tunnel slightly as we speed up
        if (warpSpeed > 120) {
            phase = 2;
            timeInWarp = now;
        }
    }
    if (phase === 2 && (now - timeInWarp > 1500)) {
        if (window.preloaderExitSignal) {
            phase = 3; // Prepare to exit
        }
    }
    if (phase === 3) {
        warpSpeed *= 0.85; // Hard gravitational braking
        twistFactor += 0.0008; // Twist dramatically increases as you drop out
    }
    
    // Optional global rotation to make the entire tunnel spin
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(Date.now() * 0.0004);
    ctx.translate(-w/2, -h/2);
    
    particles.forEach(p => {
      p.update(warpSpeed);
      p.draw(globalTime, twistFactor);
    });
    
    ctx.restore();
    
    // Draw the "Black Hole / Distant Destination" in the exact center
    // This blocks out lines crossing the center, enforcing the hollow tunnel illusion
    ctx.globalCompositeOperation = 'source-over';
    let centerGlow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w*0.12);
    centerGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');       // Pitch black throat center
    centerGlow.addColorStop(0.4, 'rgba(0, 0, 0, 0.9)'); 
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');       // Fades smoothly into the tunnel
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, w, h);
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  const minDuration = 4500;
  
  function endPreloader() {
    window.preloaderExitSignal = true; 
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - Math.max(elapsed, 2500)); 
    
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        preloader.remove();
      }, 1500); // Wait for the 1.5s CSS transition to finish
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
