class ThemeSwitcher {
  constructor() {}

  initTheme() {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === null) {
      // No stored preference: set to system preference if available.
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        currentTheme = "dark";
      } else {
        currentTheme = "light";
      }
    }
    // Apply the current theme to the document.
    document.documentElement.setAttribute("data-theme", currentTheme);

    this.updateDom(currentTheme);
  }

  switchTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const theme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    this.updateDom(theme);
  }

  updateDom(mode) {
    const light_icon = document.getElementById("theme-switcher-light");
    const dark_icon = document.getElementById("theme-switcher-dark");
    if (mode === "light") {
      if (light_icon) light_icon.style.display = "inline-block";
      if (dark_icon) dark_icon.style.display = "none";
    } else {
      if (light_icon) light_icon.style.display = "none";
      if (dark_icon) dark_icon.style.display = "inline-block";
    }
  }
}

let switcher = new ThemeSwitcher();

window.addEventListener(
  "DOMContentLoaded",
  () => {
    switcher.initTheme();
    const a = document.getElementById("theme-switcher");
    a &&
      a.addEventListener("click", (a) => {
        a.preventDefault();
        switcher.switchTheme();
      });
  },
  {
    once: true,
  }
);

/** Hide header on scroll down, show on scroll up */
let lastScrollY = 0;

window.addEventListener("scroll", () => {
  const deltaScrollY = window.scrollY - lastScrollY;
  lastScrollY = window.scrollY;

  const header = document.getElementById("header");
  const h = -header.clientHeight;
  if (deltaScrollY > 0) {
    header.style.top = h + "px";
  } else {
    // header.setAttribute("style", "top: 0px");
    header.style.top = 0;
  }
});
