
+++
title = "dbus 编程入门"
date = 2024-07-18T23:01:11+08:00
slug = "dbus-intro"
[taxonomies]
tags = ["蓝牙", "dbus"]
+++

用户是通过 DBus 与 [BlueZ](@/BlueZ%20蓝牙开发框架.md) 进行交互的，在深入 BlueZ 之前必须掌握 DBus 的编程开发方法。DBus 本身是一个消息总线，不同的编程语言中有相应的库实现了与 DBus 的 RPC 通信，比如 C 语言的 gdbus、python 的 python-dbus 等。为了方便，这里使用 python 进行编程示例，掌握了 DBus 的基本概念之后，使用其他语言的库也能很快上手。本文只涉及 DBus，而不涉及 BlueZ。

---

## 前置条件

以 ubuntu 为例，确保安装了以下包：

```shell
$ sudo apt install dbus-python
$ sudo apt install python3-gi
```

## 方法调用

DBus 系统总线上都有一个 hostname 服务，我们用 `gdbus introspect` 查看一下这个服务：

```shell
gdbus introspect --system --dest org.freedesktop.hostname1 --object-path /org/freedesktop/hostname1
```

![org.freedesktop.hostname1](/assets/org.freedesktop.hostname1.png)

可以看到其中有 Hostname 属性。

用 python 读取其中的 Hostname 属性：

- 首先拿到 `org.freedesktop.hostname1` 服务中的 `/org/freedesktop/hostname1` 对象；
- 获取该对象上的 `org.freedesktop.DBus.Properties` 接口；
- 调用 `Properties` 接口中的 `Get` 方法读取属性。`Get` 方法参数中传入接口名和属性名，表示我们要读取 `hostname1` 接口中的 `Hostname` 属性。

```python
#!/usr/bin/python3
import dbus

bus = dbus.SystemBus()
proxy = bus.get_object("org.freedesktop.hostname1", "/org/freedesktop/hostname1")
interface = dbus.Interface(proxy, "org.freedesktop.DBus.Properties")

hostname = interface.Get("org.freedesktop.hostname1", "Hostname")
print("Hostname is ", hostname)
```

## 接收信号

以下代码监听信号：

- 创建 mainloop 事件循环；
- 调用 `add_signal_receiver` 监听信号，监听接口 `com.example` 中的信号 `Greeting`；
- 收到信号时调用 `greeting()` 打印接收的信息。

```python
import dbus
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

def greeting(msg):
    print(msg)

DBusGMainLoop(set_as_default=True)
bus = dbus.SystemBus()
bus.add_signal_receiver(greeting,
        dbus_interface = "com.example",
        signal_name = "Greeting")

loop = GLib.MainLoop()
loop.run()
```

运行上面的 python 代码，然后在另外一个终端向 dbus 发送信号：

```shell
gdbus emit -y -o / -s com.example.Greeting "hello"
```

可以看到运行 python 代码的窗口中 "hello" 被打印出来了，表示我们收到了信号。

## 注册对象

像 BlueZ 等服务都在 DBus 总线上注册了很多对象，提供接口和接口里的方法来给其他应用调用。我们自己也可以向 DBus 注册对象，以此来接收方法调用。

dbus-python 中凡是继承自 `dbus.service.Object` 的对象，都会自动成为 DBus 对象，在 DBus 总线上可以被其他应用和服务访问到。

```python
#!/usr/bin/env python3

import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

class Calculator(dbus.service.Object):
    def __init__(self, bus):
        self.path = "/com/example/counter"
        self.value = 0
        super().__init__(bus, self.path)

    @dbus.service.method("com.example.Counter",
            in_signature="i",
            out_signature="i")
    def Increase(self, a):
        self.value = self.value + a
        if self.value > 10:
	        self.CounterOverflowed(self.value)
        return self.value

	@dbus.service.signal("com.example.Counter"，
		signature="i")
	def CounterOverflowed(self, value):
		print("Counter Overflow: ", value)

DBusGMainLoop(set_as_default=True)
bus = dbus.SystemBus()

calc = Calculator(bus)

loop = GLib.MainLoop()
loop.run()
```

以上代码注册了一个 Calculator 对象：

- 继承自 `dbus.service.Object`。路径为 `/com/example/counter`。
- **方法**用 `@dbus.service.method` 装饰器注册。这里注册了一个 `Increase` 方法，属于 `com.example.Counter` 接口，输入参数类型为 "i"（int32），输出为 "i"（int32）。
- **信号**用 `@dbus.service.signal` 装饰器注册。当 `Counter` 中计数超过 10 时，触发 `CounterOverflowed` 信号。