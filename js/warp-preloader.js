(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let stars = [];
  const numStars = 2500; // Increased density for wormhole effect
  let speed = 0.2; // Start very slow
  let targetSpeed = 45; // Max warp speed
  
  // Richer color palette (blues, golds, cyans, purples, pure whites)
  const colors = [
    'rgba(255, 255, 255,', // White
    'rgba(200, 220, 255,', // Light blue
    'rgba(150, 180, 255,', // Deeper blue
    'rgba(255, 230, 180,', // Warm gold/yellow
    'rgba(255, 200, 180,', // Slight pink/orange
    'rgba(120, 255, 255,', // Cyan
    'rgba(200, 150, 255,'  // Light purple
  ];
  
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  class Star {
    constructor() {
      this.reset(true);
    }
    
    reset(initial = false) {
      this.x = (Math.random() - 0.5) * width * 2;
      this.y = (Math.random() - 0.5) * height * 2;
      this.z = initial ? Math.random() * width : width;
      this.pz = this.z;
      // Assign random color
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
      this.z -= speed;
      if (this.z < 1) {
        this.reset();
      }
    }
    
    draw() {
      let x = (this.x / this.z) * width + width / 2;
      let y = (this.y / this.z) * height + height / 2;
      
      let px = (this.x / this.pz) * width + width / 2;
      let py = (this.y / this.pz) * height + height / 2;
      
      this.pz = this.z;
      
      let opacity = 1 - (this.z / width);
      if (opacity < 0) opacity = 0;
      if (opacity > 1) opacity = 1;
      
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `${this.colorBase} ${opacity})`; 
      
      // Simulate wormhole distortion (thicker at the edges)
      let distFromCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2));
      let distortion = Math.min(distFromCenter / (width/2), 1.8);
      
      ctx.lineWidth = Math.max(0.2, opacity * 3 * distortion); 
      ctx.stroke();
    }
  }
  
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }
  
  let animationFrame;
  function animate() {
    // Lower alpha creates much longer trails, adding to the warp/wormhole effect
    ctx.fillStyle = 'rgba(0, 1, 5, 0.15)'; 
    ctx.fillRect(0, 0, width, height);
    
    // Add a slight rotation to the canvas to simulate a spiraling wormhole
    ctx.save();
    ctx.translate(width/2, height/2);
    // Rotate very slowly, speed influences rotation
    ctx.rotate(Date.now() * 0.0001 + speed * 0.002); 
    ctx.translate(-width/2, -height/2);
    
    stars.forEach(star => {
      star.update();
      star.draw();
    });
    
    ctx.restore();
    
    // Exponential-like acceleration for cinematic warp punch
    if (speed < targetSpeed) {
      speed += 0.03 + (speed * 0.03);
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Fade out logic
  const startTime = Date.now();
  const minDuration = 4000; // Increased to 4 seconds
  let isEnding = false;
  
  function endPreloader() {
    if (isEnding) return;
    isEnding = true;
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - elapsed);
    
    setTimeout(() => {
      // Simulate dropping out of warp
      let decelerate = setInterval(() => {
        speed *= 0.85;
        if (speed < 0.5) clearInterval(decelerate);
      }, 50);
      
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none'; 
      
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        preloader.remove();
      }, 1200); // Smooth transition duration
    }, remaining);
  }
  
  if (document.readyState === 'complete') {
    endPreloader();
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
