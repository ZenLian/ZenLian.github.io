
+++
title = "linux RTC 驱动"
date = 2023-10-27T21:22:20+08:00
slug = "linux-driver-rtc"
[taxonomies]
tags = ["linux 驱动"]
+++


## RTC 驱动

> `drivers/rtc/*`

注册 RTC 设备：

- `rtc_device_register(dev, name, ops, owner)`

以 I2C 接口的 RTC 为例，向 RTC 子系统注册 rtc 设备：

```c
static const struct rtc_class_ops CHIP_rtc_ops = {
	.read_time = CHIP_rtc_read_time,
	.write_time = CHIP_rtc_write_time,
};

static int CHIP_probe(struct i2c_client *client)
{
	...
	CHIP->rtc = devm_rtc_device_register(&client->dev,
		"rtc-CHIP",
		&CHIP_rtc_ops,
		THIS_MODULE);
	...
}
```

`struct rtc_class_ops` 是需要实现的 RTC 函数，其中只有 `read_time`/`write_time` 是必须实现的，用于读写 RTC 芯片的时间信息。

```c
// 从芯片读取时间，填到 rtc_time 结构体
static int CHIP_rtc_read_time(struct device *dev, struct rtc_time *tm)
{
	tm->tm_sec = ...;  // 秒   0~59
	tm->tm_min = ...;  // 分   0~59
	tm->tm_hour = ...; // 小时 0~23
	tm->mday = ...;    // 日   1~31
	tm->wday = ...;    // 星期  0~6,0表示周日
	tm->mon  = ...;    // 月   0~11
	tm->year = ...;    // 年   以 1900 为基准，比如 124 表示 2024
}
```

## 系统时钟同步

将 RTC 同步到系统时钟，可以在内核里配置开机自动同步，也可以在应用层使用命令行、`ioctl` 接口配置。

### 内核配置

内核有几个编译选项控制了 RTC 时间的自动同步，会在启动时自动执行：

- `CONFIG_RTC_HCTOSYS`：RTC 时间同步到系统时间
	- `CONFIG_RTC_HCTOSYS_DEVICE`：使用的 RTC 设备（如 `rtc0`）
- `CONFIG_RTC_SYSTOHC`：NTP 时间同步到 RTC
	- `CONFIG_RTC_SYSTOHC_DEVICE`：使用的 RTC 设备

原理：

- `drivers/rtc/hctosys.c` 中定义了 `rtc_hctosys` 函数，在这里读取 RTC 设备的时间，调用 `do_settimeofday64` 更新系统时间。
- 该函数放在 `late_initcall` 段中，会在内核启动的最后阶段调用（此时所有设备都已初始化完成）。

### 命令行

RTC 同步到系统：

```
hwclock -s
```

系统时间同步到 RTC：

```shell
hwclock -w
```

显示 RTC 时间：

```shell
hwclock -r
```

将指定 RTC 设备（默认为 `/dev/rtc0`）的时间同步到系统时间：

```shell
hwclock -f /dev/rtc1 -s
```

### 时区配置

在 busybox 下设置 `TZ` 环境。

比如设置当前时区名为 `CHN`，东 8 区（`-8`）：

```
export TZ='CHN-8'
```

其中 `CHN` 只是时区名，`-8` 表示东 8 区。同样的 `+5` 表示西 5 区。