// Splash screen
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  setTimeout(() => splash.classList.add('fade-out'), 2000);
});

// Countdown timer
const countdown = document.getElementById('countdown');
const weddingDate = new Date("Sep 09, 2025 12:45:00").getTime();

const timer = setInterval(() => {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdown.innerHTML = `💞 Countdown: ${days}d ${hours}h ${minutes}m ${seconds}s`;

  if (distance < 0) {
    clearInterval(timer);
    countdown.innerHTML = "🎉 The wedding has begun!";
  }
}, 1000);

// RSVP form
document.getElementById("rsvpForm").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("rsvpMsg").innerText = "Thank you for your response!";
  e.target.reset();
});


