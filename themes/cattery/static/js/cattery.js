class ThemeSwitcher {
  constructor() {}

  initTheme() {
    const currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    this.updateDom(currentTheme);
  }

  switchTheme() {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const theme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    this.updateDom(theme);
  }

  updateDom(mode) {
    const light_icon = document.getElementById("theme-switcher-light");
    const dark_icon = document.getElementById("theme-switcher-dark");
    if (mode === "light") {
      light_icon.style.display = "inline-block";
      dark_icon.style.display = "none";
    } else {
      light_icon.style.display = "none";
      dark_icon.style.display = "inline-block";
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
