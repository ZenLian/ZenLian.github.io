---
title: "从 iterator_traits 了解类型萃取"
date: 2021-01-22T22:18:04+08:00
---

以前看《Effective C++》时，很多条款都没有仔细看，对类型萃取有点印象，但又说不出个所以然来。最近在看侯捷老师的[《C++STL与泛型编程》](https://www.bilibili.com/video/BV1Hb411K763?t=1156&p=44)视频课程，讲到迭代器 iterator_traits 的作用时，又回过头去看《Effective C++》中的 “条款 47：请使用 traits class 表现类型信息”，才晃然大悟。

## 迭代器类型萃取
类型萃取，就是在**编译期**取得类型相关的信息。 `iterator_traits` 用于迭代器的类型萃取，它是一个模板类，用具体的迭代器作为模板参数传入时，可以返回该迭代器的类型相关信息。


具体来说，STL 中有 5 种迭代器（C++20之前）：

1. **input**：只能读取和向前移动一步。即只支持 `value = *iter`。
1. **output**：只能写入和向前移动一步。即只支持 `*iter = value`。
1. **forward**：只能向前移动一步，每个位置可多次读写。即`iter++`。
1. **bidirectional**：可以向前、向后移动一步。即`iter++`、`iter--`。
1. **random**：支持随机访问，向前、向后移动任意偏移量，即`iter + offset`。



泛型算法使用迭代器时，有些需要根据迭代器的不同类型采取不同的策略。
比如 `std::advance()` 函数可以将迭代器移动相应的距离：
```cpp
template<typename IterT, typename DistT>
void advance(IterT& iter, DistT d);
```
需要根据迭代器的类型执行不同的操作

- 如果是 random 迭代器，则直接使用一次算术运算
- 否则需要执行连续多次自增或自减

这就是使用类型萃取实现的。


## 实现
### iterator_tag
首先，类型萃取定义了 5 种结构体表示 5 种迭代器的类型：
```cpp
struct input_iterator_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag: public input_iterator_tag { };
struct bidirectional_iterator_tag: public forward_iterator_tag {};
struct random_access_iterator_tag: public bidirectional_iterator_tag {};
```


### iterator_category
其次，显式要求每个容器内定义的迭代器必须有一个嵌套定义的 `iterator_category` 类型，来说明自己属于那种类型的迭代器。如 `deque` 的迭代器属于 random 迭代器：
```cpp
template<...> // 省略模板参数
 class deque {
 public:
     class iterator {
     public:
         // 表示自己是一个 random 迭代器
         typedef random_access_iterator_tag iterator_category;
         //...
     };
     //...
 };
```
`list` 的迭代器属于 bidirectional 迭代器：
```cpp
template<...> // 省略模板参数
class list {
public:
    class iterator {
	public:
        // 表示自己是一个 bidirectional 迭代器
        typedef bidirectional_iterator_tag iterator_category;
        //...
    };
    //...
};
```


### iterator_traits
最后，还需要用一个 `iterator_traits` 模板类统一获取迭代器的类型信息，本质是：迭代器说它自己是什么类型，就是什么类型：
```cpp
template<typename IterT>
struct iterator_traits {
    typedef typename IterT::iterator_category iterator_category;
    //...
};
```


泛型算法想要知道迭代器的类型，自己去查迭代器的 `iterator_category` 就行了，为什么还要通过 `iterator_traits` 呢？多此一举吗？


原因在于原生指针没有 `iterator_category` 的定义。由于指针可以看作 random 迭代器，于是可以针对指针类型另外定义一个偏特化版本的：
```cpp
template<typename IterT>
struct iterator_traits<IterT*>
{
    typedef random_access_iterator_tag iterator_category;
}
```


现在用 `iterator_traits<IterT>::iterator_category` 就能知道 `IterT` 所属的迭代器类型了，并且对迭代器和原生指针都适用。`iterator_traits` 就像一个萃取机器，凡是想知道 `IterT` 类型信息的，只要把 `IterT`传给它，它的 `iterator_category` 就能回答你的问题。


实际上 `iterator_traits` 不仅能回答你关于迭代器的所属类型，还能回答你迭代器所指对象的类型等其他类型信息，实现的方式是一样的。


以上就是类型萃取的实现。
## 编译期类型判断
既然可以用 `iterator_traits<IterT>::iterator_category` 得到迭代器的类型，那么 `std::advance` 怎么根据不同的类型执行不同的操作呢？虽然可以使用 if-else 来判断，但是这样会有运行时开销，辛辛苦苦实现的编译期类型萃取就白瞎了。


也就是要解决 `std::advance` 怎么在编译期判断 `iterator_traits` 的类型的问题。
答案是使用**函数重载**。


首先针对不同的迭代器定义 `doAdvance` 不同的重载版本实现：


```
// 针对 random access 迭代器
template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, random_access_iterator_tag)
{
    iter += d;
}
// 针对 bidirectional 迭代器
template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, bidirectional_iterator_tag)
{
    if (d >= 0) { while (d--) ++iter; }
    else { while (d++) --iter; }
}
// 针对 input 迭代器
template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, input_iterator_tag)
{
    if (d < 0) {
        throw std::out_of_range("Negetive distance");
    }
    while (d--) ++iter;
}
// 由于 forward_iterator_tag 继承于 input_iterator_tag，
// advance 的实现也一样
// 不需要给 forward 迭代器再定义一个重载版本
```


`advance` 只需要额外传入一个参数调用 `doAdvance` 即可：


```
template<typename IterT, typename DistT>
void advance(IterT& iter, DistT d)
{
    doAdvance(iter, d,
             iterator_traits<IterT>::iterator_category()
             );
}
```


## 其他类型萃取
除了 `iterator_traits` 之外，标准库中还定义了其他的萃取模板类。如`allocator_traits` 用于萃取分配器的类型相关信息， `char_traits` 用于萃取字符类型等。
另外还有一堆最基本、同时也是最强大的类型萃取定义在 `<type_traits>` 头文件中，这里的类型萃取大多数依赖于编译器的内置功能，比如可以通过 `is_class<T>::value` 判断 `T` 是不是一个类， `is_copy_constructible<T>::value` 判断 `T` 有没有拷贝构造函数， `remove_reference<T>::type` 把 `T` 的引用去掉等等。


`remove_reference<T>` 很简单，也是通过模板特化实现的：
```cpp
// 定义一个泛化版本，返回原本就没有引用的类型
template<typename T> struct remove_reference      {typedef T type;};
// 定义一个左值引用的特化版本，去掉左值引用
template<typename T> struct remove_reference<T&>  {typedef T type;};
// 定义一个通用引用的特化版本，去掉右值引用
template<typename T> struct remove_reference<T&&> {typedef T type;};
```


一些其他的类型萃取就无法通过模板特化实现了，比如如何知道一个类有没有拷贝构造函数？只能依赖于编译器提供的内置功能。


## 总结

- 类型萃取使得类型信息在编译期可用，通过模板和模板特化实现
- 函数重载可以实现编译期类型判断
