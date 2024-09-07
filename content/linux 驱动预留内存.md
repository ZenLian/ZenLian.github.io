+++
title = "linux 驱动预留内存"
date = 2023-04-01T21:20:15+08:00
slug = "linux-driver-reserved-memory"
[taxonomies]
tags = ["linux 驱动"]
+++

嵌入式项目中可能会碰到这样的需求，需要在内存中预留出一块比较大的空间在驱动里使用，并且这块空间的物理地址必须是固定的。而内核里常用的 `kmalloc()` 分配出的内存物理地址是不固定的，我们需要在内核启动之前预留一块空间出来。

## 方法一：指定内存大小

默认情况下 linux 会使用整块内存，如果你的内存是 1G，那么内核会将这 1G 都收入囊中，你想使用只能向它申请。除非你在 uboot 里指定启动参数，规定内存大小：

```
setenv bootargs console=ttyAMA0,115200 root=/dev/mmcblk0p1 rw mem=512M
```

最后的 `mem=512M` 会让 linux 认为系统的内存本身就只有 512M，那么剩下的 512M 物理内存你就可以随意使用了。

## 方法二：预留内存

预留内存比直接指定内存大小更加符合驱动开发的规则，但用起来稍微复杂一些。

### 设备树配置

首先我们需要在设备树中通过 `reserved-memory` 节点预留出物理内存。下面的设备树文件是一个示例：

- 预留了 `0x10000000` 开始的大小为 `0x01000000` 的物理内存
- 标签为 `somedev_reserved`，供设备节点引用
- `no-map` 表示内核不会对该段内存作地址映射，`/proc/iomem` 中的 System RAM 也不会包括该内存区域

```
\{
  reserved-memory {
    #address-cells = <1>;
    #size-cells = <1>;
    ranges;
    somedev_reserved: buffer@0x1f000000 {
      no-map;
      reg = <0x10000000 0x01000000>;
    };
  };
};
```

然后在用到需要用到预留内存的驱动设备节点中，使用 `memory-region` 分配预留的内存区域：

```
\{
  somedev@0 {
    compatible = "xlnx,dev1";
    memory-region = <&somedev_reserved>;
  }
}
```

### 驱动程序

驱动程序里要使用这块内存，需要先解析自己的设备树节点拿到物理地址，再选择合适的映射方式拿到虚拟地址。其中映射又分为带缓存和不带缓存两种方式。

#### 带缓存映射

将预留内存用 `memremap` 映射，带有缓存，可以直接读写：

```c
// 获得预留内存的设备树节点（memory-region 指向 somedev_reserved）
struct device_node *np = of_parse_phandle(dev->of_node, "memory-region", 0);
if (!np) {
    dev_err(dev, "No memory-region specified\n");
    return -1;
}

// 获得内存资源地址（存在 struct resource 中）
struct resource r;
int rc = of_address_to_resource(np, 0, &r);
if (rc) {
    dev_err(dev, "No memory address assigned\n");
}

// 物理地址
unsigned long paddr = r.start;
// 映射为虚拟地址
unsigned long vaddr = (unsigned long)memremap(r.start, resource_size(&r), MEMREMAP_WB);

// 对虚拟地址直接读写
*((u32 *)vadd) = 0x12345678;          // 32位写
pr_info("0x%08X\n", *((u32 *)vaddr)); // 32位读
```

#### 不带缓存映射

如果不希望带缓存，使用 `ioremap`，需要调用 IO 函数读写：

```c
// 映射为虚拟地址
unsigned long vaddr = (unsigned long)ioremap(r.start, resource_size(&r));
// IO 函数读写大块内存
memcpy_toio();
memcpy_fromio();
memset_io();
```