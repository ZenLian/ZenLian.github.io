
+++
title = "linux 设备驱动模型"
date = 2023-10-11T22:12:10+08:00
slug = "linux-bus-driver-device"
[taxonomies]
tags = ["linux 驱动"]
+++

linux 的设备总线模型核心层主要由 3 个结构组成，分别是**总线**、**设备**和**驱动**。

- **总线**（`struct bus_type`）进行设备和驱动的匹配。设备和驱动都挂在总线上，每添加一个设备或驱动，总线就会尝试进行一次匹配。
- **设备**（`struct device`）是每一个实际设备的底层结构，任何设备最终都对应着一个 `struct device` 结构体。设备间有父子层级关系，所有设备将组成一个树状结构。
- **驱动**（`struct device_driver`）负责对设备的实际操作。

相关源文件：

```
/
|- include/linux/device.h
|- drivers/base/
  |- base.h
  |- core.c    # device 相关
  |- driver.c  # driver 相关
  |- dd.c      # driver 与 device 交互相关
  |- bus.c     # bus 总线层
```

## bus

### 定义总线

内核中使用 `struct bus_type` 结构表示一种总线类型。每一种总线都会**静态**定义一个 `bus_type`：

```c
struct bus_type pci_bus_type {
	.name = "pci", // 必须
	.match = pci_bus_match, // 可选
};
```

其中：

- `name` 字段是必须的。
- `match` 字段是可选的，用于驱动与设备匹配的函数，匹配则返回 1。

这个静态定义的 `bus_type` 必须在头文件里导出，以供其他驱动模块使用：

```c
extern struct bus_type pci_bus_type;
```

### 注册总线

有了总线类型之后，相应的总线驱动层调用 `bus_register()` 向内核注册总线：

```c
int bus_register(struct bus_type * bus);
```

### 设备和驱动列表

总线上持有 2 个列表：**设备列表**和**驱动列表**，分别保存属于该总线的所有设备（`struct device`）和驱动（`struct driver`）。当调用 `device_register()` 添加设备时，设备被插入设备列表中；当调用 `driver_register()` 添加驱动时，驱动被插入驱动列表中。

驱动核心层提供了以下方法遍历总线上的设备和驱动：

```c
int bus_for_each_dev(
	struct bus_type * bus,
	struct device * start,
	void * data,
	int (*fn)(struct device *, void *));

int bus_for_each_drv(
	struct bus_type * bus,
	struct device_driver * start,
	void * data,
	int (*fn)(struct device_driver *, void *));
```

### 驱动匹配

添加设备和添加驱动都会触发**驱动匹配**，一个设备只能匹配一个驱动，但同一个驱动可以匹配多个设备。

**添加设备**时，总线遍历驱动列表里的驱动，并调用总线的 `match()` 方法尝试匹配驱动。`match()` 方法由总线定义，一般来说是对比设备的 ID 和驱动支持的 ID，返回 1 表示匹配成功。`match()` 原型如下：

```c
int match(struct device * dev, struct device_driver * drv);
```

匹配成功之后，设备和驱动相互绑定：设备的 `driver` 字段指向驱动，驱动的设备列表中添加该设备。然后驱动的 `probe()` 方法会在此时调用。

**添加驱动**时的流程也类似，总线遍历设备列表里的设备，尝试和驱动相匹配。因为同一个驱动可以匹配多个设备，所以还没有驱动的所有设备都要被遍历一遍。

## device

`struct device` 结构是 linux 中最底层的设备结构，任何设备最终都对应着一个 `struct device` 结构体，包括所有的字符设备、块设备等。

实际设备驱动一般不会调用这些底层的接口，而是由更上层的设备模型进一步封装调用。比如 pci 设备，将 `struct device` 嵌入自已的结构体中：

```c
struct pci_dev {
	...
	struct device dev;
	...
};
```

### 注册设备

驱动框架中向内核注册设备的接口是：

```c
int device_register(struct device* dev);
```

以注册 PCI 设备为例：

```c
int pci_register(struct pci_dev *pdev)
{
	err = device_register(&pdev->dev);
}
```

## driver

`struct device_driver` 是内核中最底层的驱动结构。一个典型的驱动结构为：

```c
static struct device_driver eepro100_driver = {
       .name		= "eepro100",
       .bus		= &pci_bus_type,

       .probe		= eepro100_probe,
       .remove		= eepro100_remove,
       .suspend		= eepro100_suspend,
       .resume		= eepro100_resume,
};
```

其中：

- `name` 驱动名称，会在 sysfs 中显示
- `bus` 表示该驱动所挂载的总线。
- `probe`/`remove` 是驱动的回调函数，在驱动与设备绑定/解绑时调用。
- `suspend`/`resume` 是电源管理回调函数，在设备进入/退出低功耗模式时调用。

实际总线上的驱动有些字段是与**总线相关**的，不是通用的。最典型的就是 ID 表，通常驱动都会定义一个支持的设备 ID 列表，设备 ID 的格式以及匹配方法等都是和总线本身密切相关的。因此实际驱动都会将 `struct device_driver` 内嵌到自己的结构体里，并定义其他总线相关的字段，如 PCI 驱动：

```c
struct pci_driver {
       const struct pci_device_id *id_table; // 匹配的设备 ID
       struct device_driver	  driver;
};
```

### 注册驱动

向内核注册驱动的接口是：

```c
int driver_register(struct device_driver *drv);
```

实际的总线驱动会提供更高层的封装，如 `pci_driver_register()`，驱动开发者一般使用的都是这些高层的驱动接口。

### 遍历设备

一个驱动可以绑定多个设备，内核提供了接口以遍历同一个驱动的设备：

```c
int driver_for_each_dev(
	struct device_driver * drv,
	void * data,
	int (*callback)(struct device * dev, void * data)
);
```

## sysfs 接口

`/sys` 目录反映了系统中设备的层级结构。

每种总线类型在 `/sys/bus/` 下有一个对应的总线目录，如：

```
/sys/bus/
  |- i2c
  |- mmc
  |- pci
  |- usb
  |- ...
```

以 PCI 总线为例，每个总线目录下又有 2 个子目录对应总线下的设备和驱动：

```
/sys/bus/pci/
  |- devices/
  |- drivers/
```

**drivers** 目录下有该总线下注册的所有驱动：

```
/sys/bus/pci/
  |- devices/
  |- drivers/
    |- agpgart/
    |- e1000/
    |- ehci-pci/
```

**devices** 目录下列出属于该总线类型的所有设备，通过软链接的方式指向实际的设备目录：

```
/sys/bus/pci/
  |- devices/
    |- 00:00.0 -> ../../../devices/pci0/00:00.0
    |- 00:00.1 -> ../../../devices/pci0/00:00.1
    |- 00:00.2 -> ../../../devices/pci0/00:00.2
```
