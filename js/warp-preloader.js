(function() {
  const preloader = document.getElementById('warp-preloader');
  if (!preloader) return;

  const canvas = document.getElementById('warp-canvas');
  const ctx = canvas.getContext('2d');
  
  let width, height;
  let stars = [];
  const numStars = 800; // Increase for more particles
  let speed = 2; // initial slow speed
  let targetSpeed = 25; // warp speed
  
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
      
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(180, 220, 255, ${1 - this.z / width})`; // Blue-ish white
      ctx.lineWidth = Math.max(0.5, (1 - this.z / width) * 2.5); // Thicker as it gets closer
      ctx.stroke();
    }
  }
  
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }
  
  let animationFrame;
  function animate() {
    ctx.fillStyle = 'rgba(0, 5, 15, 0.3)'; // Deep dark blue/black trail effect
    ctx.fillRect(0, 0, width, height);
    
    stars.forEach(star => {
      star.update();
      star.draw();
    });
    
    // Smoothly accelerate to target warp speed
    if (speed < targetSpeed) {
      speed += 0.3;
    }
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Fade out logic
  const startTime = Date.now();
  const minDuration = 1800; // minimum 1.8 seconds of warp speed
  let isEnding = false;
  
  function endPreloader() {
    if (isEnding) return;
    isEnding = true;
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDuration - elapsed);
    
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none'; // allow clicking through immediately
      setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        preloader.remove();
      }, 800); // Wait for transition to finish
    }, remaining);
  }
  
  // Try to bind to Hexo/Pjax load event if possible, fallback to standard load
  if (document.readyState === 'complete') {
    endPreloader();
  } else {
    window.addEventListener('load', endPreloader);
  }
})();
