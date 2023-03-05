+++
title = "在 wsl2 中部署 hugo 环境"
slug = "hugo-in-wsl2"
date = 2021-01-29T14:33:37+08:00
[taxonomies]
tags = ["tools", "wsl", "hugo"]
+++

有了 vscode 的 remote ssh 后，可以直接用 vscode 打开 wsl2 中的 hugo-site 目录，毕竟在 linux 环境中敲命令行比 powershell 舒服多了。

但是 wsl2 是独立的虚拟环境，windows 上不能直接通过 `localhost:端口号` 的方式访问部署在 wsl2 本地的网络服务。

```shell
hugo server
...
Web Server is available at //localhost:1313/ (bind address 127.0.0.1)
```

这时打开 windows 上的浏览器访问 `localhost:1313` 是访问不到博客网站的。

我们必须将服务部署在 wsl 的虚拟 ip 地址上。

---

首先用 `ifconfig` 查看 wsl 的虚拟 ip 地址：

```shell
$ ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.23.162.136  netmask 255.255.240.0  broadcast 172.23.175.255
        inet6 fe80::215:5dff:fe98:82e3  prefixlen 64  scopeid 0x20<link>
        ether 00:15:5d:98:82:e3  txqueuelen 1000  (Ethernet)
        RX packets 79159  bytes 47566681 (47.5 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 80374  bytes 116280960 (116.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

可以看到 eth0 的 ip 地址是 `172.23.162.136`，我们把 hugo 服务部署在这个地址上：

```shell
$ hugo server --bind 172.23.162.136 --baseURL=http://172.23.162.136
...
Web Server is available at http://172.23.162.136:1313/ (bind address 172.23.162.136)
```

现在再访问 `http://172.23.162.136:1313/` 就可以看到博客网站了。

---

这个方法的缺点是，wsl 的虚拟 ip 地址是由 windows 分配的，每次重启都会更换。不想每次都手动查询地址再输入命令，可以封装一个简单的 bash 脚本：

```shell
#!/bin/bash
IPADDRESS=$(ifconfig eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)
echo $IPADDRESS
hugo server --bind $IPADDRESS --baseURL=http://$IPADDRESS
```

把这个脚本保存为 `start-server.sh` 放在根目录，每次需要本地运行 hugo server 的时候只有运行这个 bash 脚本就行了。
