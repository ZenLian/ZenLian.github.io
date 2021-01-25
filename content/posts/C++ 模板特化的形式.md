---
title: "C++ 模板特化的形式"
date: 2020-04-03T22:18:04+08:00
slug: cpp-template-specialization
tags: ["cpp"]
---

模板分为 ..函数模板.. 和 ..类模板..，特化分为 ..全特化.. 和 ..偏特化..。

1. 模板特化的本质是我们帮编译器作了更精确的类型推导，如果特化的版本更合适，就会匹配特化的版本。
2. ..全特化.. 本质是模板的一个实例，..偏特化.. 本质上还是模板，是原模板的一个子集。
3. 函数模板只有全特化，没有偏特化。函数模板偏特化可以通过重载实现。
4. 类模板的偏特化有以下 ..三种形式.. ：

```cpp
template<class T1, class T2>      // 普通版本，有两个模板参数
class B { ..... };

template<class T2>　　　         // 偏特化版本，指定其中一个参数，即指定了部分类型
class B<int , T2> { ..... };　　// 当实例化时的第一个参数为int 则会优先调用这个版本
```

```cpp
template<class T>     // 普通版本
class B { ..... };

template<class T>　　　//这个偏特化版本只接收指针类型的模板实参
class B<T*> { ..... };

template<class T>
class B<T&> { ..... };     // 这个偏特化版本只接受引用类型的模板实参
```

```cpp
template<class T>    //普通版本
class B { ..... };

template<class T>　　　// 这种只接受用T实例化的vector的模板实参．也是一种偏特化
class B<vector<T>> { ......  };
```
