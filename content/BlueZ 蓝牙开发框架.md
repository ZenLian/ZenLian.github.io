+++
title = "BlueZ 蓝牙开发框架"
date = 2024-07-02T23:33:42+08:00
slug = "bluez"
# draft = true
[taxonomies]
tags = ["蓝牙"]
+++

## BlueZ

Linux 上的蓝牙开发借助于 BlueZ 开源框架。

BlueZ 架构如下图：

- BlueZ 实现了蓝牙协议栈中的 Host 部分。
- 应用与 BlueZ 之间通过 **D-Bus** 进行通信。
- BlueZ 与控制器（Controller，即蓝牙芯片）之间通过 HCI 接口通信。Controller 在 BlueZ 中也被称为 Adapter。

![BlueZ_Architecture.png](/assets/BlueZ_Architecture.png)

## D-Bus

D-Bus 是一个通用的进程间通信中心，只要连接到同一个 D-Bus 总线上的进程都能相互发送消息。BlueZ 从 5.52 开始只使用 D-Bus 作为应用接口，抛弃了传统的 API 接口。

D-Bus 有两种类型的总线：

- **系统总线**。全局唯一的总线，一般的系统服务（如 BlueZ）都连接到系统总线上。
- **会话总线**。每个登录会话都会生成一个会话总线。

![DBus_Connection.pn](/assets/DBus_Connection.png)

### D-Bus 连接

BlueZ 的 bluetoothd 守护进程连接到系统总线上，作为**服务端**。我们编写的应用进程也连接到系统总线上，作为**客户端**调用 BlueZ 提供的接口。

每当一个进程连接到总线上时，D-Bus 会给进程分配一个唯一的名字，以 `:` 开头（如 `:1.16`）。但是知名的服务都会另外注册一个别名，方便应用访问。比如 bluetoothd 的名字为 `org.bluez`。

### D-Bus 面向对象概念

D-Bus 使用了类似面向对象的设计。

每个连接到总线上的服务，都包含了一些**对象**。对象用路径形式表示，有层级关系，比如 `/org/bluez/hci0` 表示一个蓝牙适配器对象，`/org/bluez/hci0/dev_4C_D7_64_CD_22_0A` 表示 hci0 下的一个蓝牙设备。

对象会实现一些**接口**，接口中定义了**方法**、**信号**和**属性**。接口用域名形式表示，如 `org.freedesktop.DBus.Introspectable`、`org.bluez.GattManager1`。

- **方法**可以被其他应用通过 D-Bus 调用。
- 对象在发生某些事件时会触发**信号**，任何注册过这个信号的应用都会收到通知。
- 对象还包含**属性**。应用可以访问和修改属性。

我们可以用 `gdbus introspect` 命令查看指定对象上包含的接口，比如：

```shell
gdbus introspect -y -d "org.bluez" -o "/org/bluez/hci0"
```

该命令告诉 D-Bus 我们要查看系统总线（`-y`）上的服务 bluez（`-d "org.bluez"`）中的对象 `"/org/bluez/hci0"`。这个对象表示的是蓝牙控制器。该命令将列出这个对象上的所有接口，包括接口中的方法、信号和属性，输出如下：

![dbus_introspect.png](/assets/dbus_introspect.png)

### D-Bus 标准接口

DBus 定义了一些标准接口，基本上所有服务（包括 BlueZ）都会实现这些接口。

#### org.freedesktop.DBus.Properties

Properties 是最常用的接口，其他接口中的属性实际上都是通过该接口中的 `Get`/`Set`/`GetAll` 方法进行读写的。该接口还包括一个 `PropertiesChanged` 信号，当同一个对象上其他接口中的属性发生变化时，会触发这个信号通知使用者。

几乎所有对象上都会实现这个接口，比如 bluez 的 `/org/bluez` 对象：

```shell
gdbus introspect -y system -d org.bluez -o /org/bluez
```

![DBus_Properties](/assets/DBus_Properties.png)

#### org.freedesktop.DBus.ObjectManager

ObjectManager 接口用于管理对象。比如在 BlueZ 中，可以用 ObjectManager 来管理所有扫描到的蓝牙设备。调用 `GetManagedObjects()` 方法并从中筛选出所有蓝牙设备，并且每当扫描到一个新的设备，`InterfacesAdded` 信号就会触发。

![DBus_ObjectManager](/assets/DBus_ObjectManager.png)

### D-Bus 数据类型

