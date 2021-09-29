---
title: "zsh 插件推荐"
slug: "zsh-plug"
date: 2020-02-26T17:25:36+08:00
dropCap: false
draft: true
toc: true
tags: ["tools"]
---


刚从 Oh-My-Zsh 转战 zinit 时，折腾插件和配置折腾了一段时间，后来我的 zsh 配置就没怎么动过了。留下来的几个都是我觉得很实用的插件，不搞那些花里胡哨的。

<!--more-->

---

## 目录结构

我[使用 stow 管理我的 dotfiles]({{< ref "使用 GNU stow 管理你的 dotfiles.md" >}})，而且不喜欢把配置文件直接放在 home 目录下，能移到 `.config` 目录下的都要移进去。zsh 的配置文件目录由 `ZDOTDIR` 指定，默认为 `$HOME`，可以在 `~/.zshenv` 中指定：

```bash
export ZDOTDIR=$HOME/.config/zsh
```

这样其它的 zsh 配置（如 .zshrc）就可以放在 `$ZDOTDIR` 中而不会污染了 home 目录。zsh 相关配置文件的目录结构如下：

```plaintext
~
├── .config
│  └── zsh
│    ├── .zshrc
│    ├── zinit
│    │  └── bin
│    └── [其他 zsh 相关文件]
└── .zshenv
```

## zinit 插件管理器

如果你觉得 Oh-My-Zsh 启动慢，不妨试试 zinit。zinit 真的可以[让你的 zsh 起飞]({{< ref "/posts/zinit：让你的%20zsh%20起飞.md" >}})，即使不用 Turbo Mode，我在日常使用中也完全感受不到它的加载延迟。zinit 不仅能管理 zsh 插件，理论上还可以帮你管理你的软件，使用 zinit 命令可以自动从 github 或其他地方下载软件包并执行编译、安装、移动等操作。

## 借用 Oh-My-Zsh 的配置和插件

zinit 的好处就在于，你可以按需下载 Oh-My-Zsh 上完善的配置和插件系统。我个人使用了这些插件：

```bash
zinit for \
    OMZ::lib/theme-and-appearance.zsh \
    OMZ::lib/completion.zsh \
    OMZ::lib/compfix.zsh \
    OMZ::lib/clipboard.zsh \
    OMZ::lib/git.zsh \
    OMZ::lib/directories.zsh \
    OMZ::plugins/git/git.plugin.zsh \
    OMZ::plugins/colored-man-pages/colored-man-pages.plugin.zsh \
    OMZ::plugins/sudo/sudo.plugin.zsh
```

- git 插件提供了 git 的一些 aliases
- colored-man-pages 为 man 手册上色
- sudo：敲完命令后发现忘记加 sudo 了，按两下 ESC 会给你自动加上 sudo

## power10k：你的最后一个 zsh 主题

zsh 主题只推荐一个 [power10k](https://github.com/romkatv/powerlevel10k)，谁用谁知道。

## fast-syntax-highlighting：骚气的命令行高亮

[fast-syntax-highlighting](https://github.com/zdharma/fast-syntax-highlighting) 为 zsh 提供了骚气的命令行颜色高亮。而且会随着你的输入变换颜色，如果输入了错误的命令，显示为红色。

![img.png](/images/zsh-plug-1.png)

## zsh-autosuggestions：自动补全建议

[zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) 根据你的命令输入历史和补全猜测你将要输入的命令，以灰色显示在背景上。按 Ctrl-E 或 End 接受补全建议。

![img.gif](/images/zsh-plug-2.gif)

## fzf-tab：让 fzf 接管你的补全

[fzf-tab](https://github.com/Aloxaf/fzf-tab) 绝对是一个用了就回不去的效率提升神器。它依赖于 [fzf]，当你按下 `tab` 时会跳出 fzf 界面，在这里你可以模糊搜索你想要的补全项。

![img.gif](/images/zsh-plug-3.gif)

## z.lua 目录跳转

[z.lua](https://github.com/skywind3000/z.lua) 会按权重记住你进入过的目录。比如你经常 cd 到 `home/source/dotfiles` 目录下，下次进入只需要键入 `z dot` 就会自动跳到这个目录。
