const ring = document.querySelector(".progress-ring");
if (ring) {
  const circle = ring.querySelector(".fill");
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const percent = Number(ring.dataset.percent || 0);
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${circumference}`;

  requestAnimationFrame(() => {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.transition = "stroke-dashoffset 900ms ease";
    circle.style.strokeDashoffset = `${offset}`;
  });
}

const calendarGrid = document.getElementById("calendarGrid");
if (calendarGrid) {
  const totalSlots = 35;
  const firstDayOffset = 3;
  const daysInMonth = 31;
  const activeDay = 9;

  for (let i = 0; i < totalSlots; i += 1) {
    const btn = document.createElement("button");
    const day = i - firstDayOffset + 1;

    if (day < 1 || day > daysInMonth) {
      btn.textContent = "";
      btn.classList.add("empty");
    } else {
      btn.textContent = String(day);
      if (day === activeDay) btn.classList.add("today");
    }
    calendarGrid.appendChild(btn);
  }
}

document.querySelectorAll(".day, .segmented button, .bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => {
    const siblings = [...button.parentElement.children];
    siblings.forEach((item) => item.classList.remove("active-tab"));
    button.classList.add("active-tab");
  });
});
