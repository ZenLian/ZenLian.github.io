
+++
title = "bluetoothctl 命令行的使用"
date = 2024-07-08T23:09:21+08:00
slug = "bluetoothctl"
[taxonomies]
tags = ["蓝牙"]
+++

[bluez](@/BlueZ%20蓝牙开发框架.md) 的命令行工具 `bluetoothctl` 给用户提供了控制蓝牙设备的接口。在使用 DBus API 进行蓝牙编程开发之前，有必要学习一下命令行的用法，对熟悉蓝牙中的一些重要概念很有帮助。

## 环境准备

环境：

- VMWare 虚拟机
- ubuntu 20.04

首先要在 VMWare 的虚拟机设置里取消”与虚拟机共享蓝牙设备“，否则虚拟机里不能直接管理蓝牙：

![VMWare_bluetooth_setup](/assets/VMWare_bluetooth_setup.png)

然后将蓝牙控制器连接到虚拟机里。

如果虚拟机报驱动程序错误，在 Windows 的设备管理器里先禁用、再启用蓝牙设备。

用 `hcitool dev` 可以查看蓝牙适配器是否已经连接：

```shell
$ hcitool dev
Devices:
        hci0    44:87:63:2B:89:02
```

## 管理蓝牙控制器

输入 `bluetoothctl` 进入蓝牙交互命令行。

```shell
$ bluetoothctl
Agent registerd
[CHG] Controller E4:0D:36:14:22:E1 Pairable:yes
[bluetooth]#
```

`help` 查看所有可用的命令。

首先确认本机的蓝牙控制器是否正常。`list` 列出本机的蓝牙控制器：

```shell
[bluetooth]# list
Controller E4:0D:36:14:22:E1 ubuntu [default]
```

一个控制器用一个唯一的地址表示，如 `E4:0D:36:14:22:E1`。

`show` 查看蓝牙控制器的详细信息：

![bluetoothctl_show](/assets/bluetoothctl_show.png)

如果不止一个控制器，用 `select` 选择一个默认的控制器：

```
[bluetooth]# select E4:0D:36:14:22:E1
```

## 作为蓝牙主机（中心设备）

蓝牙主机是连接的发起方（比如手机），执行扫描、配对、连接等操作。接下来我们用 `bluetoothctl` 执行蓝牙主机相关的操作。

### 扫描

`scan on` 开启扫描，命令行会不断打印出扫描到的蓝牙设备的信息：

![bluetoothctl_scan](/assets/bluetoothctl_scan.png)

其中 `[NEW]` 表示扫描到新的设备，`[CHG]` 表示设备信息发生变化。`bluetoothctl` 自己会维护这些信息的变化，我们只需要用 `devices` 命令查看当前扫描到的设备：

![bluetoothctl_devices](/assets/bluetoothctl_devices.png)

### 设备信息

每个设备有唯一的地址（如 `70:62:FD:9C:77:42`）。`info` 查看指定设备的详细信息：

![bluetoothctl_info](/assets/bluetoothctl_info.png)

### 配对

在设备列表中确定了我们需要配对的设备地址后，直接用 `pair` 就可以完成配对：

![bluetoothctl_pair](/assets/bluetoothctl_pair.png)

配对时可能会要求用户确认，输入 yes。

为了防止以后连接设备时要求服务授权，可以用 `trust` 信任设备：

```
[bluetooth]# trust E0:5B:43:3B:5E:7F
```

### 连接

使用 `connect` 发起与设备的连接：

```
[bluetooth]# connect E0:5B:43:3B:5E:7F
Attempting to connect to E0:5B:43:3B:5E:7F
Connection successful
[R98RGB5.0]#
```

此时进入设备交互命令行，可以看到提示符也变成了设备名 "R98RGB5.0"，表示我们当前连接到的设备。不配对也可以进行连接，但是一些需要加密认证的通信只有配对的设备才能执行。

### 通信

对于传统蓝牙设备，bluetoothctl 只能建立连接，想要完成复杂的通信测试必须自己编写应用程序；而对于 BLE 设备，bluetootctl 提供了 gatt 子命令，可以测试 gatt 属性的读写。

## 作为蓝牙从机（外设）

### 可发现模式

从机要能被主机扫描到，首先要打开可发现模式：

```
[bluetooth]# discoverable on
```

此时打开手机蓝牙，就能扫描到我们的蓝牙设备了。在手机里我们可以看到每个蓝牙设备都有名字和图标，这些可以在 bluez 的配置文件 `/etc/bluetooth/main.conf` 里更改：

```toml
[General]
Name = BlueZ
Class = 0x000100
DiscoverableTimeout = 0
```

- `Name` 表示本机设备名称，手机扫描时显示的就是这个名称；
- `Class` 表示设备类别，决定了显示的图标；
- `DiscoverableTimeout` 非 0 时，会在指定时间（秒）后自动关闭 `discoverable`。

接着等待手机配对、连接，再进行通信。对于传统蓝牙设备，接下来的通信就需要编写应用程序了；对于 BLE 设备，bluetoothctl 还可以通过 gatt 子命令自定义 gatt 服务。

### BLE 广播

BLE 设备可以主动发送广播，将自身的信息广播出去。进入 `advertise` 子菜单设置一些广播属性：

```
[bluetooth]# menu advertise
```

设置 manufacturer（厂家信息）和 name（设备名）：

```
[bluetooth]# manufacturer 0xffff 0x12 0x34
[bluetooth]# name myble
```

这里还可以额外设置 `uuid`、`service`、`data` 等其他需要广播的属性。

设置好之后，退出 `advertise` 菜单，再打开广播：

```
[bluetooth]# back
[bluetooth]# advertise on
```

此时打开手机上的 BLE 蓝牙调试助手，可以看到我们的设备 `myble` 被扫描出来了。连接上之后，也可以看到 `manufacturer` 信息。

### BLE GATT 服务

我们模拟的蓝牙外设没有添加额外的 GATT 服务，在手机上只能看到 Generic Access Service 和 Generic Attribute Service 这两个通用服务。现在我们给这个外设添加一个自定义服务，包含两个特征。

进入 `gatt` 子菜单：

```
[bluetooth]# menu gatt
```

注册服务。这里为了方便，UUID 直接使用 16 位形式。按规范来说自定义 UUID 只能使用 128 位形式。

```
[bluetooth]# register-service 8888
```

提示是否作为 primary service 时，输入 `yes`。

注册一个只读特征：

```
[bluetooth]# register-characteristic 0x1234 read
```

按照提示输入初始值，如 `0x12 0x34`。

再注册一个可写的特征：

```
[bluetooth]# register-characteristic 0x5678 read,write
```

按照提示输入初始值。

至此，我们创建了一个服务（`0x8888`），以及两个特征（`0x1234` 和 `0x5678`）。

最后我们还需要向 BlueZ 注册我们创建的应用服务：

```
[bluetooth]# retister-application
```

现在再次在手机上连接、查看设备，就可以看到我们创建的服务了。并且可以尝试读取 `0x1234` 和写入 `0x5678` 这两个特征值，`bluetoothctl` 中会打印出读写的日志。

---

## References

1. [Creating a BLE Peripheral with BlueZ | Punch Through](https://punchthrough.com/creating-a-ble-peripheral-with-bluez/)