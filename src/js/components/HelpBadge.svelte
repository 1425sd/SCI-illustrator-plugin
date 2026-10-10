<script lang="ts">
  import { t } from '../i18n';
  import { tooltip } from '../services/tooltip';

  let { key }: { key: string } = $props();
</script>

<span
  class="help-badge"
  use:tooltip={$t(key)}
  role="note"
  tabindex="0"
  aria-label={$t(key)}>?</span
>

<style>
  .help-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: auto;
    flex: 0 0 auto;
    border: 1px solid var(--border);
    border-radius: 50%;
    font-size: 11px;
    line-height: 1;
    color: var(--muted);
    cursor: help;
    user-select: none;
  }

  .help-badge:hover,
  .help-badge:focus-visible {
    color: var(--text);
    border-color: var(--primary);
    outline: none;
  }
</style>
