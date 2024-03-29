---
title: 搭建git服务器
date: 2019-02-24 17:30:24
slug: "git-server"
dropCap: true
tags:
- git
- tools
---

个人项目放在github上可以很好的进行管理，但考虑到网速问题以及有些团队项目不适合放在github上，这时就需要建立一个git服务器进行代码的备份与集中管理。对git用户的管理有两种方式，一种是为每一个成员创建一个账户，另一种是所有用户都通过git账户与服务器交互。

<!-- more -->

## 创建git账户

``` bash
​sudo adduser git
```

## 禁用shell登录

将`/etc/passwd`文件的`git`用户那一行最后的`/bin/bash`改为`/usr/bin/git-shell`

## 创建证书登录

将需要登录的用户的公钥（即用户的`~/.ssh/id_rsa.pub`文件）导入到git的`/home/git/.ssh/authorized_keys`文件里。

也可采用**git账户+密码**的方式登录，这样需要先设置git账户的密码：

```bash
sudo passwd git
```

## 初始化git仓库

选定一个目录为git仓库，如`/opt/git`

```bash
sudo mkdir /opt/git
```

在`/opt/git`目录下创建一个裸仓库

```bash
sudo git init --bare sample.git
```

记得把owner改为git，否则git用户无法访问

```bash
sudo chown -R git:git /opt/git
```

## 克隆和推送远程仓库

用`git clone`命令克隆远程仓库：

```bash
git clone git@server.ip.addr:/opt/git/sample.git
```

其余的git操作与github无异。

------

## References

1. [搭建Git服务器 - 廖雪峰的官方网站](https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000/00137583770360579bc4b458f044ce7afed3df579123eca000)
2. [Git - Getting Git on a Server](https://git-scm.com/book/en/v2/Git-on-the-Server-Getting-Git-on-a-Server)
