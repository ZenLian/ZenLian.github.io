+++
title = "给 zola 添加 callouts"
date = 2025-06-05T19:38:18+08:00
slug = "callouts"
[taxonomies]
tags = ["zola"]
+++

Obsidian 中有 **callouts** 语法用来创建醒目的提示框，能够在笔记中突出重要信息。Zola 中却没有这个语法，于是我借助 shortcode 也实现了类似的效果。

## 用法

```md
{%/* callout(type='note', name="Note") */%}
- **type** 表示 callout 类型，默认为 'note'
- **name** 为 callout 的标题，默认为 type 对应的首字母大写的字符串。

hello
{%/* end */%}
```

渲染结果如下：

{% callout(type='note', name="Note") %}
- **type** 表示 callout 类型，默认为 'note'
- **name** 为 callout 的标题，默认为 type 对应的首字母大写的字符串。
{% end %}

## 效果

所有类型的 callouts 如下（完全照搬了 obsidian）：

{% callout(type='note') %}
This is a **note** callout.
{% end %}

{% callout(type='info') %}
This is a **info** callout.
{% end %}

{% callout(type='todo') %}
This is a **todo** callout.
{% end %}

{% callout(type='tip') %}
This is a **tip** callout.
{% end %}

{% callout(type='success') %}
This is a **success** callout.
{% end %}

{% callout(type='faq') %}
This is a **faq** callout.
{% end %}

{% callout(type='warning') %}
This is a **WARNING** callout.
{% end %}

{% callout(type='error') %}
This is a **ERROR** callout.
{% end %}

{% callout(type='bug') %}
This is a **bug** callout.
{% end %}

{% callout(type='example') %}
This is a **example** callout.
{% end %}

{% callout(type='quote') %}
This is a **QUOTE** callout.
{% end %}