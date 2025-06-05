{% set callout_type = type | default(value="note") %}

{% set callout_icon = "pencil-outline" %}
{% if callout_type == "info" %}
  {% set callout_icon = "information" %}
{% elif callout_type == "warning" %}
  {% set callout_icon = "alert" %}
{% elif callout_type == "error" %}
  {% set callout_icon = "close-circle" %}
{% elif callout_type == "quote" %}
  {% set callout_icon = "format-quote-close" %}
{% endif %}

{% set callout_name = name | default(value=callout_type | capitalize) %}

<div class="callout" type="{{ callout_type }}">
  <span class="callout-header">
    <iconify-icon icon="mdi:{{callout_icon}}"></iconify-icon>
    <span class="callout-name">{{ callout_name }}</span>
  </span>
  <div class="callout-inner">
    {{ body | markdown }}
  </div>
</div>
