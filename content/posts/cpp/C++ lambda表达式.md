---
title: "C++ lambda表达式"
date: 2019-05-12T22:18:04+08:00
slug: "cpp-lambda"
tags: ["cpp"]
---

> 《c++ primer》 10.3.2 lambda表达式10.3.3 labmda 捕获和返回

## 格式

```cpp
[capture_list](param_list)->return_type{function_body}
```

- __capture_list 捕获列表__：指明lamda函数体需要捕获的局部变量，..不可省略..
- __param_list 参数列表__：与普通函数的参数列表一致，可省略
- __return_type 返回类型__：尾置返回，可省略
- __function_body 函数体__： ..不可省略..

例如：

```cpp
auto f = []{return 42};
```

是一个最简单的 lambda，省略了参数列表和返回类型，但必须有捕获列表和函数体。
`f` 是一个 lambda 对象，调用 `f()` 返回 `42`。

---

## 要点

### 1. 捕获列表的值传递发生在创建lamda时，而非调用时

```cpp
int v = 42;
auto f = [v]{ return v;};
v = 0;
cout << f() << endl; //输出42，f保存了创建lambda时v的拷贝。
```

### 2. 捕获列表只作用于局部非static变量

lamda可直接调用局部static变量和它所在函数之外的名字，不需要加入捕获列表。

### 3. 隐式捕获[=]或[&]

捕获列表中填=或&，让编译器自动推断捕获列表。
[=]采用值捕获，[&]采用引用捕获。

```cpp
int v = 42;
auto f1 = [=]{ return v;}; //值捕获
auto f2 = [&]{ return v;}; //引用捕获
int v = 0;
cout << f1() << endl; //输出42
cout << f2() << endl; //输出0
```

可以指定特定变量的捕获方式

```cpp
int v = 42, a = 1;
auto f1 = [=, &v]{return a + v;}; // v采用引用捕获，其余采用值捕获
auto f2 = [&, v] {return a + v;};// v采用值捕获，其余采用引用捕获
```

### 4.可变lambda默认情况下，对于值捕获的变量，lambda不允许改变其值

在参数列表后加上mutable关键字可以改变值捕获的变量值，因此可变lambda不能省略参数列表。

```cpp
auto f = [v] () mutable { return ++v;};
```

### 5. lambda返回值

默认情况下，如果函数体包含return语句以外的语句，lambda返回void。要返回其他对象，返回类型不可省略。

```cpp
auto f = [](int i)->int{ if(i < 0) return -i; else return i;};//->int不可省略
```
