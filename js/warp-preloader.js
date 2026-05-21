(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  const ctx = canvas.getContext('2d');
  
  let w, h;
  let particles = [];
  const PARTICLE_COUNT = 3000; // Extremely dense for the dusty accretion disk look
  
  let warpSpeed = 0; 
  let baseSpeed = 0.8;
  let twist = 0.04; // The Interstellar swirling vortex factor
  
  // Interstellar poster palette: Crimson, Deep Magenta, Teal, Cyan, White, Warm Gold
  const colors = [
    [255, 255, 255], // Pure White
    [150, 220, 230], // Teal/Cyan
    [40, 120, 150],  // Deep Teal
    [255, 100, 100], // Bright Red/Coral
    [150, 20, 50],   // Deep Crimson/Magenta
    [255, 180, 120]  // Warm Gold/Dust
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
      // Polar coordinates for vortex math
      this.angle = Math.random() * Math.PI * 2;
      
      // Distribute particles to form the glowing "disk"
      // More particles concentrated in the middle-distance radius
      let rRand = Math.random();
      this.radius = rRand * rRand * (w * 1.5) + (w * 0.05); 
      
      this.z = randomZ ? Math.random() * w : w;
      this.pz = this.z;
      
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.r = c[0];
      this.g = c[1];
      this.b = c[2];
      
      this.size = Math.random() * 1.5 + 0.2;
    }
    
    update(speedMultiplier) {
      this.pz = this.z;
      this.z -= (baseSpeed + speedMultiplier);
      
      if (this.z <= 1) {
        this.init();
        this.z = w; // Reset to the deep background
        this.pz = this.z;
      }
    }
    
    draw() {
      // Interstellar Vortex Math: Radius expands as Z approaches 0, Angle twists
      let r = (this.radius / this.z) * (w * 0.4);
      let currentAngle = this.angle + (w / this.z) * twist;
      let x = w / 2 + Math.cos(currentAngle) * r;
      let y = h / 2 + Math.sin(currentAngle) * r;
      
      let pr = (this.radius / this.pz) * (w * 0.4);
      let prevAngle = this.angle + (w / this.pz) * twist;
      let px = w / 2 + Math.cos(prevAngle) * pr;
      let py = h / 2 + Math.sin(prevAngle) * pr;
      
      let depthRatio = 1 - (this.z / w);
      if (depthRatio < 0) depthRatio = 0;
      
      // Opacity and size scale non-linearly to create explosive approach
      let opacity = Math.pow(depthRatio, 1.2); 
      let currentSize = this.size * (depthRatio * 10 + 1);
      
      // Optimization: Don't draw if completely off-screen
      if (x < -w || x > w*2 || y < -h || y > h*2) return;
      
      // Draw swirling trail
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      
      ctx.lineWidth = currentSize;
      ctx.strokeStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`;
      ctx.stroke();
      
      // Draw thick glowing dust node for larger particles
      if (this.size > 1.2 && depthRatio > 0.4) {
        ctx.beginPath();
        ctx.arc(x, y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity * 0.6})`;
        ctx.fill();
      }
    }
  }
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
  
  let animationFrame;
  let phase = 0; 
  let startTime = Date.now();
  let timeInWarp = 0;
  
  // Create a massive static nebula gradient simulating Gargantua's accretion disk
  let nebulaGradient;
  function updateNebula() {
    nebulaGradient = ctx.createRadialGradient(w/2, h/2, w*0.05, w/2, h/2, w*0.8);
    nebulaGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');         // The Black Hole / Event Horizon
    nebulaGradient.addColorStop(0.2, 'rgba(150, 20, 50, 0.12)');  // Inner glowing Crimson
    nebulaGradient.addColorStop(0.5, 'rgba(20, 100, 150, 0.08)'); // Mid glowing Cyan/Teal
    nebulaGradient.addColorStop(1, 'rgba(5, 2, 10, 0.6)');        // Deep space void at edges
  }
  
  function animate() {
    if (!nebulaGradient) updateNebula();
    
    // Use source-over to apply the trail clearing and nebula background
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw the glowing accretion disk nebula
    ctx.fillStyle = nebulaGradient;
    ctx.fillRect(0, 0, w, h);
    
    // Trail clearing layer. Less alpha = longer, smoother trails.
    // As warp speed increases, we leave longer trails
    let clearAlpha = Math.max(0.08, 0.2 - (warpSpeed * 0.002));
    ctx.fillStyle = `rgba(5, 2, 8, ${clearAlpha})`; 
    ctx.fillRect(0, 0, w, h);
    
    // Use lighter/additive blending for the particles to simulate intense burning light
    ctx.globalCompositeOperation = 'lighter'; 
    
    let now = Date.now();
    let elapsed = now - startTime;
    
    // Cinematic Sequencing
    if (phase === 0 && elapsed > 800) {
        phase = 1; // Begin pulling into the wormhole
    }
    if (phase === 1) {
        warpSpeed += (70 - warpSpeed) * 0.012; // Powerful, terrifying acceleration
        twist += (0.01 - twist) * 0.02; // Twist straightens out slightly as you enter hyperspace
        if (warpSpeed > 60) {
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
        warpSpeed *= 0.88; // Hard gravitational braking
        twist += 0.002; // Twist dramatically increases as you drop out of the wormhole
    }
    
    // Optional global rotation to make the entire disk spin slowly
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(Date.now() * 0.0002);
    ctx.translate(-w/2, -h/2);
    
    particles.forEach(p => {
      p.update(warpSpeed);
      p.draw();
    });
    
    ctx.restore();
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  window.addEventListener('resize', () => { resize(); updateNebula(); });
  
  const minDuration = 4500; // 4.5 seconds minimum dramatic experience
  
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
      }, 1500); // Give the 1.5s CSS transition time to finish
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    setTimeout(endPreloader, 100);
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
