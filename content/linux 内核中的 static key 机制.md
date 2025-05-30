+++
title = "linux 内核中的 static key 机制"
date = 2020-09-15T21:15:09+08:00
slug = "linux-kernel-static-key"
[taxonomies]
tags = ["linux 内核"]
+++

最近在操作系统部门实习，学习了一些 linux 内核追踪和调试的机制。其中 static key 机制是我认为比较精妙的一个，用来优化系统中大量的 `if-else` 判断性能问题。

---

linux 中有一套很强大的内核代码追踪机制，说白了就是在各种重要的内核事件发生的地方（**trace point**）加上一段调试函数，将相关的信息记录下来。比如在切换进程的时候多调用一个 `trace_sched_switch` 函数：

```c
static inline void
prepare_task_switch(struct rq *rq, struct task_struct *prev,
		    struct task_struct *next)
{
    trace_sched_switch(prev, next);
    ...
}
```

这个 trace 功能绝大部分 linux 用户都用不到，只有在进行内核调试时才会用到，所以默认都是关闭的，需要的时候再手动操作 `/sys/kernel/debug/tracing/events` 下的文件打开。

但是即使我们在运行时关闭了 trace，内核运行到这里的时候也会多执行一个无用的 `if` 判断语句。当系统中的追踪点很多的时候，这些空判断对性能的影响是不可忽视的。于是 linux 中引入了 static key 解决这个问题。

## 用法

虽然 static key 最初是为了消除 trace point 的开销而设计的，但它本身是一个独立的机制，其他模块也可以随意使用。

```c
// 定义一个 static key
// - 必须为全局变量
// - 必须初始化为 STATIC_KEY_INIT_FALSE 或 STATIC_KEY_INIT_TRUE
struct static_key key = STATIC_KEY_INIT_FALSE;

// 初始化为 false 时，判断必须使用 static_key_false 包装
if (static_key_false(&key)) {
    // 这是 true 分支，由于 key 初始化为 false，默认不会走该分支
    do_unlikely_branch();
} else {
    // 这个分支是默认走的分支
    do_likely_branch();
}

// key 的值一开始为 0，该函数把 key 的值加 1
// key 从 0 变 1 时，代码路径会更换为 do_unlikely_branch() 分支
static_key_slow_inc(&key);
// 该函数把 key 的值减 1
// key 从 1 变 0 时，代码路径会更换为 do_likely_branch() 分支
static_key_slow_dec(&key);

// 直接将 key 的值置 1
static_key_enable(&key);
// 直接将 key 的值置 0
static_key_disable(&key);
```

## 原理

linux 使用了 static key 的机制来消除 trace point 的运行时开销。其工作原理是：

- 系统初始化时，将所有的用 static key 判断的代码地址保存到一个单独的段 `jump_table` 中
- 打开 static key 时，遍历 `jump_table` 中所有的地址，将此处代码替换为 `jmp` 指令
- 关闭 static key 时，遍历 `jump_table` 中所有的地址，将此处代码替换为 `nop` 指令

由此可见，当我们关闭 static key 后，所有本来需要判断 static key 的地方都是一条 `nop` 指令，尽可能减少了对系统性能的影响。需要注意的是，打开和关闭的操作是很**耗时**的，因为需要遍历所有出现过判断的地方，并进行代码段指令的替换。所以 static key **不适用**于需要频繁开关的场景。

## 实现

具体的实现依赖于不同架构的汇编指令，我模拟 linux 的 API 做了一个简易版本的 [x86 实现](https://github.com/ZenLian/jumplabel) 放在 github 上以供参考。

---

[^1]: [https://www.kernel.org/doc/html/latest/staging/static-keys.html](https://www.kernel.org/doc/html/latest/staging/static-keys.html)