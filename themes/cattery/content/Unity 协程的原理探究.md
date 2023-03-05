+++
title = "Unity 协程的原理探究"
date = 2021-08-29T21:23:25+08:00
slug = "unity-coroutine"
[taxonomies]
tags = ["game-development"]
+++

## Unity 协程

Unity 基于 c# 的 `yield`  引入了 [Coroutine](https://docs.unity3d.com/2020.1/Documentation/Manual/Coroutines.html)，用于异步编程，用起来非常方便。

`Coroutine` 可以理解为一个能够在 `yield` 处主动暂停执行的函数，等下一帧开始时再继续执行。

假如我们需要逐渐提高一个物体的 alpha 值（不透明度），直到它完全看不见，如果你在 `Update`  方法中调用下面的 `Fade()` ：

```cs
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

试图通过 for 循环逐步降低 alpha 值，但实际达不到渐变的效果。由于 `Update`  方法是每帧调用一次，玩家只能看到在下一帧渲染时 alpha 值立刻变为 0。

### 定义 Coroutine 的方法

当然我们可以改动 `Update`  中的逻辑使它逐帧降低 alpha 值，但通过 `Coroutine`  更加方便。 `Coroutine`  可以看作是一个可以主动暂停执行的函数，并在**下一帧**时从暂停处恢复执行。

```cs
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
- 在 `yield return null`  处暂停执行，并在下一帧时从这里恢复执行

> 带有 `yield` 关键字的方法是一个迭代器方法，原理后文会详细解释

### 启动 Coroutine

通过 `StartCoroutine`  启动 `Coroutine` ：

```cs
void Update()
{
    if (Input.GetKeyDown("f"))
    {
        StartCoroutine(Fade());
    }
}
```

这样就能实现渐隐效果了。

> `StartCoroutine` 属于 `MonoBehaviour` 的方法，也就是说协程是挂在 `MonoBehaviour` 组件上的，对象禁用时协程也会停止。

### 定时任务

`Coroutine`  在 `yeild`  返回之后，会在下一帧恢复执行。实际上 unity 还提供了 `WaitForSeconds`  函数控制 `Coroutine`  两次执行之间的间隔时间：

```cs
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

唯一的不同是 `yield return null`  改成了 `yield return new WaitForSeconds(0.1f)` ，这样 `yield`  返回之后会在 `0.1`  秒之后才恢复执行。
这同样能实现之前的渐隐效果，而且 0.1 秒调用一次而不是每帧调用一次，可以降低引擎的负担。对于一些不需要每帧调用，只需要定时调用的任务来说， `Coroutine`  对性能更加友好。

### 停止 Coroutine

有两种情况下 Coroutine 会停止执行：

1. `StopCoroutine`  和 `StopAllCoroutines` 可以分别用来显式停止指定协程和所有协程。
2. 当 `GameObject`  通过 `SetActive(false)`  被隐藏时，挂在 `GameObject` 上的所有 Coroutine 会自动停止。

协程既可以用字符串开启、停止，也可以直接调用迭代器方法开始、停止。

- **字符串方式**。用字符串开启的协程只能用字符串停止。

```cs
StartCoroutine("Fade"); // 开启 Coroutine
StopCoroutine("Fade"); // 停止 Coroutine
```

- **迭代器方式**。`StartCoroutine` 会返回一个 Coroutine 对象，停止的时候作为参数传给 `StopCoroutine`。

```cs
Coroutine fadeRoutine = StartCoroutine(Fade());
StopCoroutine(fadeRoutine);
```

### 不同的 yield 指令

除了 `yield return null` （等待下一帧再继续执行）和 `WaitForSeconds(s)` （等待 `s` 秒游戏时间后再继续执行）外，unity 还提供了不同的 yield 指令用于实现不同情境下的协程等待操作：

- `yield return null`：等待下一帧继续执行
- `WaitForSeconds(s)`：等待 `s` 秒后再执行，使用的是 scaled time
- `WaitForSecondsRealTime(s)`：等待 `s` 秒真实时间后再执行
- `WaitUntil(Func<bool> predict)`：等待直到 `predict` 返回 `true`
- `WaitWhile(Func<bool> predict)`：等待 `predict` 返回 `false`
- `WaitForEndOfFrame()`：等待这一帧结束时再执行
- `WaitForFixedUpdate()`：等待下一次 `FixedUpdate` 时执行

---

## 迭代器和 foreach

Coroutine 的实现依赖于 c# 中的 `yield` 关键字，要理解 `yield`，必须先理解 c# 中的迭代概念。

一般来说，可以被遍历的集合都需要实现 `IEnumerable` 接口，只要实现了 `IEnumerable`，那么这个集合就可以用 `foreach` 语法遍历了。

```cs
foreach (var item in collection)
{
    DoSomething(item);
}
```

以上是 `foreach` 语句的基本用法，其中被遍历的集合 `collection` 必须是一个 `IEnumerable<T>` 或 `IEnumerable`。

> 只以泛型接口为例，非泛型接口的原理也是一样的。

```cs
public interface IEnumerable<T>
{
    IEnumerator<T> GetEnumerator();
}
```

`IEnumerable<T>` 中最主要的方法就是 `GetEnumerator`，也就是获得这个集合的迭代器，返回类型为 `IEnumerator<T>`。迭代器在所有语言中都是类似的，可以看作是一个指向集合内元素的指针，可以移动。

```cs
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

