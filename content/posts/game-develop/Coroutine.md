---
title: "Unity 协程的原理探究"
date: 2021-08-29T21:23:25+08:00
slug: "unity-coroutine"
dropCap: false
toc: true
tags: ["游戏开发"]
---

## Unity 协程

Unity 基于 c# 的  `yield` 引入了 `Coroutine`[^1]，用于异步编程，用起来非常方便。

`Coroutine` 可以理解为一个能够在 `yield` 处主动暂停执行的函数，等下一帧开始时再继续执行。

假如我们需要逐渐提高一个物体的 alpha 值（不透明度），直到它完全看不见，如果你在 `Update` 方法中调用下面的 `Fade()` ：

```csharp
void Fade()
{
    for (float ft = 1f; ft >= 0; ft -= 0.1f)
    {
        Color c = renderer.material.color;
        c.a = ft;
        renderer.material.color = c;
    }
}
```

试图通过 for 循环逐步降低 alpha 值，但实际达不到渐变的效果。由于 `Update` 方法是每帧调用一次，玩家只能看到在下一帧渲染时 alpha 值立刻变为 0。

### Coroutine 函数

当然我们可以改动 `Update` 中的逻辑使它逐帧降低 alpha 值，但通过 `Coroutine` 更加方便。 `Coroutine` 可以看作是一个可以主动暂停执行的函数，并在**下一帧**时从暂停处恢复执行。

```csharp
IEnumerator Fade()
{
    for (float ft = 1f; ft >= 0; ft -= 0.1f)
    {
        Color c = renderer.material.color;
        c.a = ft;
        renderer.material.color = c;
        yield return null;
    }
}
```

- 返回类型必须是 `IEnumerator`
- 在 `yield return null` 处暂停执行，并在下一帧时从这里恢复执行

> `IEnumerator` 和 `yield` 的原理后文会详细解释

### 启动 Coroutine

通过 `StartCoroutine` 启动 `Coroutine` ：

```csharp
void Update()
{
    if (Input.GetKeyDown("f"))
    {
        StartCoroutine("Fade");
    }
}
```

这样就能实现渐隐效果了。

### 定时任务

`Coroutine` 在 `yeild` 返回之后，会在下一帧恢复执行。实际上 unity 还提供了 `WaitForSeconds` 函数控制 `Coroutine` 两次执行之间的间隔时间：

```csharp
IEnumerator Fade()
{
    for (float ft = 1f; ft >= 0; ft -= 0.1f)
    {
        Color c = renderer.material.color;
        c.a = ft;
        renderer.material.color = c;
        yield return new WaitForSeconds(0.1f);
    }
}
```

唯一的不同是 `yield return null` 改成了 `yield return new WaitForSeconds(0.1f)` ，这样 `yield` 返回之后会在 `0.1` 秒之后才恢复执行。
这同样能实现之前的渐隐效果，而且 0.1 秒调用一次而不是每帧调用一次，可以降低引擎的负担。对于一些不需要每帧调用，只需要定时调用的任务来说， `Coroutine` 对性能更加友好。

### 停止 Coroutine

有两种情况下 Coroutine 会停止执行：

1. `StopCoroutine` 和 `StopAllCoroutines` 可以分别用来显式停止指定协程和所有协程。
2. 当 `GameObject` 通过 `SetActive(false)` 被隐藏时，挂在 `GameObject` 上的所有 Coroutine 会自动停止。

---

## 迭代器

Coroutine 的实现依赖于 c# 中的 `yield` 关键字，要理解 `yield`，必须先理解 c# 中的迭代概念。

一般来说，可以被遍历的集合都需要实现 `IEnumerable` 接口，只要实现了 `IEnumerable`，那么这个集合就可以用 `foreach` 语法遍历了。

```csharp
for (var item in collection)
{
    DoSomething(item);
}
```

以上是 `foreach` 语句的基本用法，其中被遍历的集合 `collection` 必须是一个 `IEnumerable<T>` 或 `IEnumerable`。

> 只以泛型接口为例，非泛型接口的原理也是一样的。

```csharp
public interface IEnumerable<T>
{
    IEnumerator<T> GetEnumerator();
}
```

`IEnumerable<T>` 中最主要的方法就是 `GetEnumerator`，也就是获得这个集合的迭代器，返回类型为 `IEnumerator<T>`。迭代器在所有语言中都是类似的，可以看作是一个指向集合内元素的指针，可以移动。

```csharp
public interface IEnumerator<T>
{
    bool MoveNext();
    T Current;
}
```

`IEnumerator<T>` 主要有 2 个方法/属性：

- `MoveNext()`：移动至下一个集合元素，不能再移动（遍历结束）时返回 `false`
- `Current`：获得当前指向的元素

有了集合的迭代器，要遍历这个集合，只需要不断调用 `MoveNext()` 移到下一个元素，然后用 `Current` 取出当前元素。

那么最开始的 `foreach` 语句就可以理解为这样：

```csharp
var enumerator = collection.GetEnumerator();
while (enumerator.MoveNext())
{
    var item = enumerator.Current;
    DoSomething(item);
}
```

> 这只是一个 foreach 基本原理的简单示例，实际的实现要考虑异常等其他因素，比这个语句要复杂一些。

---

## yield

c# 引入的 `yield` 可以大大简化迭代器的编写。

有了 `yield` 的方法就不再是普通的方法，而是一个迭代器方法（iterator method），调用的时候只是生成一个迭代器，而不会执行函数体。

```csharp
IEnumerator<int> GetEnumerator()
{
    DoSomething("start");
    yield return 0;
    DoSomething("mid");
    yield return 1;
    DoSomething("end");
}
```

使用迭代器方法：

```csharp
// 不会执行函数体，也就是 DoSomething("start") 不会被调用到
var enumerator = GetEnumerator();

// 开始执行方法，直到 yield return
enumerator.MoveNext();
// DoSomething("start");
// yield return 0;

int x = enumerator.Current;
// x == 0?
```

> 这里需要特别注意，由于 `GetEnumerator` 是一个迭代器方法，`enumerator = GetEnumerator()` 只是生成了一个迭代器，保存了 GetEnumerator 函数内的状态，而不会执行 GetEnumerator 内的语句，这也是理解迭代器方法的关键点。

### 返回值

迭代器方法可以返回：

- `IEnumerator`
- `IEnumerator<T>`
- `IEnumerable`
- `IEnumerable<T>`
- `IAsyncEnumerable<T>`

最后一个是用于异步迭代器的，暂时不讨论。

---

[^1]: <https://docs.unity3d.com/2020.1/Documentation/Manual/Coroutines.html>