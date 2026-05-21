(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  const ctx = canvas.getContext('2d');
  
  let w, h;
  let stars = [];
  const STAR_COUNT = 1500; // Optimal density for glow without lagging
  
  // Hyperspace parameters
  let warpSpeed = 0; 
  let baseSpeed = 0.5; // Idle floating speed
  
  // Cinematic color palette
  const colors = [
    [255, 255, 255], // Pure white
    [200, 230, 255], // Ice blue
    [100, 150, 255], // Deep blue
    [255, 220, 150], // Gold/Amber
    [255, 150, 150], // Soft pink
    [50, 255, 255]   // Cyan
  ];
  
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  class Star {
    constructor() {
      this.init(true);
    }
    
    init(randomZ = false) {
      // Spawn stars in a much larger area to prevent edge-popping during warp
      this.x = (Math.random() - 0.5) * w * 3;
      this.y = (Math.random() - 0.5) * h * 3;
      this.z = randomZ ? Math.random() * w : w;
      this.pz = this.z;
      
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.r = c[0];
      this.g = c[1];
      this.b = c[2];
      
      this.size = Math.random() * 1.5 + 0.5;
    }
    
    update(speedMultiplier) {
      this.pz = this.z;
      this.z -= (baseSpeed + speedMultiplier);
      
      if (this.z <= 1 || this.x / this.z * w > w || this.y / this.z * h > h) {
        this.init();
      }
    }
    
    draw() {
      let x = (this.x / this.z) * w + w / 2;
      let y = (this.y / this.z) * h + h / 2;
      
      let px = (this.x / this.pz) * w + w / 2;
      let py = (this.y / this.pz) * h + h / 2;
      
      let depthRatio = 1 - (this.z / w);
      let opacity = Math.max(0, depthRatio);
      
      let currentSize = this.size * (depthRatio * 5 + 0.5);
      
      // Draw trailing line (Tapered effect by using globalCompositeOperation 'screen' and speed)
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      
      ctx.lineWidth = currentSize;
      ctx.strokeStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`;
      ctx.stroke();
      
      // Draw glowing head
      ctx.beginPath();
      ctx.arc(x, y, currentSize * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      
      // Glow effect only for close stars to maintain 60 FPS
      if (depthRatio > 0.6) {
        ctx.shadowBlur = currentSize * 4;
        ctx.shadowColor = `rgb(${this.r}, ${this.g}, ${this.b})`;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
    }
  }
  
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
  }
  
  let animationFrame;
  let phase = 0; // 0: idle, 1: punch, 2: warp, 3: brake
  let startTime = Date.now();
  let timeInWarp = 0;
  
  function animate() {
    // Deep space background with motion blur trail
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 5, 12, 0.25)'; // Dark nebula tint
    ctx.shadowBlur = 0;
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalCompositeOperation = 'lighter'; // Screen/Additive blending for real glow
    
    // Center wormhole aperture glow
    let apertureGlow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    apertureGlow.addColorStop(0, `rgba(50, 100, 255, ${warpSpeed * 0.005})`);
    apertureGlow.addColorStop(0.3, `rgba(20, 10, 40, ${warpSpeed * 0.001})`);
    apertureGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = apertureGlow;
    ctx.fillRect(0, 0, w, h);
    
    // Gentle rotation
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(Date.now() * 0.00005 + warpSpeed * 0.0001);
    ctx.translate(-w/2, -h/2);
    
    let now = Date.now();
    let elapsed = now - startTime;
    
    // Phase logic for cinematic pacing
    if (phase === 0 && elapsed > 800) {
        phase = 1; // start accelerating
    }
    
    if (phase === 1) {
        warpSpeed += (80 - warpSpeed) * 0.02; // Exponential curve punch
        if (warpSpeed > 75) {
            phase = 2;
            timeInWarp = now;
        }
    }
    
    if (phase === 2 && (now - timeInWarp > 1500)) {
        // Ready to exit if site loaded
        if (window.preloaderExitSignal) {
            phase = 3;
        }
    }
    
    if (phase === 3) {
        warpSpeed *= 0.85; // Hard brake dropping out of warp
    }
    
    stars.forEach(star => {
      star.update(warpSpeed);
      star.draw();
    });
    
    ctx.restore();
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Fade out logic
  const minDuration = 4500; // Total experience time 4.5s
  
  function endPreloader() {
    window.preloaderExitSignal = true; // Tells animation loop to brake
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - Math.max(elapsed, 2500)); // Ensure at least warp happens
    
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        preloader.remove();
      }, 1000); // Wait for CSS transition
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
