# Cattery

An elegant theme for [zola](https://github.com/getzola/zola).

## configuration

Check `theme.toml`, copy `[extra]` part into your `config.toml` and make your
changes.

```toml
[extra]

# set to "colorful" to use full catppuccin palette
colormode = "normal" # or "colorful"

page_404_content = ["Oops!", "You're stuck in limbo."]

# icon ref to iconify-icon
# internal 'path'/external 'link'
navigation = [
  { icon = "mdi:tags", label = "tags", path = "tags"},
  { icon = "mdi:user", label = "about", path = "about"}
]

# social links
socials = [
  { icon = "mdi:github", link = "https://github.com/zenlian" },
  { icon = "mdi:email", link = "mailto://zeninglian@gmail.com" }
]

[extra.copyright]
# site copyright
site = ["CC BY-NC-SA 4.0", "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"]
```

## misc

You can set `highlight_theme` to "css" to get a more consistent look:

```toml
[markdown]
highlight_code = true
highlight_theme = "css"
```
