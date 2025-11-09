// Modern Portfolio JavaScript - Advanced Animations & Interactions

document.addEventListener('DOMContentLoaded', function() {
  // Particle.js Configuration
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#00d4ff' },
        shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
        opacity: { value: 0.5 },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#00d4ff',
          opacity: 0.4,
          width: 1
        },
        move: {
          enable: true,
          speed: 6,
          direction: 'none',
          out_mode: 'out'
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'repulse' },
          onclick: { enable: true, mode: 'push' },
          resize: true
        },
        modes: {
          repulse: { distance: 200, duration: 0.4 },
          push: { particles_nb: 4 }
        }
      },
      retina_detect: true
    });
  }

  // Loading Screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 2000);
  }

  // Typing animation with updated 2025 info
  const typingElement = document.querySelector('.typing-text');
  if (typingElement) {
    const phrases = [
      "Duke CS • Math • DI ’27",
      "Co-Founder @ SpeakSeeker.com",
      "ML Research – Grid / ALIGN",
      "Outstanding TA (CS 230/231, MATH 222/230)",
      "Live Más Scholar 🌮🔔"
    ];
    new TypeWriter(typingElement, phrases, 100);
  }

  initializeEmailJS();
  initializeAnimations();
  initializeNavigation();
  initializeForm();
  animateSkillLevels();
  highlightCode();
  updateActiveNavLink();

  // add scroll-animate class to more elements incl. new sections
  const animateElements = document.querySelectorAll('.timeline-item, .project-card, .skill-item, .stat-item, .contact-item, .research .project-card, .activities .project-card');
  animateElements.forEach(el => {
    el.classList.add('scroll-animate');
  });

  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  });

  setTimeout(revealOnScroll, 100);
});

class TypeWriter {
  constructor(element, text, speed = 100) {
    this.element = element;
    this.phrases = Array.isArray(text) ? text : [text];
    this.speed = speed;
    this.currentPhraseIndex = 0;
    this.currentIndex = 0;
    this.isDeleting = false;
    this.type();
  }

  type() {
    const currentPhrase = this.phrases[this.currentPhraseIndex];
    const currentText = currentPhrase.substring(0, this.currentIndex);
    this.element.textContent = currentText;

    if (!this.isDeleting && this.currentIndex < currentPhrase.length) {
      this.currentIndex++;
      setTimeout(() => this.type(), this.speed);
    } else if (this.isDeleting && this.currentIndex > 0) {
      this.currentIndex--;
      setTimeout(() => this.type(), this.speed / 2);
    } else {
      if (this.isDeleting) {
        this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
        this.currentIndex = 0;
      }
      this.isDeleting = !this.isDeleting;
      setTimeout(() => this.type(), this.speed * 3);
    }
  }
}

function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll('.scroll-animate, .timeline-item, .project-card, .skill-item, .stat-item, .research .project-card, .activities .project-card');
  animateElements.forEach(el => observer.observe(el));
}

function initializeNavigation() {
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

  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  window.addEventListener('scroll', throttle(updateActiveNavLink, 100));
  window.addEventListener('scroll', throttle(revealOnScroll, 100));
}

function initializeEmailJS() {
  emailjs.init("WrKF1vTCKTatSA0dL");
}

function initializeForm() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      if (!name || !email || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
      }
      showNotification('Sending message...', 'info');
      emailjs.send("service_b65aei9", "template_hizd0pa", {
        from_name: name,
        from_email: email,
        message: message,
        to_name: "Aidan Hall"
      })
      .then(
        function() {
          showNotification('Message sent successfully!', 'success');
          contactForm.reset();
        },
        function(error) {
          showNotification('Failed to send message. Please try again.', 'error');
          console.error('EmailJS Error:', error);
        }
      );
    });
  }
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

function animateSkillLevels() {
  const skillItems = document.querySelectorAll('.skill-item');
  skillItems.forEach(item => {
    const level = item.getAttribute('data-level');
    if (level) {
      item.style.setProperty('--skill-level', `${level}%`);
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    background: ${type === 'success' ? '#27ca3f' : type === 'error' ? '#ff5f56' : '#00d4ff'};
  `;
  document.body.appendChild(notification);
  setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function highlightCode() {
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const text = block.textContent;
    const highlighted = text
      .replace(/\b(class|constructor|return|async|await|const|let|var|function|if|else|for|while)\b/g, '<span class="keyword">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>');
    block.innerHTML = highlighted;
  });
}

function revealOnScroll() {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (sectionTop < windowHeight * 0.75) {
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }
  });
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
