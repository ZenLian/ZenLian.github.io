+++
title = "你真的会用 vim 吗"
date = 2025-05-05T14:13:30+08:00
slug = "vim-tutorial"
draft = false
[taxonomies]
tags = ["tools", "vim"]
+++

在 VSCode 和各种 IDE 大行其道的时代，许多程序员已经没什么机会接触 vim 这个上古时代的终端编辑器了，也难怪“如何退出 vim”能成为 Stack Overflow 上搜索最多的问题之一。

我也不会推荐新手程序员使用 vim，用惯了现代编辑器再去使用 vim 的话，你花在配置上的时间会远大于实际编程的时间，完全本末倒置了。但不可否认的是，vim 的编辑模式确实有它独到之处，即使在现代 IDE 中仍然有不少人习惯使用 vim 键位。

同时我也观察过一些使用 vim 的程序员，发现不少人几乎只会用 `hjkl` 这几个键，说实话这一点儿都不 vim，编辑效率比记事本高不了多少。所以我萌生了写这篇文章的想法，以我自己的使用经验讲讲什么是符合 vim 理念的操作方式。

> 本文只涉及原生 vim 操作，不会涉及 vim 插件和配置。

-----

## Stay in NORMAL mode

初学 vim 需要形成的一个最重要的习惯就是 **Stay in NORMAL mode**。**NORMAL** 模式为什么叫 NORMAL，就是因为正常情况下你都应该处于这个模式下。

对初学者的建议是**永远**不要使用方向键。没错，就是**永远**。坚持这个准则可以帮助你形成良好的 vim 使用习惯，当你在 INSERT 模式下输入了一段代码，想要移动到其他地方输入时，不应该继续在 INSERT 模式下使用方向键移动，而是应该退出到 NORMAL 模式下进行移动。

> PS: 用久了之后，你可能会发现自己频繁在 NORMAL 和 INSERT 模式之间切换，而 `ESC` 键离键盘主区域很远，切换起来不太方便。为了提高效率，有些人喜欢将 `CAPSLOCK` 键映射为 `ESC` 键，还有些人会用插件将 `jj` 映射为 `ESC`。有兴趣可以自己尝试一下，但我还是习惯了不做改动。

## 模式切换

从 NORMAL 模式进入 INSERT 模式实际上有很多种方式，你是不是只会用 `i` 键？

- `i`/`a`：光标前/后插入
- `I`/`A`: 行首/行尾插入
- `o`/`O`：下一行/上一行插入

选择合适的按键能够减少你的击键次数。

## 光标定位

我在文章开头说过，很多人只会用 `hjkl` 移动，这并不是高效的定位方式。为了养成良好的习惯，给初学者的一个建议是：不要多次重复 `hjkl`。甚至有插件能够禁止你多次重复 `hjkl` 按键。

### 搜索是最好的定位

直接用 `/` 和 `?` 搜索，然后用 `n` 和 `N` 在搜索结果中跳转，是我最推崇的定位方式。

为了配合搜索，常用的 vim 配置如下：

```vim
set ignorecase ; 忽略大小写
set smartcase  ; 智能大小写: 存在大写时不忽略大小写
set incsearch  ; 实时显示搜索结果
set hlsearch   ; 高亮搜索结果
set wrapscan   ; n/N 会在搜索结果中循环
```

使用 `n`/`N` 浏览搜索结果时的方向是由当前使用的是 `/` 还是 `?` 决定的，非常的反直觉。如果想让 `n` 键总是向前搜索，`N` 键总是向后搜索，可以参考 [vim-galore](https://github.com/mhinz/vim-galore#saner-behavior-of-n-and-n) 这样配置键位：

```vim
nnoremap <expr> n  'Nn'[v:searchforward]
xnoremap <expr> n  'Nn'[v:searchforward]
onoremap <expr> n  'Nn'[v:searchforward]

nnoremap <expr> N  'nN'[v:searchforward]
xnoremap <expr> N  'nN'[v:searchforward]
onoremap <expr> N  'nN'[v:searchforward]
```

### 跨行定位

跨行定位最方便的方式是使用**相对行号**。

如果你想把光标向下移动 10 行，不应该连按 10 下 `j`，而是应该按 `10j`。为了准确得知需要移动多少行，我喜欢将 vim 的行号配置为**相对行号**：

```vim
set nubmer
set relativenumber
```

如下图所示，当前行是第 22 行，我要移动到目标行（`laststatus = 3` 那行），相对行号是 `13`，我就按下 `13j`。

![relativenumber](/assets/vim_relativenumber.png)

### 行内定位

要在行内定位到某个字符，不应该连续按 `h`/`l`，而应该使用 `f`/`t` 查找，并用 `,`/`;` 在结果中跳转。或者使用 `w`/`e`/`b` 也比 `h`/`l` 会快一些。

此外 `^`/`$` 跳转到行首/行尾，`%` 跳转到匹配的括号，也是比较常用的，但这几个键不太好按，我习惯映射成 `gh`/`gl`/`gm`。

## text objects

text objects 一般都由 `i` 或 `a` 开头（可以理解为 `inner` 和 `around`），后面跟着一个字符表示范围，比如 `ap` 表示一个段落包括两端的空行，`ip` 也表示一个段落但不包括两端的空行。

比如当你想删除一个段落，可以直接按 `dap`。其中 `d` 是删除，`ap` 是一个 text object，表示整个段落（包括两端空行）。

同样的，当你的光标在 `{`/`}` 之间，并且想选中括号内的内容时，可以直接按 `vi}`。其中 `v` 是选择，`i}` 是一个 text object，表示括号中的内容。

内置的 text objects 有：

- `aw`: 一个单词，包括两端空白
- `iw`：一个单词，不包括两端空白
- `ap`：一个段落，包括两端空行
- `ip`：一个段落，不包括两端空行
- `a[`/`a]`/`a(`/`a)`/`a{`/`a}`/`a<`/`a>`：对应的括号内容，包括括号本身
- `i[`/`i]`/`i(`/`i)`/`i{`/`i}`/`i<`/`i>`：对应的括号内容，不包括括号本身
- `a'`/`a"`/<code>a`</code>：对应的引号内容，包括引号本身
- `i'`/`i"`/<code>i`</code>：对应的引号内容，不包括引号本身

有些 vim 插件添加了很多额外的 text objects，比如 Function、Class 等等，这些都不在本文讨论范围之内。

## vim 不需要多光标编辑

[这篇文章](https://medium.com/@schtoeffel/you-don-t-need-more-than-one-cursor-in-vim-2c44117d51db)写得很好，vim 内置的功能实际上比多光标编辑要强大得多，完全不需要类似 sublime text 的多光标编辑功能。

总结一下就是：

1. 用 `/` 搜索你想更改的词，按 `cgn` 更改。按 `n` 跳转到下一个，再按 `.` 重复更改。
2. 用 `Ctrl-V` 更改同一列位置的文字。
3. 用[替换](https://alextheobold.com/posts/no_you_dont_need_multi_cursors/#substitute-command)/[宏录制](https://alextheobold.com/posts/no_you_dont_need_multi_cursors/#macros)处理复杂的多处编辑。

> 以后会补充介绍 vim 强大的替换和宏录制功能。
