+++
title = "Hello, zola!"
slug = "hello-zola"
date = 2023-03-10T21:23:47+08:00
[taxonomies]
tags = ["tools", "zola"]
+++

随着 rust 的流行，近年来我在 linux 环境下的很多工具都切换到 rust 版本了，比如 alacritty、ripgrep、bat、exa 等。而静态博客还在用 hugo 多少有点不合群了，那就一并换成 [zola](https://www.getzola.org/) 吧。

---

## 主题

之前 hugo 用的主题是 [MemE](https://github.com/reuixiy/hugo-theme-meme)，zola 里没有对应的主题，所以打算参考原版主题自己写一个。配色上参考了 [catppuccin](https://github.com/catppuccin/catppuccin)，这也是我在 VSCode/Neovim 里一直在用的配色方案。

## 添加 icon

网站中的 icon 图标采用 [iconify](https://iconify.design/) 方案，使用起来非常方便。

只需要在 html 的 `<head>` 中加载以下 js：

```html
<script src="https://cdn.jsdelivr.net/npm/iconify-icon@1.0.7/dist/iconify-icon.min.js"></script>
```

在用到 icon 的地方，直接用 `<iconify-icon>`，比如：

```html
<iconify-icon icon="mdi:tags"></iconify-icon>
```

实际使用时，发现 icon 和文字不对齐。在 `css` 中添加以下属性解决：

```css
iconify-icon {
  vertical-align: -0.125em;
}
```

## 亮暗模式切换

首先在 css 中定义亮、暗模式下的颜色值：

```css
:root {
  --color-red: #d20f39;
  --color-yellow: #df8e1d;
  --color-green: #40a02b;
  --color-text: #4c4f69;
  --color-base: #eff1f5;
  /* 省略... */
}

:root[data-theme="dark"] = {
  --color-red: #f38ba8;
  --color-yellow: #f9e2af;
  --color-green: #a6e3a1;
  --color-text: #cdd6f4;
  --color-base: #1e1e2e;
  /* 省略... */
}
```

在 css 样式中凡是涉及到颜色定义的，都必须引用以上变量，比如：

```css
html, body {
  color: var(--color-text);
  background-color: var(--color-base);
}
```

那么只要 `--color-*` 这些变量值改变了，网站的颜色就会跟着变化。

在网页的头部添加一个切换主题的图标：

```html
<li>
  <a id="theme-switcher" href="#">
    <iconify-icon id="theme-switcher-light" icon="material-symbols:light-mode" class="menu-icon"></iconify-icon>
    <iconify-icon id="theme-switcher-dark" icon="material-symbols:dark-mode" class="menu-icon"></iconify-icon>
  </a>
</li>
```

最后我们需要用 js 脚本来切换主题：

```javascript
class ThemeSwitcher {
  constructor() {}

  // 初始化主题
  initTheme() {
    const currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    this.updateDom(currentTheme);
  }

  // 切换主题
  switchTheme() {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const theme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    this.updateDom(theme);
  }

  // 切换主题图标
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

// DOM 加载后调用
window.addEventListener(
  "DOMContentLoaded",
  () => {
    switcher.initTheme();
    // 给图标添加点击事件，点击图标切换主题
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
```
