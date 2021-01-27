---
title: 怎样无密码使用 sudo 命令
date: 2019-04-22 17:30:24
slug: "sudo-nopassword"
dropCap: true
tags:
- 问题记录
---

每次使用 sudo 都要输密码，在 wsl 这种个人使用的 linux 中，不需要考虑安全性问题，把这个烦人的步骤去掉会省事的多（不过时间长了可能会忘记密码哦！）

## 1. 临时方法

```bash
sudo -s
```

开启一个新的 shell，这个 shell 中可以不需要 sudo 执行所有命令。
这种方法是临时的，退出 shell 后失效。

## 2. 永久方法

通过 `visudo` 命令，这个命令会用默认编辑器打开 `/etc/sudoers` 文件让你修改。当然这个命令本身需要 sudo 权限。

在打开的 sudoers 文件中添加一行：

```bash
username ALL=(ALL)NOPASSWD:ALL
```

其中 username 是你的用户名。

..注意..：
不要用 vim 直接打开 sudoers 文件修改，而是应该始终使用 `visudo` 命令，因为 `visudo` 会帮我们进行语法检查，防止改错了 sudoers 文件造成用户无法获取 sudo 权限。
就算要修改，也最好在 `/etc/sudoers.d` 目录中新建一个文件，而不是直接修改 sudoers 文件

如果 sudoers 文件被改错了怎么办？没有设置 root 账户密码的话，只有[从 grub 进入单用户模式](https://askubuntu.com/questions/132965/ow-do-i-boot-into-single-user-mode-from-grub)，选择 root 登录把 sudoers 改回来了。
