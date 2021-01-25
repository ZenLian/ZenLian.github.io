---
title: "创建型模式 |《Design Patterns in Modern C++》"
date: 2020-03-07T09:31:39+08:00
slug: "creational"
tags:
    - "cpp"
    - "读书笔记"
---

## C++ 中对象创建的方式

即使不用创建型模式，C++ 中的对象创建已经很复杂了

- **栈上对象**。离开作用域时调用析构函数（如果是右值，会在语句结束时立刻调用）。
- **堆上对象**。分配在堆上，用一个原始指针指向。 `Foo* foo = new Foo;` 。
- **3 种智能指针**。

## 函数返回对象的方式

### 返回值

```cpp
struct Foo
{
    Foo(int n); // 构造函数
    Foo(Const Foo&); // 拷贝构造函数
};

Foo make_foo(int n)
{
    return Foo(n);
}
```

拷贝构造函数被调用的次数依赖于编译器，g++ 中根本不会调用。
因为编译器会执行**返回值优化（RVO）**，避免多余的拷贝。

### 返回指针

#### 返回智能指针

返回智能指针过于强制性，用户可能不需要智能指针，或者需要 `shared_ptr` 但是你返回了一个 `unique_ptr`。

#### 返回裸指针

采用 [GSL](https://github.com/microsoft/GSL) 的 `owner<T>` 来表示返回一个所有权交给用户的裸指针。

```cpp
gsl::owner<Foo*> make_foo(int n)
{
    return new Foo(n);
}
```

表示这个指针资源归调用者所有，由调用者负责释放。

顺便看一下 `owner<T>` 的实现：

```cpp
template <class T, class = std::enable_if_t<std::is_pointer<T>::value>>
using owner = T;
```

其实 `owner` 就是 `T` 的别名，其中 `std::enable_if_t<std::is_pointer<T>::value>` 限制了 `T` 只能是指针类型，否则编译时会报错。

`owner<T>` 只是给出一个提醒，表示拥有指针的所有权。
