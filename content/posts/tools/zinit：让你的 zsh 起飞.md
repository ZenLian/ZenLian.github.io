---
title: "zinit：让你的 zsh 起飞"
slug: "zsh-zinit"
date: 2020-02-20T16:20:07+08:00
dropCap: true
toc: true
tags: ["tools"]
---

很多人都是从 [Oh-My-Zsh](https://github.com/ohmyzsh/ohmyzsh) 入坑 zsh 的，包括我自己。Oh-My-Zsh 开箱即用，文档齐全，但加了许多插件后，你会发现 zsh 的启动速度明显变慢了。而使用 [zinit](https://github.com/zdharma/zinit#option-1---automatic-installation-recommended)，你根本感受不到插件加载的过程。不过 zinit 除了官方英文文档，在网上能找到的其他资料寥寥无几。

> zinit 其实不能和 Oh-My-Zsh 进行比较。zinit 只是一个 zsh 插件管理器，而 Oh-My-Zsh 是一个功能齐全的 zsh 框架。如果把 zinit 看作 vim 中的 vim-plug，那 Oh-My-Zsh 就像是 SpaceVim。

## 安装

官方提供了安装脚本，可以直接安装到 `~/.zinit/bin` 中，并自动更新你的 .zshrc 文件：

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/zdharma/zinit/master/doc/install.sh)"
```

如果要安装到其他位置，可以手动 git clone。比如我将 zinit 放在 `~/.config/zsh/zinit/bin/` 中，这不是 zinit 的默认安装位置，根据文档需要在 .zshrc 中设置一下：

```zsh
typeset -A ZINIT=(
    BIN_DIR  $HOME/.config/zsh/zinit/bin
    HOME_DIR $HOME/.config/zsh/zinit
    COMPINIT_OPTS -C
)
```

然后添加：

```zsh
source $HOME/.config/zsh/zinit/bin/zinit.zsh
```

上面的 source 语句需要在 `compinit` 之前。所以最好把 `compinit` 放在最后。

## 加载插件

插件加载方式： `zinit [load|light] <plugin>`

```bash
zinit load zdharma/history-search-multi-word
zinit light zsh-users/zsh-syntax-highlighting
```

两种方式的区别:

- `load` 追踪插件的行为，可以用 `zinit report <plugin>` 查看。 `load` 后可以用 `unload` 卸载插件。
- `light` 可以使插件的加载更快，不能查看报告和卸载。

后面跟着的是插件的 `github` 仓库地址，非 `github` 插件需要替换为完整的 `url` 。

## snippet

`snippet` 可以从给定的 url 直接下载单个文件： `zinit snippet <url>`
常用的 Oh-My-Zsh 和 Prezto 甚至可以直接用 OMZ:: 和 PZT:: 前缀简写，为我们整合其中的插件提供了便利：

```bash
zinit snippet OMZ::plugins/git/git.plugin.zsh
zinit snippet PZT::modules/helper/init.zsh
```

## ice 修饰符

`ice` 修饰符作用于下一条 `zinit` 语句，允许我们指定一些额外的操作。

比如要下载多个文件，可以用 `svn` 修饰符，使用 svn 协议下载整个目录。默认情况下目录中的 `*.plugin.zsh`, `init.zsh`, `*.zsh-theme` 会被 source 进来。

```bash
zinit ice svn
zinit snippet PZT::modules/docker
```

官方 wiki 中解释说因为 ice 易化，所以只会作用于下一条 zinit 指令，然后就马上融化失效了。

## pick""

`pick` 修饰符可以选择需要 source 的文件：

```bash
zinit ice svn pick"init.zsh"
zinit snippet PZT::modules/git
```

这样就只会 source 其中的 init.zsh。

## as"program"

默认情况下，下载的文件会被 source。如果需要下载的是一个可运行的命令，可以使用 `as"program"` 。zinit 会给指定的文件添加可执行权限，并将其目录添加至 PATH 中。

```bash
zinit ice as"program" cp"httpstat.sh -> httpstat" pick"httpstat"
zinit light b4b4r07/httpstat
```

上面这条命令会将插件目录添加至 `PATH` ，拷贝 `httpstat.sh` 到 `httpstat` 并选中 `httpstat` 添加执行权限（ `chmod +x` ）。
除了 `cp` 之外也有 `mv` 修饰符，和命令行中的 `cp` / `mv` 含义一致。

snippets 同样可以使用 as"program" 修饰，用于下载单个可执行文件。

```bash
zinit ice mv"httpstat.sh -> httpstat" pick"httpstat" as"program"
zinit snippet https://github.com/b4b4r07/httpstat/blob/master/httpstat.sh
```

这条命令和上一条的作用是一致的，由于我们只需要 `httpstat.sh` 这个文件，就不需要下载整个 git 仓库，直接用 `snippet` 下载单个文件就行了。snippet 比 load/light 都要快。

## as"completion"

`as"completion"` 作用于 `snippet` 用于下载单个命令补全文件。

```bash
zinit ice as"completion"
zinit snippet https://github.com/docker/cli/blob/master/contrib/completion/zsh/_docker
```

## for 语法

`for` 语法可以同时加载多个插件，并给多个插件提供共同和单独的 `ice` 修饰符。

```bash
zinit as"null" wait"2" lucid from"gh-r" for \
    mv"exa* -> exa" sbin       ogham/exa \
    mv"fd* -> fd" sbin"fd/fd"  @sharkdp/fd \
    sbin"fzf"  junegunn/fzf-bin
