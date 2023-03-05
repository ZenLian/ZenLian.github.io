+++
title = "使用 Github Actions 自动部署 Hugo 博客"
slug = "github-actions-hugo"
date = 2021-01-27T23:22:41+08:00
[taxonomies]
tags = ["tools", "github", "hugo"]
+++

Github Actions 可以帮你自动执行 Hugo 的编译、部署，配置好之后平时只需要维护一份 hugo 博客的源码，push 时自动发布到 Github Pages 上。

---

你的 Github Pages 仓库需要有两个分支：一个分支 `hugo` 保存 hugo 博客源码，一个分支 `gh-pages` 保存生成的 public 静态网站。当然你另建一个独立的仓库保存博客源码也是可以的。

在 `hugo` 分支下新建 `.github/workflows/build.yml`，参照 `actions-hugo` 官方文档的描述添加：

```yaml
name: github pages

on:
  push:
    branches:
      - main # Set a branch to deploy

jobs:
  deploy:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true # Fetch Hugo themes (true OR recursive)
          fetch-depth: 0 # Fetch all history for .GitInfo and .Lastmod

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: "0.79.1"
          # extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

这个文件需要根据自己的实际情况修改。

---

## 触发分支

```yml
on:
  push:
    branches:
      - hugo # Set a branch to deploy
```

这里指定了哪个分支 push 时会触发这个 Github Actions[^1]。我的 hugo 分支保存着源码，所以这里设置为 `hugo`：

## Checkout 分支

```yml
- uses: actions/checkout@v2
  with:
    submodules: true # Fetch Hugo themes (true OR recursive)
    fetch-depth: 0 # Fetch all history for .GitInfo and .Lastmod
```

Checkout 一个分支执行后续的 hugo 编译部署操作。默认为触发分支，这里触发分支就是 hugo，不需要改动。也可以通过 `ref` 指定[^2]：

```yml
- uses: actions/checkout@v2
  with:
    ref: "hugo"
```

---

## hugo 编译

```yml
- name: Setup Hugo
  uses: peaceiris/actions-hugo@v2
  with:
    hugo-version: "latest"
    extended: true

- name: Build
  run: hugo --minify
```

如果不使用 hugo-extended 可以删掉 `extended: true`[^3]。我使用的主题需要 scss，所以我留着这行。

---

## hugo 部署

```yml
- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
    publish_dir: ./public
    cname: blog.zenlian.xyz
```

### Deploy Key

这一步使用 deploy_key 的方式部署 hugo 到 github pages 上。另外还可以使用 github_token 和 personal_token，可参照文档，不再赘述。[^4]

使用 deploy_key，你需要生成一对 ssh key 密钥，在源码仓库（执行 Github Actions 的仓库）设置私钥，发布仓库（Github Pages 所在仓库）配置公钥。因为这里使用的是同一个仓库的不同分支，所以公私钥都是放在 Github Pages 仓库上的。

打开你的发布仓库（Github Pages 仓库），Settings->Deploy Keys->Add deploy key，贴上 ssh 公钥，记得一定要勾上 Allow write access 选项。

打开你的博客源码仓库，Settings->Secrets->New repository secret，Name 填 `ACTIONS_DEPLOY_KEY`，Value 贴上 ssh 私钥。

### 发布的仓库和分支名

默认是发布在同一个仓库的 `gh-pages` 分支的，如果你使用了单独的仓库保存博客源码，也可以指定 `external_repository` 发布到 Github Pages 仓库上：

```yml
- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
    publish_dir: ./public
    external_repository: username/username.github.io
    publish_branch: your-branch # default: gh-pages
```

### 自定义域名

如果你使用了自定义域名，仅在 Github Pages 仓库的设置里配置域名是无效的，因为每次部署都会覆盖那里的设置。你需要通过 `cname` 指定：

```yml
- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
    publish_dir: ./public
    cname: custom.domain.com
```

---

## 查看 Actions

配置好之后，push 你的博客源码，点开 Github 仓库的 Actions，你会看到正在执行的操作，大概 需要二三十秒。完成后打开 Github Pages 网站，就可以看到你的 hugo 网站已经成功发布了！

---

[^1]: <https://docs.github.com/en/actions>
[^2]: <https://github.com/actions/checkout>
[^3]: <https://github.com/peaceiris/actions-hugo>
[^4]: <https://github.com/peaceiris/actions-gh-pages>
