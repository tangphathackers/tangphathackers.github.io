// ========== Smooth Scrolling ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== Navbar Scroll Effect ==========
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.background = 'rgba(255, 255, 255, 0.05)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
    
    lastScroll = currentScroll;
});

// ========== Mobile Menu Toggle ==========
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
let isMenuOpen = false;

hamburger.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
        navMenu.style.display = 'flex';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '100%';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.flexDirection = 'column';
        navMenu.style.background = 'rgba(10, 10, 10, 0.95)';
        navMenu.style.padding = '20px';
        navMenu.style.borderRadius = '20px';
        navMenu.style.marginTop = '10px';
        
        // Animate hamburger to X
        hamburger.children[0].style.transform = 'rotate(45deg) translateY(6px)';
        hamburger.children[1].style.opacity = '0';
        hamburger.children[2].style.transform = 'rotate(-45deg) translateY(-6px)';
    } else {
        navMenu.style.display = 'none';
        
        // Reset hamburger
        hamburger.children[0].style.transform = 'none';
        hamburger.children[1].style.opacity = '1';
        hamburger.children[2].style.transform = 'none';
    }
});

// ========== Animated Counter ==========
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = '$' + value.toLocaleString() + '.00';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ========== Intersection Observer for Animations ==========
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            
            // Animate prices if it's a stat card
            if (entry.target.classList.contains('stat-card')) {
                const priceElement = entry.target.querySelector('.stat-price');
                if (priceElement && !priceElement.dataset.animated) {
                    const finalValue = parseInt(priceElement.textContent.replace(/\D/g, ''));
                    animateValue(priceElement, 0, finalValue, 2000);
                    priceElement.dataset.animated = 'true';
                }
            }
        }
    });
}, observerOptions);

// Observe all feature cards and stat cards
document.querySelectorAll('.feature-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// ========== Mini Charts ==========
function drawMiniChart(canvasId, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Generate random data points
    const points = [];
    const numPoints = 20;
    for (let i = 0; i < numPoints; i++) {
        points.push({
            x: (width / numPoints) * i,
            y: height / 2 + (Math.random() - 0.5) * height * 0.6
        });
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, 'transparent');
    
    // Draw the chart line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
    );
    
    // Fill area under the line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
    );
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Initialize charts when page loads
window.addEventListener('load', () => {
    drawMiniChart('btc-chart', '#ffa500');
    drawMiniChart('eth-chart', '#627eea');
    drawMiniChart('bnb-chart', '#f0b90b');
});

// ========== Wallet Connection Simulation ==========
const walletBtn = document.querySelector('.wallet-btn');
let isConnected = false;

walletBtn.addEventListener('click', async () => {
    if (!isConnected) {
        walletBtn.innerHTML = '<span>Connecting...</span>';
        walletBtn.style.pointerEvents = 'none';
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        isConnected = true;
        walletBtn.innerHTML = '<span>0x1234...5678</span>';
        walletBtn.style.background = 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)';
    } else {
        isConnected = false;
        walletBtn.innerHTML = '<span>Connect Wallet</span>';
        walletBtn.style.background = 'var(--gradient-2)';
    }
    walletBtn.style.pointerEvents = 'auto';
});

// ========== Particle Effect on Mouse Move ==========
let particles = [];
const maxParticles = 50;

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.life = 100;
        this.decay = Math.random() * 0.02 + 0.005;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay * 100;
        this.speedX *= 0.98;
        this.speedY *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d4ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Create particle canvas
const particleCanvas = document.createElement('canvas');
particleCanvas.style.position = 'fixed';
particleCanvas.style.top = '0';
particleCanvas.style.left = '0';
particleCanvas.style.width = '100%';
particleCanvas.style.height = '100%';
particleCanvas.style.pointerEvents = 'none';
particleCanvas.style.zIndex = '999';
document.body.appendChild(particleCanvas);

const particleCtx = particleCanvas.getContext('2d');

function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);

// Mouse move handler
let mouseX = 0;
let mouseY = 0;
let isMouseMoving = false;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseMoving = true;
    
    // Create new particle
    if (particles.length < maxParticles) {
        particles.push(new Particle(mouseX, mouseY));
    }
    
    // Stop creating particles after a delay
    setTimeout(() => {
        isMouseMoving = false;
    }, 100);
});

// Animation loop for particles
function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    particles = particles.filter(particle => {
        particle.update();
        if (particle.life > 0) {
            particle.draw(particleCtx);
            return true;
        }
        return false;
    });
    
    requestAnimationFrame(animateParticles);
}

animateParticles();

// ========== Price Update Animation ==========
function updatePrices() {
    const priceElements = document.querySelectorAll('.stat-price');
    priceElements.forEach(element => {
        const currentPrice = parseFloat(element.textContent.replace(/[\$,]/g, ''));
        const change = (Math.random() - 0.5) * currentPrice * 0.001; // 0.1% max change
        const newPrice = currentPrice + change;
        
        element.textContent = '$' + newPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Update change indicator
        const changeElement = element.parentElement.querySelector('.stat-change');
        if (changeElement) {
            const changePercent = (change / currentPrice * 100).toFixed(2);
            if (change > 0) {
                changeElement.textContent = `↑ ${Math.abs(changePercent)}%`;
                changeElement.className = 'stat-change positive';
            } else {
                changeElement.textContent = `↓ ${Math.abs(changePercent)}%`;
                changeElement.className = 'stat-change negative';
            }
        }
    });
}

// Update prices every 3 seconds
setInterval(updatePrices, 3000);

// ========== Loading Animation ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ========== Console Easter Egg ==========
console.log('%c Welcome to CryptoVerse! 🚀', 
    'background: linear-gradient(135deg, #00d4ff 0%, #ff00ea 100%); color: white; font-size: 20px; padding: 10px 20px; border-radius: 10px;');
console.log('%c Built with ❤️ for the crypto community', 
    'color: #00d4ff; font-size: 14px; padding: 5px;');
