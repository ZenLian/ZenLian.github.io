---
title: "linux 系统编程之进程管理"
date: 2020-03-18T22:18:04+08:00
slug: "linux-program-process"
tags: ["linux系统编程", "进程管理"]
toc: true
---

## pid

每个进程都有唯一的 pid。

### pid 最大值

通过 `/proc/sys/kernel/pid_max` 可以查看和设置 `pid` 的最大值。这个值决定了系统可以同时运行的进程数量，缺省为 `32768` 。

### 分配 pid

pid 的分配是严格线性增长的。
如果前一次分配的 pid 为 17，而 pid 为 17 的那个进程已经终止了，那么下一次分配的 pid 还是 18 而不是重复使用 17。即从前一次分配的 pid 开始一直向上寻找未分配的 pid，到达最大值再绕回来找。
这样的策略保证了短时间内 pid 的唯一性。

## 进程体系

除了 `init` 进程之外，linux 系统中每个进程都是由其他进程创建的，相互之间分别称为父进程和子进程。
`init` 进程是系统的第一个进程，PID 为 1，所有进程都是由它直接或间接创建的。
系统中的所有进程形成一颗以 `init` 进程为根节点的进程树。

## 运行新进程

### `exec()` 系列系统调用

`exec()` 系列系统调用将二进制文件程序载入当前进程的地址空间，替换当前正在执行的程序。
实际上没有一个调用叫做 `exec()` ，它指的是一系列相同功能的函数：

```c
#include <unistd.h>

extern char **environ;

int execl(const char *path, const char *arg, ...
          /* (char  *) NULL */);
int execlp(const char *file, const char *arg, ...
           /* (char  *) NULL */);
int execle(const char *path, const char *arg, ...
           /*, (char *) NULL, char * const envp[] */);
int execv(const char *path, char *const argv[]);
int execvp(const char *file, char *const argv[]);
int execvpe(const char *file, char *const argv[],
            char *const envp[]);
int execve(const char *filename, char *const argv[],
           char *const envp[]);
```

`exec()` 族所有其他的函数都是 `execve()` 的封装。
助记：

- `l` 和 `v` 不会同时出现
  - `l` ：参数以可变参数列表方式提供
  - `v` ：参数以数组方式提供
- `p` ：在当前 PATH 环境变量中搜索可执行文件。意味着第一个参数可以只传入文件名而不需要以 `/` 开始的完整路径。
- `e` ：给新进程提供新的环境变量。否则使用当前环境变量 `environ` 。

除非出错， `exec()` 不会返回，而是直接跳转到新程序开始执行。

举个例子：

```c
execl(("/bin/vi", "vi","/home/my/testfile", NULL);
```

就相当于我们直接在 `shell`  中执行 `vi /home/my/testfile` 。

### `fork()` 系统调用

`fork()` 系统调用从当前进程派生出一个同样的子进程，几乎就是把当前进程复制一份。

```c
#include <sys/types.h>
#include <unistd.h>
pid_t fork(void);
```

因为 `fork()` 之后产生了一个新的子进程，所以 `fork()` 系统调用会返回 2 次：

- 父进程返回子进程的 `pid`
- 子进程返回 `0`

调用出错返回 `-1` 。

典型用法如下：

```c
pid_t pid;
pid = fork();
if (pid == 0) {
    // 子进程执行代码
} else if (pid > 0) {
    // 父进程执行代码
} else {
    // 调用出错
    perror("fork");
}
```

#### 写时复制

一般 `fork()` 后子进程会立刻执行 `exec()` ， `fork()` 复制父进程的操作就白费了。于是 linux 实现了**写时复制**机制， `fork()` 之后父子进程共享地址空间，直到有写入发生再执行复制。

### `vfork()` 系统调用

`vfork()` 是为了优化 `fork()` 之后立刻执行 `exec()` 操作所造成的浪费专门设计的。
`vfork()` 执行成功之后，子进程直接在父进程的地址空间运行，父进程挂起，直到子进程调用 `exec()` 或 `_exit()` 退出。子进程不能在父进程的地址空间写入。
`vfork()` 是历史遗留产物，linux2.2 之前都是直接用 `fork()`

## 终止进程

终止一个进程有以下几种方式：

**1. 正常终止**
用户程序可以通过调用C库函数 `exit(3)` 来终止当前进程。

```c
#include <stdlib.h>
void exit (int status);
```

其中 `status` 参数用来标志进程退出状态。

- `exit(3)` 执行用户空间的清理工作：
  - 逆序调用 `atexit()` 或 `on_exit()` 注册的函数
  - 清空所有已打开的标准 IO 流
  - 删除由 `tmpfile()` 创建的所有临时文件
- `exit(3)` 完成用户空间清理后，最终调用 `_exit(2)` 系统调用交由内核清理。
- 即使不显式调用 `exit(3)` ，C 编译器也会在 `main()` 函数返回后调用 `_exit(2)` ， `main()` 函数的返回值作为 `_exit(2)` 的参数。

