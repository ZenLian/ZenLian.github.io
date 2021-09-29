---
title: "linux 内核之进程管理"
date: 2020-04-16T22:18:04+08:00
slug: "linux-kernel-process-management"
tags: ["linux内核", "进程管理"]
toc: true
---

## 进程描述符

系统中每个进程都由进程描述符 `task_struct` 表示， `task_struct` 这个结构体中包含了描述一个进程所需的所有信息。

![linux-kernel-process-management-1.png](/images/linux-kernel-process-management-1.png)

### 分配进程描述符

- 创建时动态分配（通过 slab 分配器）
- 在进程内核栈的尾端存放 `thread_info` ，其中的 `task` 指针指向进程描述符 `task_struct`
- **`current` 宏如何快速获取当前进程描述符**：可以通过栈指针快速找到 `thread_info` ，从而找到 `task_struct` 。（即 `current` 宏）

![linux-kernel-process-management-2.png](/images/linux-kernel-process-management-2.png)

### 进程状态

- `task_struct` 的 `state` 域描述了进程的五种状态之一：
![linux-kernel-process-management-3.png](/images/linux-kernel-process-management-3.png)

- 内核调用 `set_task_state(task, state)` 将指定进程 `task` 的状态设置为 `state` ；

### 进程上下文

当在**用户空间**执行的进程执行了**系统调用**或**触发某个异常**时，它就陷入**内核空间**执行内核代码，此时内核代表进程执行，处于**进程上下文**。
在进程上下文中， `current` 宏有效。

### 进程链表

- 系统中所有进程描述符都通过 `tasks` 字段链接在进程链表上
- 进程链表的头是 `init_task` ，它是 PID 为 1 的进程

## 进程创建

linux 中进程创建

- 首先调用 `fork()` 从父进程拷贝出子进程。此时子进程与父进程完全相同。
- 然后调用 `exec()` 载入可执行程序。

### 写时拷贝

由于 `fork()` 之后往往调用 `exec()` ， `fork()` 的拷贝工作就白费了。所以 linux 采取写时拷贝， `fork()` 之后子进程与父进程共享资源，只有需要写入时才会拷贝一份给子进程。
`fork()` 的实际开销：

- 复制父进程的页表
- 创建进程描述符

### `fork()` 和 `vfork()`

- 都通过 `clone()` 系统调用实现
- `vfork()` 不拷贝父进程的页表项。即 `vfork()` 子进程在父进程的地址空间运行
- `vfork()` 保证子进程先于父进程执行，父进程被阻塞，直到子进程退出或调用 `exec()` 后，父进程才能恢复运行。

### 线程和进程

- `linux` 中线程就是用进程实现的
- 线程与父进程共享地址空间、文件系统资源、文件描述符和信号处理程序

## 进程终止

进程最终都是调用 `do_exit()` 终结的：

1. 执行一些清理工作，解除进程与所有资源的关联（如果进程是这些资源的唯一使用者，则会释放资源）
1. 给父进程发信号，进程的退出状态设为 `EXIT_ZOMBIE` 。也就是僵尸进程。
1. 调用 `schedule()` 切换到其他进程。 `do_exit()` 永不返回。

### 僵尸进程

进程退出后，其进程描述符仍然存在于系统中，成为僵尸进程。
直到父进程调用 `wait()` 族系统调用（最终调用 `wait4()` 系统调用）获取子进程的退出状态，僵尸进程占用的所有资源才会被完全释放。
僵尸进程占用的所有内存资源：

- 内核栈、 `thread_info` 和 `task_struct` 结构体
