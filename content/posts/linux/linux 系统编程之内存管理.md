---
title: "linux 系统编程之内存管理"
date: 2020-03-22T22:18:04+08:00
slug: "linux-program-memory"
tags: ["linux系统编程", "内存管理"]
---

## 虚拟内存

![image.png](/images/linux-program-memory-1.png)

## 动态内存分配

库函数`malloc(3)` 、 `calloc(3)` 、 `realloc(3)` 用于分配， `free(3)` 用于释放。

### 堆内存

对于小内存（小于 128KB）的分配，`malloc(3)` 使用的是堆内存。通过在底层调用 `brk(2)` 和 `sbrk(2)` 管理堆内存大小。

```c
#include <unistd.h>
int brk (void *end);
void * sbrk (intptr_t increment);
```

这两个系统调用仅仅用于调整堆顶位置，至于堆中的内存如何分配给用户，由 `malloc(3)` 库决定。 `brk(2)` 直接设置堆顶位置为 `end` ，而 `sbrk(2)` 将堆顶位置做 `increment` 的偏移，并返回新的堆顶位置。

![image.png](/images/linux-program-memory-2.png)

### 匿名内存映射

`malloc(3)` 在分配大内存块（大于 128KB）时，使用的是匿名内存映射而不是堆内存。
匿名内存映射就是在 `mmap(2)` 调用中指定 `MAP_ANONYMOUS` 标识，将一块初始化为 0 的内存映射到进程地址空间。
> 也可以使用 `/dev/zero` 文件创建文件映射，效果相同

|          | 堆内存分配                                   | 匿名内存映射                                   |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| 效率     | <li>小内存分配效率高<br><li>一般不用陷入内核 | <li>每次调用都需要陷入内核                     |
| 空间利用 | <li>造成内存碎片- 适用于小内存分配           | <li>只能分配页面大小的整数倍- 适用于大内存分配 |

## References

1. 《Linux 系统编程》
2. 《深入理解计算机系统》
