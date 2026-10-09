<script lang="ts">
  import { settings } from '../stores/settings';
  import { t } from '../i18n';
  import { tooltip } from '../services/tooltip';
  import { version } from '../../../package.json';
</script>

<div class="panel active" id="panel-settings">
  <div class="grid">
    <div class="input-group">
      <label for="language">{$t('settings.language')}</label>
      <select
        id="language"
        use:tooltip={$t('settings.languageHint')}
        bind:value={$settings.language}
      >
        <option value="en">{$t('settings.english')}</option>
        <option value="zh_CN">{$t('settings.chinese')}</option>
      </select>
    </div>
  </div>
  <p class="plugin-version">{$t('settings.version', ['v' + version])}</p>
</div>

<style>
  .plugin-version {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 12px;
  }
</style>
