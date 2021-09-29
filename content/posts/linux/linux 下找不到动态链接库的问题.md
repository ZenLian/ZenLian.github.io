---
title: linux 下找不到动态链接库的问题
date: 2019-06-16 17:30:24
slug: "linux-linking"
tags:
- "问题记录"
---

## 静态链接库和动态链接库

- 静态链接以 `.a` 为后缀名，通过 gcc 的 `ar` 命令生成
- 动态链接库命名形式为 `libXXX.so`

## 动态链接库的创建

编译时，必须指定为..地址无关代码..（PIC, Position Independent Code）：

```shell
gcc -fPIC -c file1.c
gcc -fPIC -c file2.c
```

链接时，使用`-shared`告诉编译器建立动态链接库：

```shell
gcc -shared libXXX.so file1.o file2.o
```

## 动态链接库的使用

使用`-lXXX`指定动态链接库，如果动态库不在 `/usr/lib` 中，可以通过`-L{path}`指定库文件目录：

```shell
gcc -o main main.c -Llib -lXXX
```

编译器会在指定的 `lib` 文件夹下搜索动态库文件 `libXXX.so` ，如果没有找到，则会搜索静态库文件 `libXXX.a`。

运行时也需要系统指定去哪里找动态库文件，将库文件所在目录加入 `/etc/ld.so.conf.d` 下的一个`.conf`文件即可。

### 一个例子

以 `libuv` 为例，库文件安装在 `/usr/local/lib` 下，可以在 `/etc/ld.so.conf.d` 下新建文件 `libuv.conf`，内容为：

```shell
/usr/local/lib
```

然后执行 `ldconfig` 命令更新链接缓存文件：

```shell
# ldconfig
```

编译链接命令为：

```shell
gcc -o main main.c -luv
```

编译出的main程序就是可执行的。还可以用`ldd`命令查看链接关系：

```shell
ldd main
```
