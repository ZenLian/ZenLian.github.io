+++
title = "使用 GNU stow 管理你的 dotfiles"
slug = "dotfiles"
date = 2020-02-16T14:15:37+08:00
[taxonomies]
tags = ["tools", "dotfiles"]
+++

你的 home 目录下是否散落着各种各样的配置文件（dotfiles）？这些配置文件有些直接在 home 目录下，有些在 .config 目录下，和其他文件混在一起难以管理和同步。我曾经将这些配置文件都移动到一个单独的 dotfiles 目录中，然后写个 bash 脚本软链接到 home 目录下。虽然能用，但用起来还是不太顺手。直到我看到[这篇文章](http://brandon.invergo.net/news/2012-05-26-using-gnu-stow-to-manage-your-dotfiles.html)，原来 GNU stow 已经替我完成了这些软链接管理。

---

[GNU stow](https://www.gnu.org/software/stow/) 最初是用来管理从源码安装的程序的，但是也可以用于管理你的 dotfiles[^1]，配合 git 食用更佳。

比如我有 zsh, git 和 tmux 的配置需要管理，如果不使用 stow，那么这些配置文件会散落在 HOME 目录下：

```plaintext
$HOME
├── .config
│  └── zsh
│    ├── .zshrc
│    └── [其他 zsh 相关文件]
├── .gitconfig
├── .tmux.conf
├── .tmux
│  └── [其他 tmux 相关文件]
└── .zshenv
```

使用 stow 来管理的话，就可以把属于同一个程序的配置文件组织在一起。在任意地方新建一个 dotfiles 目录，然后为每个程序建立一个自己的配置文件夹，把属于它的配置丢进去：

```plaintext
dotfiles
├── git
│  └── .gitconfig
├── tmux
│  ├── .tmux.conf
│  └── .tmux
│     └── [其他 tmux 相关文件]
└── zsh
   ├── .config
   │  └── zsh
   │    ├── .zshrc
   │    └── [其他 zsh 相关文件]
   └── .zshenv
```

然后在 dotfiles 中执行 stow 命令：

```bash
cd ~/dotfiles
stow -t $HOME git
stow -t $HOME tmux
stow -t $HOME zsh
```

stow 会负责把 dotfiles 中的配置文件软链接至你的 HOME 目录下。

如果你的 dotfiles 直接位于 HOME 目录下（`~/dotfiles/`），那么可以省略 `-t $HOME` 参数，stow 默认会软链接到上级目录。

这样一来配置文件的结构变得清晰许多，管理起来也很方便，要修改配置的时候到 dotfiles 中对应的目录去找就可以了。最后把这个 dotfiles 往 github 上一丢，完事儿。

[我的 dotfiles](https://github.com/ZenLian/dotfiles.git) 中使用一个简单的 bash 安装脚本：

```bash
list=(zsh git tmux nvim ranger conda)
for i in ${list[*]}; do
    stow -t $HOME $i || exit -1
done
```

在 `list` 中列出所有要安装的配置文件，执行 `install.sh` 就可以装上自己需要的配置了。

---

[^1]: <http://brandon.invergo.net/news/2012-05-26-using-gnu-stow-to-manage-your-dotfiles.html>