```

- 不需要加 `load` ，根据 URL 自动识别是插件还是 snippet
- `light` 加载使用 `light-mode` 修饰
- 如果插件名字前缀与 `ice` 修饰符冲突，需要加 @。如 `sharkdp/fd` 需要写成 `@sharkdp/fd` ，否则会被解析成 `sh"arkdp/fd"` 。

## 延迟加载

zinit 称之为 **Turbo**模式，通过 `wait` 修饰符实现。可以让插件的加载延迟到整个 `.zshrc` 文件已经读取完毕，并且命令提示符已经显示之后。延迟加载那些启动慢的插件，可以大大提升 zsh 的启动速度（虽然 zinit 已经很快了！）。

```bash
zinit ice wait lucid atload'_zsh_autosuggest_start'
zinit light zsh-users/zsh-autosuggestions
```

上面这条命令让 autosuggestions 命令延迟加载。 `wait` 没有参数表示 `zshrc` 读取完毕后立刻（1ms）加载； `lucid` 是静默模式，插件加载完成后不显示提示； `atload` 指定了插件加载之后执行的命令。autosuggetstions  插件使用了 `precmd` hook， `precmd` hook 在每条命令提示符显示前都会执行，由于使用了延迟加载，第一条提示符显示前插件还没有被加载，所以第一条提示符显示时 autosuggestions 不可用。这里使用 `atload` 手动执行一次 `precmd` hook，正好修复了这个问题。

我个人没有使用这个功能，因为 zinit 已经很快了。主题插件可能启动会慢一些，但如果让主题插件延迟加载，会先显示一个简单的命令提示符，然后等主题插件加载完毕了再变为主题插件提供的命令提示符，这样的跳变看起来怪怪的。

## 常用管理命令

### zi

在命令行交互中 `zi` 是 `zinit` 的别名。

### 更新

- 自更新： `zi self-update`
- 更新所有插件： `zi update` ，等价于 `zi update --all`
- 更新特定插件： `zi update <plugin>` ，插件目录名太长了，一般都用 zinit 的补全

### 补全

- 查看已加载的补全：  `zi clist`。对每个插件每行显示 3 个补全，可以用 `zi clist 6` 指定每行显示 6 个补全。
- 清理无用的补全： `zi cclear`

### 清理

- 清理未加载插件： `zi delete --clear`
- 删除所有插件： `zi delete --all`

## 科学上网

用 snippet 下载 OMZ 上的单个文件时会出现连接失败的问题。如果是整个仓库，用的是 `git clone` 一般都不会有什么问题，但用 snippet 下载单个文件会用 `curl` 访问 `raw.githubusercontent.com` ，这个网址常常挂掉。

一个较简单的解决办法是用国内的 gitee 镜像。gitee 上有 OMZ 的官方镜像仓库，对于其他 gitee 上没有镜像的 github 仓库可以用自己的 gitee 账号 fork 一个。

仓库中单个文件的链接后缀是 `raw/<分支名>/<路径>` 。

例如加载 `OMZ::lib/completion.zsh` 这个文件，原本的指令是：

```bash
zinit snippet OMZ::lib/completion.zsh
```

这样可能由于网络的原因下载失败，我们使用 gitee的镜像仓库，地址是 `https://gitee.com/mirrors/oh-my-zsh` ，分支是 `master` ，路径为 `lib/completion.zsh` ，最终的指令为：

```bash
zinit snippet https://gitee.com/mirrors/oh-my-zsh/raw/master/lib/completion.zsh
```

## References

1. <https://github.com/zdharma/zinit>
1. <https://zdharma.org/zinit/wiki>
