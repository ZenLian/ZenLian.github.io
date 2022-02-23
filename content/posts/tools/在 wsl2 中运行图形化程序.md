---
title: "在 wsl2 中运行图形化程序"
slug: "gui-apps-in-wsl2"
date: 2022-02-21T22:47:01+08:00
dropCap: true
tags:
- tools
- wsl
---

以前在 wsl 上运行图形化程序需要额外安装 Xserver，现在巨硬支持直接运行了！[^1]

## 准备工作

### 系统版本

首先你的 windows 版本必须在 `Windows 11 Build 22000` 以上。

没错，是 Windows 11，不想升级的就别往下看了。

在 设置->系统->关于 中可以查看操作系统版本。如果版本不满足要求，可以 [加入 windows 预览体验计划](https://insider.windows.com) 获取最新的版本。

### 显卡驱动支持

安装最新的虚拟显卡驱动支持。这样可以为你的 wsl 开启一个虚拟 GPU（vGPU），从而享受硬件渲染加速效果。

3 大厂商的最新驱动支持：

- [Intel](https://www.intel.cn/content/www/cn/zh/download/19344/intel-graphics-windows-dch-drivers.html?)
- [AMD](https://www.amd.com/en/support/kb/release-notes/rn-rad-win-wsl-support)
- [NVIDIA](https://developer.nvidia.com/cuda/wsl)

## 升级 wsl

原来没有 wsl 的直接安装一个发行版就行。原来就有的 wsl 需要升级。

windows 中以管理员身份运行：

```powershell
wsl --update
```

重启一下 wsl 就行了：

```powershell
wsl --shutdown
```

## 运行图形程序

不需要额外的配置，直接在 wsl 里运行图形化程序，图形界面就会在 windows 上出现。

[^1]: <https://docs.microsoft.com/en-us/windows/wsl/tutorials/gui-apps>
