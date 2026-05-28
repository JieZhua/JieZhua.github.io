const revealElements = document.querySelectorAll(".reveal");
const themeToggle = document.querySelector(".theme-toggle");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.15,
  },
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});
