{% set callout_type = type | default(value="note") %}
{% set callout_name = name | default(value=callout_type | capitalize) %}

<div class="callout" type="{{ callout_type }}">
  <span class="callout-title">
    <span class="callout-icon"></span>
    <span class="callout-name">{{ callout_name }}</span>
  </span>
  <div class="callout-inner">
    {{ body | markdown }}
  </div>
</div>
