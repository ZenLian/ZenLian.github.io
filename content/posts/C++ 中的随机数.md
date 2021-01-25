---
title: "C++ 中的随机数"
date: 2019-06-03T22:18:04+08:00
slug: "cpp-random"
tags: ["cpp"]
---

## 伪随机数

```cpp
#include <cstdlib>
int rand(void);
```

`rand()` 函数返回一个范围在 `[0, RAND_MAX]` 的伪随机数。这个随机数在每次运行程序时都相同，它是由 `srand()` 函数设定的随机数种子决定的，默认情况下 `srand()` 将随机数种子设为 `1`。可以用时间作为随机数种子，这样每次程序运行时 `rand()` 会产生不同的随机数。

```c
void srand(unsigned int seed);
```

`srand()` 函数设置 `rand()` 函数的随机数种子，默认设为 `1`。

## 真随机数

C++ 中的 `random_device` 可以产生真随机数，定义在头文件 `<random>` 中。

```cpp
#include <random>
std::random_device rd;
for (int i = 0; i < 5; ++i)
    std::cout << rd() << endl;
```

## 随机数引擎和分布（C++11 ）

c++ 11 引入了..随机数引擎..，本质上也是伪随机数，但是同时还提供了随机数分布，用来生成符合各种数学分布的随机数。C++ 中推荐使用随机数引擎而不是 `rand()`。

### 随机数引擎

随机数引擎 `default_random_engine` 是一个函数对象类，定义在 `<random>` 头文件中，每次调用生成一个 `unsigned int` 随机数。

```cpp
default_random_engine e;
for (size_t i = 0; i < 10; ++i) {
    // 调用 e() 来生成下一个无符号随机数
    cout << e() << " ";
}
// 输出：
// 16807 282475249 1622650073 984943658 1144108930 470211272 101027544 1457850878 1458777923 2007237709
```

与 `rand()` 类似，生成的随机数是伪随机数，每次执行程序生成的随机数序列都相同。

可以在构造时指定种子，或用 `seed()` 成员函数指定种子：

```cpp
// 使用默认种子
default_random_engine e1;
// 使用指定种子
default_random_engine e2(12345);
// 使用 seed 指定种子
default_random_engine e3;
e3.seed(12345);
```

上面 e2 和 e3 会生成相同的随机数序列。
> 随机数引擎是有状态的，只要种子相同，每个新构造的随机数引擎生成的序列都相同。要一直生成不同的随机数，必须在同一个随机数引擎上不断调用，而不能每次都构造一个新的随机数引擎。

标准库中定义了许多随机数引擎，生成随机数序列的方式有差异，标准库会指定其中一个作为 `default_random_engine`。一般用 `default_random_engine` 就行了。

### 随机数分布

随机数引擎产生的原始随机数范围和我们需要的随机数范围可能不匹配，这时需要使用随机数分布来将随机数通过指定的分布规律映射到指定的范围。随机数分布定义在 `<algorithm>` 头文件中。

用 `uniform_int_distribution` 配合随机数引擎生成均匀分布随机数的例子：

```cpp
// [0, 9] 闭区间内均匀分布的整数
uniform_int_distribution<unsigned> u(0, 9);
default_random_engine e;
for (size_t i = 0; i < 10; ++i) {
    // 用随机数引擎 e 作为参数调用
    cout << u(e) << " ";
}
// 输出：
// 0 1 7 4 5 2 0 6 6 9
```

除了均匀分布的整数之外，还有很多其他的分布：

```cpp
// [0, 1] 之间均匀分布的浮点数
uniform_real_distribution<double> u1(0, 1);
// 可以使用默认的 double 类型，不用提供模板参数
uniform_real_distribution<> u2(0, 1);
// 均值为 4，标准差为 1.5 的正态分布（默认为 double）
normal_distribution<> n(4, 1.5);
// 50% 的几率返回 true
bernoulli_distribution b1;
// 55% 的几率返回 true
bernoulli_distribution b2(0.55);
```
