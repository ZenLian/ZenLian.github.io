+++
title = "Hello, hugo!"
slug = "hello-hugo"
date = 2021-01-27T16:29:27+08:00
[taxonomies]
tags = ["tools", "hugo"]
+++

说来惭愧，我的博客已经荒废许久，上一篇是在两年前折腾 hexo 的时候。后来不更新的原因一方面当然是因为懒，另一方面是觉得当时搭起来的博客有两个硬伤：

1. 编译速度慢。hexo 的编译速度是我最忍受不了的地方，随便加一点东西都要编译半天。而且 hexo 使用的 nodejs 依赖关系显得有些复杂。
2. 不能自动部署。我需要同时维护博客源码和生成的静态网站源码，既要把博客源码 push 到 github 上去，还要把输出的网站源码也 push 上去。编译已经很慢了，再维护两份代码仓库就更让人心烦。

前段时间我脑子一热又想写博客了，于是在网上搜了一下，发现这两个问题都可以解决了。

第 1 个问题的解决方案是 hugo。hugo 是 hexo 的完美替代，它是用 golang 编写的，最大的优点就是快，编译几乎是秒速。而且 hugo 完全没有其他依赖，只需要一个可执行文件，简直就是我的理想型。

第 2 个问题，可以用 github actions 解决。有现成的 github actions 可以实现 hugo 的自动部署，本地只需要维护博客仓库就可以了，push 到 github 时会触发 github actions 帮我们执行编译并部署到 github-pages 的操作，详见我的[另一篇博文](https://zenlian.github.io/posts/github-actions-hugo/)。

---

记录一下 hugo 搭建过程中遇到的一些新的概念和问题。

## 内容管理

### 分区

hugo 的文章都放在 content 目录下，采用 sections 管理文章的分类。sections 的组织结构是遵循你的目录结构的，每个目录都是一个分区。你的文章所在分区是由它的位置决定的，你无法在文章的 metadata 中修改它的分区。

content 根目录下的每个文件夹会自动成为一个分区。如果文件夹不在 content 根目录下，那么需要新建一个 \_index.md 文件使它成为分区。分区和目录一样是树状结构，因此很适合作为文章的分类使用，比 hexo 在文章中使用 categories 指定分类要更科学些。

```plaintext
content
├── life/
└── tech/
   ├── cpp/
   │ └── _index.md
   └── misc/
```

如上的目录结构中，有 life 和 tech 两个分区，而 tech 下又有 cpp 子分区。misc 不是分区，因为它既不在根目录下，也没有 `_index.md` 文件。`_index.md` 文件 metadata 中的 title 可以指定分区名。

### URL 管理

首先需要在 config.toml 中的 `baseURL` 指定网站的 url：

```toml
baseURL = "https://example.com/"
```

如果你有一个 `content/posts/article.md` 文件，编译后输出的对应 url 是 `https://example.com/posts/article/`。

如果你要让文件命名为中文，而生成的 url 为英文，可以用 `slug` 指定。比如你有一篇文章 `content/posts/引言.md`，在文章的 metadata 中添加：

```yaml
---
title: "引言"
slug: "introdution"
---
```

这样文件名和显示的文章名都是中文，而对应的 url 变为 `https://example.com/posts/introdution/`。

### 图片资源

图片位置以及引用方法有两种：

1. 所有的图片都放在 `static/images` 目录下，markdown 文件中通过路径 `![](/images/XXX.png` 引用
2. 图片和 markdown 文件放在一起。在同一目录下建立一个和 markdown 文件同名的文件夹，把图片放在里面，用相对路径引用：`![](XXX.png)`。也可以把一篇文章和它的其他资源文件放在同一个单独的文件夹里，比如文章写在 `/posts/article/index.md` 中，图片位于 `/posts/article/img.png`，这样也可以直接在文章中用相对路径引用 `![](img.png)`。

## 主题 MemE

用 hexo 的时候使用的是 NexT 主题，既然换了 hugo 就想尝试点新鲜的。我无意间点进了[reuixiy 的博客](https://io-oi.me/)（怎么点进去的我已经忘了），觉得这个博客的主题 [MemE](https://github.com/reuixiy/hugo-theme-meme) 简洁而优雅，很符合我的审美 ~~（假设我有）~~，就决定是它了。
