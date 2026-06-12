const sprinkleColors = ["#FF6B9D", "#FFD93D", "#6BCB77", "#E6E6FA", "#FFDAB9"];
let lastSprinkleTime = 0;

function createSprinkle(x, y) {
  const sprinkle = document.createElement("span");
  sprinkle.className = "sprinkle";
  sprinkle.style.left = `${x}px`;
  sprinkle.style.top = `${y}px`;
  sprinkle.style.backgroundColor =
    sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)];

  document.body.appendChild(sprinkle);

  setTimeout(() => {
    sprinkle.remove();
  }, 1000);
}

document.addEventListener("mousemove", (event) => {
  const now = Date.now();

  if (now - lastSprinkleTime < 85) {
    return;
  }

  lastSprinkleTime = now;
  createSprinkle(event.clientX, event.clientY);
});

function createConfetti() {
  for (let index = 0; index < 28; index++) {
    const confetti = document.createElement("span");
    confetti.className = "confetti-piece";

    const angle = (index / 28) * Math.PI * 2;
    const distance = 90 + Math.random() * 90;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    confetti.style.backgroundColor = sprinkleColors[index % sprinkleColors.length];
    confetti.style.setProperty("--x", `${x}px`);
    confetti.style.setProperty("--y", `${y}px`);
    confetti.style.animationDelay = `${index * 0.015}s`;

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 1000);
  }
}

document.addEventListener("click", (event) => {
  const target = event.target;

  if (target && target.matches("[data-confetti]")) {
    createConfetti();
  }
});
