---
title: "C++ 可变参数模板"
date: 2020-04-12T22:18:04+08:00
slug: "variadic-templates"
tags: ["cpp"]
---

```cpp
template <typename T, typename... Args> // Args: 模板参数包
void foo(const T& t, const Args& ... rest) // rest: 函数参数包
{
    //sizeof... 运算符可以得到参数数量
    sizeof...(Args); // 类型参数数量
    sizeof...(rest); // 函数参数数量
}
```

- **模板参数包**： `Args`
- **函数参数包**： `rest`
- `sizeof...` **运算符**：获取两种包的参数数量

## 可变参数函数模板

实现函数可变参数的方式：

- `initializer_list` 。要求所有实参（可转换）为相同类型。
- 可变参数模板。
  - 实参类型可变
  - 通常用递归实现

### 实现

假设需要编写一个 `print` 函数打印所有对象到一个输出流中，调用形式为：

```cpp
int i = 61;
string s("hello");
print(cout, i, s, 42); // 输出 61 hello 42
print(cout, s, 42); // 输出 hello 42
```

首先需要非可变参数版本用来终止递归：

```cpp
template <typename T>
ostream &print(ostream &os, const T &t)
{
    return os << t;
}
```

可变参数版本递归调用自身：

```cpp
template <typename T, typename... Args>
ostream &print(ostream &os, const T &t, const Args& ... rest)
{
    os << t << ", ";           // 打印第一个实参
    return print(os, rest...); // 递归调用，打印其他实参
}
```

调用 `print(os, rest...)` 时，会将 `rest` 参数包中的第一个传给 `t`，其余传给 `rest...` 。
> `rest...` 中只有一个参数时，会优先匹配前面的非可变参版本（优先匹配特例化版本），从而终止递归。

## 包扩展

`...` 实际上是表示包扩展的符号。
如上的 `print` 模板中， `Args` 是模板参数包， `const Args& ...` 表示将 `const Args&` 应用到 `Args` 的每个元素，如：

```cpp
print(cout, i, s, 42);
// 实例化为：
ostream& print(ostream&, const int&, const string&, const int&);
```

而 `rest` 是函数参数包，上面的调用传给 `rest` 的是实参列表 `s, 42`，则 `rest...` 就扩展为 `s, 42`。
> 假设 `rest` 参数包中包含参数列表 `a1, a2, a3`，则 `rest...` 扩展为 `a1, a2, a3`， `func(rest)...` 还能扩展为 `func(a1), func(a2), func(a3)`

---

## 转发参数包

使用 `std::forward` 将可变参数原封不动地传递给其他函数。

```cpp
template <typename... Args>
void fun(Args&&... args)
{
    // work 的实参既扩展 Args 又扩展 args
    work(std::forward<Args>(args)...);
}
```
