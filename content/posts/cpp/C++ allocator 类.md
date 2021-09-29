---
title: "C++ allocator 类"
date: 2019-05-22T22:18:04+08:00
slug: "cpp-allocator-class"
tags: ["cpp"]
---

`new`总是将内存分配和对象构造组合在一起（类似的，`delete`总是将对象析构和内存释放组合在一起）。当分配一大块内存时，我们通常计划在这块内存上按需构造对象，即只有在真正需要时才执行对象创建操作。这时`allocator`类就派上用场了。

c++标准库包含一个allocator类，允许我们将内存的分配和初始化分离。 使用allocator类通常会提供更好的性能和更灵活的内存管理能力。[^1]

..头文件..：`#include <memory>`

## 基本用法

```cpp
// 定义一个可以分配string的allocator对象
 allocator<string> alloc;
 // 调用allocate()分配一块空间，可以存储n个string，此时string尚未初始化
 auto const p =  alloc.allocate(n);
 // 调用construct()构造对象
 auto q = p;
 alloc.construct(q++);           // 第1个string为空
 alloc.construct(q++, 10, 'c'); // 第2个string为"cccccccccc"
 alloc.construct(q++, "hi");    // 第3个string为"hi"
 // 调用destroy()销毁对象
 while(q != p)
     alloc.destroy(--q);
 // 调用deallocate()释放内存
 alloc.deallocate(p, n);
```

## 拷贝和填充未初始化内存

标准库为`allocator`类定义了两个伴随算法，在未初始化内存中创建对象。

```cpp
#include <memory>
 uninitialized_copy(b, e, ub);
 uninitialized_copy_n(b, n, ub);
 uninitialized_fill(ub, ue, t);
 uninitialized_fill_n(ub, n, t);
```

与普通`copy`和`fill`不同的是，这两个算法在目的位置构造元素，所以目的位置迭代器必须指向未构造的内存。

---

[^1]: 《C++ Primer》