```cs
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

c# 引入的 [yield](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/yield) 可以大大简化迭代器的编写。

### 迭代器方法

有了 `yield` 的方法就不再是普通的方法，而是一个**迭代器方法**（iterator method），调用的时候只是生成一个迭代器，而不会执行函数体。

```cs
IEnumerator<int> GetEnumerator()
{
    DoSomething("start");
    yield return 0;
    DoSomething("mid");
    yield return 1;
    DoSomething("end");
}
```

调用迭代器方法返回一个 `IEnumerator<int>` 迭代器，内部保存了函数体的执行状态。

> 这里需要特别注意，由于 `GetEnumerator` 是一个迭代器方法，`enumerator = GetEnumerator()` 只是生成了一个迭代器，保存了 GetEnumerator 函数内的状态，而不会执行 GetEnumerator 内的语句，这也是理解迭代器方法的关键点。

每次调用该迭代器的 `MoveNext()` 方法都会继续执行函数，直到遇见 `yield` 语句挂起，下一次调用 `MoveNext()` 时再继续执行。

```cs
// 不会执行函数体，也就是 DoSomething("start") 不会被调用到
var enumerator = GetEnumerator();

// 开始执行方法，直到 yield return
enumerator.MoveNext(); // 会执行以下语句：
                       //   DoSomething("start");
                       //   yield return 0;


// Current 可以取到 yield return 的返回值
int x = enumerator.Current; // x == 0

enumerator.MoveNext(); // 执行以下语句：
                       //   DoSomething("mid");
                       //   yield return 1;

x = enumerator.Current; // 取到 yield 返回值，x = 1

enumerator.MoveNext() // 执行最后一部分语句：
                                          //   DoSomething("end")
                                          // 执行结束，MoveNext() 将返回 false
```

### 返回类型

迭代器方法可以返回的类型有：

- `IEnumerator`
- `IEnumerator<T>`
- `IEnumerable`
- `IEnumerable<T>`
- `IAsyncEnumerable<T>`

最后一个是用于异步迭代器的，暂时不讨论。

返回 `IEnumerable` 的迭代器方法本质上和返回 `IEnumerator` 的是一样的，其 `GetEnumerator()` 会返回相应的迭代器（`IEnumerator`）。

如果返回类型是泛型接口 `IEnumerator<T>` 和 `IEnumerable<T>`，那么必须保证 `yield return` 的返回值可以被隐式转换为 `T` 类型。

---

## 再探 unity 协程

有了之前的基础，协程的基本原理其实也就很简单了：

- `StartCoroutine` 在内部保存了迭代器方法
- 每一帧的特定时机(update 之后)调用协程中迭代器的 `MoveNext()` 推动协程执行
- `MoveNext()` 返回 `false` ，协程结束

基于这些原理，我们甚至可以模拟 unity 写出一个简化版的 Coroutine。

### 生命周期控制

首先需要模拟 Unity 的游戏对象生命周期控制，主要作用只是承载协程的生命周期和验证协程的正确性，所以越简单越好：

- 游戏内对象都继承自基类 GameObject，没有其他组件。相当于所有 GameObject 只有一个 MonoBehaviour 组件。
- GameEngine 控制游戏逻辑
  - 用一个列表保存所有 GameObject
  - 初始化时添加所有 gameobject
  - Run 方法模拟游戏的帧循环，每次循环就是一帧，调用所有 gameobject 的 update 方法

```cs
public class GameEngine
{
    private GameObject[] _gameobjects;
    public class Init(GameObject[] gameobjects)
    {
        _gameobjects = gameobjects;
    }

