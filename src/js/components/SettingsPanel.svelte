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
    <div class="input-group">
      <label for="default-font">{$t('settings.defaultFont')}</label>
      <select
        id="default-font"
        use:tooltip={$t('settings.defaultFontHint')}
        bind:value={$settings.textFont}
      >
        <option value="ArialMT">{$t('settings.fontArial')}</option>
        <option value="TimesNewRomanPSMT">{$t('settings.fontTimes')}</option>
        <option value="Helvetica">{$t('settings.fontHelvetica')}</option>
      </select>
    </div>
    <div class="input-group">
      <label for="default-font-size">{$t('settings.defaultFontSize')}</label>
      <select
        id="default-font-size"
        use:tooltip={$t('settings.defaultFontSizeHint')}
        bind:value={$settings.textSize}
      >
        <option value={5}>5 pt</option>
        <option value={6}>6 pt</option>
        <option value={7}>7 pt</option>
        <option value={8}>8 pt</option>
      </select>
    </div>
    <div class="input-group">
      <label for="default-line-width">{$t('settings.defaultLine')}</label>
      <select
        id="default-line-width"
        use:tooltip={$t('settings.defaultLineHint')}
        bind:value={$settings.lineWidth}
      >
        <option value={0.25}>0.25 pt</option>
        <option value={0.5}>0.5 pt</option>
        <option value={0.75}>0.75 pt</option>
        <option value={1}>1 pt</option>
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
