// Intersection Observer for animations
const animationObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
      }
    });
  },
  {
    threshold: 0.1
  }
);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  animationObserver.observe(section);
});

// Function to add animation class to elements when they become visible
function handleScrollAnimations() {
  const elements = document.querySelectorAll('.skill-badge, .project-item, .experience-item, .award-item');
  
  elements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const elementBottom = element.getBoundingClientRect().bottom;
    
    if (elementTop < window.innerHeight && elementBottom > 0) {
      element.style.opacity = "1";
    }
  });
}

// Add scroll listener
window.addEventListener('scroll', handleScrollAnimations);
// Initial check for visible elements
handleScrollAnimations();
