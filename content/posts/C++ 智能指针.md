---
title: "C++ 智能指针"
date: 2019-06-12T22:18:04+08:00
slug: cpp-smart-pointer
tags: ["cpp"]
toc: true
dropCap: true
---

智能指针是 C++11 标准库引入的新类型，能够自动释放所指向的对象，避免了手动 `new`/`delete` 造成的内存泄漏。[^1]

有 3 种智能指针：

- shared_ptr
- unique_ptr
- weak_ptr

..头文件..：`#include <memory>`

---

## shared_ptr

多个 `shared_ptr` 可以指向同一块内存，`shared_ptr` 内部保存了一个计数值，记录有多少个 `shared_ptr` 同时指向该内存。当计数值为 0 时，`shared_ptr` 的析构函数默认会调用 delete 销毁该内存。

### make_shared

用`make_shared`申请一块内存，并用`shared_ptr`指向该内存。

```cpp
#include <memory>
...
shared_ptr<string> sp = make_shared<string>("Hello World!");
```

用`auto`关键字更加方便。

```cpp
auto sp = make_shared<string>("Hello World!");
```

### 与 new 结合使用

可以用`new`初始化智能指针：

```cpp
shared_ptr<int> p1(new int(42)); // p1指向值为42的int
```

接收内置指针参数的智能指针构造函数是`explicit`的，因此内置指针不能隐式转换为智能指针，只能直接初始化：

```cpp
shared_ptr<int> p2 = new int(42); // 错误：内置指针不允许隐式转换为智能指针
```

**基本原则：** 不要混用智能指针和内置指针，推荐`make_shared`而不是`new`。

### 删除器

如果智能指针管理的资源不是`new`分配的资源（更确切的说，资源释放不是用`delete`），那么初始化智能指针时可以传递给它一个**删除器**来取代`delete`操作。删除器是一个参数为相应指针类型的可调用对象，释放资源时会调用它以替代`delete`。

```cpp
// 表示目的端的结构体声明
 struct destination;
 // 表示连接的结构体声明
 struct connection;
 // 建立连接
 connection connect(destination *);
 // 断开连接
 void disconnect(connection *);
 // -----
 // 调用逻辑
 void f(destination &d) {
     connection c = connect(&d);
     shared_ptr<connection> p(&c, disconnect);
     // 使用连接
     ...
     // 当f退出时（即使是由于异常退出），disconnect会被调用
 }
```

> 上面这个例子其实用析构函数更合适，这里只是为了说明删除器的用法

---

## unique_ptr

与`shared_ptr`不同，同一时刻只能有一个`unique_ptr`指向一个给定对象。`unique_ptr`拥有它指向的对象。

### 不支持拷贝或赋值

`unique_ptr`不支持`make_shared`，定义时需要将其绑定在`new`返回的指针上。
由于`unique_ptr`拥有它指向的对象，因此不支持拷贝和赋值：

```cpp
unique_ptr<string> p1(new string("Stefania"));
unique_ptr<string> p2(p1); // 错误：unique_ptr不支持拷贝
unique_ptr<string> p3;
p3 = p1; //错误：unique_ptr不支持赋值
```

### release 或 reset 转移所有权

```cpp
// 将u置空，返回指针
u.release();
// 以下都是释放u指向的对象，并将u置空
u = nullptr;
u.reset();
u.reset(nullptr);
// 释放u指向的对象，并将u指向q指向的对象
u.reset(q);
```

使用方法如下：

```cpp
unique_ptr<string> p2(p1.release()); // release将p1置空，并返回指针；然后用该指针初始化p2
unique_ptr<string> p3(new string("Lian"));
// 将所有权从p3转移给p2
p2.reset(p3.release());
```

### 『不拷贝』规则的例外

不能拷贝`unique_ptr`的规则有一个例外：我们可以拷贝或赋值一个将要销毁的 unique_ptr。
比如从函数返回`unique_ptr`：

```cpp
unique_ptr<int> clone(int p)
{
    unique_ptr<int> ret(new int(p));
    return ret;
}
```

> 编译器知道返回的对象即将销毁，实际上执行的是移动，详见《C++ Primer》13.6.2 节。

### 删除器

`unique_ptr` 的指定删除器方式与 `shared_ptr` 不同。初始化 `unique_ptr` 指定删除器时必须在尖括号内指定删除器类型。

```cpp
unique_ptr<connection, decltype(disconnect)*> p(&c, end_connection);
```

---

## weak_ptr

`weak_ptr`指向一个`shared_ptr`管理的对象，但不改变`shared_ptr`的引用计数。
可以用 `lock()` 成员函数返回一个新的 `shared_ptr`，表示提升为强引用。如果`lock()`时对象的引用计数为 0，则返回空的 `shared_ptr`。

---

[^1]: 《C++ Primer》
