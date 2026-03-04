/* ============================================================
   HALO — LOGIN PAGE LOGIC
   assets/js/login.js

   Modules:
   - ParticleEngine  — Canvas particle animation
   - AuthEngine      — Form validation, submit, demo fill
   - ForgotEngine    — Forgot password overlay
============================================================ */

/* ============================================================
   PARTICLE ENGINE — Animated dot network on left panel canvas
============================================================ */
const ParticleEngine = {
  canvas: null,
  ctx:    null,
  particles: [],

  init() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.spawnParticles();
    this.loop();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  },

  spawnParticles() {
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 18000);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x:     Math.random() * this.canvas.width,
        y:     Math.random() * this.canvas.height,
        r:     Math.random() * 1.2 + 0.3,
        vx:    (Math.random() - 0.5) * 0.25,
        vy:    (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }
  },

  loop() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    /* Draw connecting lines between nearby particles */
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx   = this.particles[i].x - this.particles[j].x;
        const dy   = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(45,125,210,${0.08 * (1 - dist / 90)})`;
          ctx.lineWidth   = 0.5;
          ctx.moveTo(this.particles[i].x, this.particles[i].y);
          ctx.lineTo(this.particles[j].x, this.particles[j].y);
          ctx.stroke();
        }
      }
    }

    /* Draw and move each particle */
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(91,163,232,${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      /* Wrap around edges */
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width)  p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
    });

    requestAnimationFrame(() => this.loop());
  },
};

/* ============================================================
   AUTH ENGINE — Validation, submit, demo auto-fill
============================================================ */
const AuthEngine = {
  remember:  false,
  pwVisible: false,

  /* Validate email field, apply visual state */
  validateEmail(input) {
    const valid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    const errEl  = document.getElementById('err-email');
    if (input.value.length === 0) {
      input.classList.remove('valid', 'invalid');
      errEl.classList.remove('show');
    } else if (valid) {
      input.classList.add('valid');
      input.classList.remove('invalid');
      errEl.classList.remove('show');
    } else {
      input.classList.add('invalid');
      input.classList.remove('valid');
      errEl.classList.add('show');
    }
    return valid;
  },

  /* Validate password field */
  validatePassword(input) {
    const valid = input.value.length >= 6;
    const errEl = document.getElementById('err-password');
    if (input.value.length === 0) {
      input.classList.remove('valid', 'invalid');
      errEl.classList.remove('show');
    } else if (valid) {
      input.classList.add('valid');
      input.classList.remove('invalid');
      errEl.classList.remove('show');
    } else {
      input.classList.add('invalid');
      input.classList.remove('valid');
      errEl.classList.add('show');
    }
    return valid;
  },

  /* Toggle password field visibility */
  togglePassword() {
    this.pwVisible = !this.pwVisible;
    document.getElementById('input-password').type = this.pwVisible ? 'text' : 'password';
    document.getElementById('pw-toggle').textContent = this.pwVisible ? 'hide' : 'show';
  },

  /* Toggle remember me checkbox */
  toggleRemember() {
    this.remember = !this.remember;
    document.getElementById('remember-box').classList.toggle('checked', this.remember);
  },

  /* Fill in demo credentials and auto-submit */
  fillDemo() {
    const emailInput = document.getElementById('input-email');
    const passInput  = document.getElementById('input-password');
    emailInput.value = 'demo@halo.clinic';
    passInput.value  = 'halo2025';
    this.validateEmail(emailInput);
    this.validatePassword(passInput);
    setTimeout(() => this.submit(null), 400);
  },

  /* Form submission handler */
  async submit(e) {
    if (e) e.preventDefault();

    const emailInput = document.getElementById('input-email');
    const passInput  = document.getElementById('input-password');
    const btn        = document.getElementById('submit-btn');
    const btnText    = document.getElementById('btn-text');

    const emailOk = this.validateEmail(emailInput);
    const passOk  = this.validatePassword(passInput);

    /* Abort if invalid */
    if (!emailOk || !passOk) return;

    /* Show loading state */
    btn.classList.add('loading');
    btnText.textContent = 'AUTHENTICATING...';

    /* Simulate auth call */
    await new Promise(r => setTimeout(r, 1800));

    /* Show success screen then redirect */
    document.getElementById('success-screen').classList.add('show');
    await new Promise(r => setTimeout(r, 2200));
    window.location.href = APP.routes.records;
  },
};

/* ============================================================
   FORGOT ENGINE — Forgot password overlay
============================================================ */
const ForgotEngine = {
  open() {
    document.getElementById('forgot-overlay').classList.add('open');
    setTimeout(() => document.getElementById('forgot-email').focus(), 300);
  },

  close() {
    document.getElementById('forgot-overlay').classList.remove('open');
  },

  closeOnBackdrop(e) {
    if (e.target === document.getElementById('forgot-overlay')) this.close();
  },

  submit() {
    const email = document.getElementById('forgot-email').value.trim();
    const input = document.getElementById('forgot-email');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      input.style.borderColor = 'var(--danger)';
      return;
    }
    this.close();
    Toast.show(`Reset link sent to ${email}`);
  },
};

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ParticleEngine.init();
});