    public class Run()
    {
        while (true)
        {
            foreach (var obj in _gameobjects)
            {
                obj.Update();
            }
        }
    }
}
```

### 开启协程

Unity 中 `StartCoroutine` 是 `MonoBehaviour` 的一个方法，我们这里对应的就是 `GameObject` 中的方法。

```cs
public class GameObject
{
    public Coroutine StartCoroutine(IEnumerator enumerator);
}
```

> 这里只考虑 `yield return null` 形式的协程，不考虑延时、协程嵌套等。

- 传入一个迭代器方法，需要把这个迭代器保存到 `Coroutine` 句柄中，用于管理协程的继续执行和停止；
- `StartCoroutine` 中应该调用 `enumerator.MoveNext()` 开始执行协程，直到 `yield`；
- 这里只考虑 `yield return null` 类型的协程，就不需要调用 `enumerator.Current` 检查迭代器方法的返回值了；
- 因为 `yield return null` 挂起的协程，放在一个集合里，等到 `Update` 之后再同一处理。

```cs
public class GameObject
{
    public readonly HashSet<Coroutine> Coroutines = new HashSet<Coroutine>();

    public Coroutine StartCoroutine(IEnumerator enumerator)
    {
        Coroutine coroutine = new Coroutine(enumerator);

        if (!enumerator.MoveNext())
            return coroutine;

        Coroutines.Add(coroutine);
        return coroutine;
    }
}
```

### 处理挂起的协程

因 `yield return null` 挂起的协程的处理时机在 `Update` 之后，只需要遍历 `GameObject` 上的协程，执行迭代器的 `MoveNext()` 方法即可。如果协程完成执行（`MoveNext()` 返回 `false`），则将其从 `GameObject` 维护的集合中移除。

```cs
public class GameObject
{
...
    public void YieldNull()
    {
        foreach (var coroutine in Coroutines)
        {
            if (!coroutine.Enumerator.MoveNext())
                Coroutines.Remove(coroutine);
        }
    }
}

public class GameEngine
{
...
    public class Run()
    {
        while (true)
        {
            foreach (var obj in _gameobjects)
            {
                obj.Update();
            }

            // 处理挂起的协程
            foreach (var obj in _gameobjects)
            {
                obj.YieldNull();
            }
        }
    }
}
```

至此就完成了一个极简版的协程，虽然只能支持 `yield return null`，但也可以借此理解协程的内部原理。

---

如果要实现 Unity 那样完整的协程，至少还需要考虑以下因素：

- 不同类型的协程返回值。包括 `WaitForSeconds`、`WaitUntil` 等，这就需要在每次 `enumerator.MoveNext()` 之后用 `enumerator.Current` 检查 `yield` 返回值，根据不同的返回值做不同的处理。
- 不同的协程处理时机。不同类型的协程，其处理时机也应该是不同的，比如 `WaitForEndOfFrame` 显然就应该在帧末处理而不是在 `Update` 之后。
- 协程的嵌套。Unity 可以 `yield return` 另一个协程，就像函数的嵌套调用一样，要实现这一点可能需要使用栈来管理。

---

## References

1. [Coroutines | Unity](https://docs.unity3d.com/2020.1/Documentation/Manual/Coroutines.html)
2. [iterators | C#](https://docs.microsoft.com/en-us/dotnet/csharp/iterators)
3. [yield | C#](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/yield)