正如上面使用 `gdbus introspect` 观察到的接口信息中，我们可以看到 DBus 方法和信号的参数、属性都使用一些特殊的标识（比如 `o`、`as`、`a{sa{sv}}` 等）来表示该变量的数据类型。类型系统的详细描述参考 [D-Bus Specification](https://dbus.freedesktop.org/doc/dbus-specification.html#type-system)，这里进行简单介绍。

#### 基础类型

基础类型包括**数值类型**和**字符串类型**。

数值类型：

- `y` uint8
- `b` **Boolean**
- `n` int16
- `q` uint16
- `i` **int32**
- `u` uint32
- `x` int64
- `t` uint64
- `d` double
- `h` handle，Unix 系统上的文件描述符类型

字符串类型：

- `s` **String** 字符串
- `o` 表示一个 DBus **对象路径**（如 `/org/bluez/hci0`）
- `g` Signature，类型标识形式

#### 容器类型

容器类型有 4 种：STRUCT、ARRAY、AVRIANT 和 DICT_ENTRY。

STRUCT 类型用 `()` 表示，可以嵌套：

- `(ii)` 表示包含 2 个 int32 的结构体
- `(s(ii))`

ARRAY 以 `a` 开头，后面跟着列表中元素类型：

- `as` 表示一个列表，列表元素为 String
- `a(ii)` 表示列表元素为结构体 `(ii)`

VARIANT 表示**可变类型**。

DICT_ENTRY 是一个 key-value 类型，类比于 C++ 中的 `std::pair`，用 `{}` 表示。编程语言中常见的字典，可以用 ARRAY 和 DICT_ENTRY 组合在一起表示：

- `a{sv}` 表示了一个字典。字典的 key 是 String，value 是可变类型。

## D-Bus 工具

调试 D-Bus 时可以借助一些命令行工具，包括 dbus-monitor、dbus-send、gdbus 等。

### dbus-monitor

dbus-monitor 可以监听 DBus 总线上的所有的信号和方法调用。

监听系统总线：

```shell
sudo dbus-monitor --system
```

只监听信号：

```shell
sudo dbus-monitor --system 'type=signal'
```

只监听指定路径：

```shell
sudo dbus-monitor --system 'path=/com/example'
```

### dbus-send

dbus-send 可以手动向 DBus 总线发送消息，包括触发信号、调用其他服务的方法等。

在另一个窗口试着向 DBus **发送信号**：

```shell
dbus-send --system --type=signal /com/example com.example.Greeting string:"hello!"
```

该命令在系统总线上触发了一个信号，发送信号的对象是 `/com/example`，接口是 `com.example`，信号名为 `Greeting`，参数为字符串 `"hello!"`。在 dbus-monitor 的监听窗口下就能看到信号被触发的打印。

dbus-send 也可以用来进行**方法调用**。以 BlueZ 为例，我们如果想得到蓝牙适配器的地址，可以读取 `/org/bluez/hci0` 对象中 `org.bluez.Adapter1` 接口中的 `Address` 属性，前文介绍过，属性的读取都是通过 `org.freedesktop.DBus.Properties` 接口进行的，实际命令如下：

```shell
dbus-send --system --type=method_call --print-reply --dest=org.bluez /org/bluez/hci0 org.freedesktoop.DBus.Properties.Get string:"org.bluez.Adapter1" string:"Address"
```

输出会返回 `Address` 属性值，类似于：

```shell
  variant     string "44:87:63:2B:89:02"
```

### gdbus

gdbus 是 GLib 封装的一套 dbus 命令行工具，比原生的 dbus-* 命令更简单易用。

比如用 `gdbus introspect` 命令可以查看某个对象中包含的接口：

```shell
gdbus introspect -y -d "org.bluez" -o "/org/bluez/hci0"
```

该命令告诉 D-Bus 我们要查看系统总线（`-y`）上的服务 bluez（`-d "org.bluez"`）中的对象 `"/org/bluez/hci0"`。这个对象表示的是蓝牙控制器。

`gdbus` 同样可以实现 `dbus-*` 系列命令的功能。比如用 `gdbus monitor` 监听 bluez 服务：

```shell
gdbus monitor -y -d org.bluez
```

用 `gdbus emit` 发送信号：

```shell
gdbus emit -y -o /com/example -s com.example.Greeting "hello!"
```

用 `gdbus call` 调用方法：

```shell
gdbus call -y -d org.bluez -o /org/bluez/hci0 -m org.freedesktoop.DBus.Properties.Get "org.bluez.Adapter1" "Address"
```

---

## References

1. [D-Bus Specification (dbus.freedesktop.org)](https://dbus.freedesktop.org/doc/dbus-specification.html)