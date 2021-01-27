---
title: "怎样获取 Ubuntu 下软件源码"
slug: "ubuntu-source"
date: 2019-04-27T14:24:15+08:00
dropCap: false
tags: ["问题记录"]
---

学习 APUE 时自己写了一些系统命令（`ls` 等），想看看 gnu 完善的实现是怎样的。linux 各个发行版的软件包管理器除了安装软件外，都是可以直接下载软件源码的。

我用的是 ubuntu，依赖于 `dpkg-dev`：

```bash
sudo apt install dpkg-dev
```

要下载 `ls` 命令的源码，先查看 `ls` 属于哪个包：

```bash
$ dpkg -S /bin/ls
coreutils: /bin/ls
```

以上命令输出告诉我们，`ls` 属于 `coreutils` 这个包。把 `coreutils` 包源码下载下来：

```bash
sudo apt source coreutils
```

下载的源码会放在当前目录下，所以最好先创建一个目录。