**2. 信号**
进程收到一个信号，而信号的缺省处理函数是终止进程。比如 `SIGTERM` 和 `SIGKILL` 。

**3. 内核强制终止**
执行非法指令、引起段错误、或内存耗尽的进程，都会被内核强制终止。**

### atexit(3) 和 on_exit(3)

这两个函数用来注册进程结束时要调用的函数，调用顺序与注册顺序相反。

```c
#include <stdlib.h>

int atexit(void (*function)(void));
int on_exit(void (*function)(int , void *), void *arg);
```

- 只有正常终止（ `exit(3)` 或从 `main()` 中返回）才会调用注册的函数
- `atexit(3)` 只能注册无参函数； `on_exit(3)` 注册的函数有 2 个参数，第 1 个是进程退出状态，第 2 个是传给 `on_exit(3)` 的第 2 个参数 `arg` 。

### SIGCHLD 信号

- 当一个子进程终止时，内核会向其父进程发送 `SIGCHLD` 信号
- 父进程的缺省处理策略是忽略该信号

### 等待终止的子进程

#### 僵死进程

- 子进程终止后，会变为**僵死（zombie）进程。**如果父进程没有调用 `wait()` 系列函数，子进程就会一直保持僵死状态。
- 如果父进程先于子进程结束，它的所有子进程会成为 `init` 进程的子进程。`init` 进程会周期性地等待所有子进程，确保它的子进程不会一直保存僵死状态

**如何避免僵死进程？**

- **父进程安装 `SIGCHLD` 信号**。为了确保父进程及时回收终止的子进程，可以给父进程安装 `SIGCHLD` 信号，在信号处理程序里调用 `waitpid()` 。
- **让 `init` 进程回收**。这可以通过**两次 `fork()`** 实现：父进程调用 `fork()` 创建子进程然后 `waitpid()` 等待子进程退出，子进程再调用 `fork()` 创建孙进程然后退出，在孙进程中执行具体任务。这样父进程已经回收了子进程，继续执行，而孙进程会成为 `init` 进程的子进程，由 `init` 进程负责回收。

#### wait 系列函数

wait 系列函数是父进程用来等待子进程终止的。只有被父进程调用 wait 的子进程才会从僵死状态消失。

##### wait(2)

`wait(2)` 是父进程用来获取已终止的子进程信息的最简单方法。字面理解就是等待一个子进程终止。

```c
#include <sys/types.h>
#include <sys/wait.h>
pid_t wait (int *status);
```

- `wait(2)` 返回已终止子进程的 `pid`
- 如果`status` 非 `NULL` ，会返回关于子进程如何终止的附加信息。具体值可以用 `int WIFEXITED (status);` 等宏解释，详见 man 手册。
- 如果没有已终止的子进程， `wait(2)` 调用将阻塞直到有子进程终止

##### waitpid(2)

`waitpid(2)` 可以等待特定的子进程，更加强大。

```c
#include <sys/types.h>
#include <sys/wait.h>
pid_t waitpid (pid_t pid, int *status, int options);
```

`pid` 参数用于指定要等待的进程：

- `<-1` ：等待进程组 `|pid|` 中的所有进程
- `-1` ：等待任一子进程，与 `wait(3)` 相同
- `0` ：等待同一进程组内的任一进程
- `>0` ：等待 `pid` 等于传入值的进程

`options` 参数采用按位或的方式：

- `WNOHANG` ：指定非阻塞等待。如果要等待的进程中没有已终止进程， `waitpid(3)` 立即返回 `0` 。

##### waitid(2)

`waitid(2)` 提供了更多等待子进程的方式，也更复杂。

## 用户和组

用户 id 和组 id 分别用 `uid_t` 和 `gid_t` 类型表示。
每个进程都有各自的用户 id 和组 id，代表了进程的执行权限。
与一个进程相关的有 4 个用户（组）id ：

1. **实际用户 ID**。运行这个进程的用户的 uid。
1. **有效用户 ID**。当前进程使用的用户 ID。权限检查使用的就是这个用户 ID。
1. **保存设置的用户 ID**。进程原先的有效用户 ID。
1. **文件系统用户 ID**

## 会话和进程组

- 用户每次登录都会产生一个会话，登录 `shell` 作为会话的首进程，它的 `pid` 作为会话 ID（ `sid` ）。
- 会话囊括了登录用户的所有活动，并且分配一个控制终端
- 我们在 `shell` 中输入管道命令时，就会产生一个进程组
- 一个会话中只能有一个前台进程组，多个后台进程组（ `shell` 中以 `&` 结尾的命令）

![image.png](/images/linux-program-process-1.png)

## 守护进程

运行在后台的进程，执行系统级任务。
两点基本要求：

- 必须是`init` 进程的子进程
- 不与任何控制终端相关联

## References

1. 《Linux 系统编程》
