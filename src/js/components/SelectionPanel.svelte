<script lang="ts">
  import { settings } from '../stores/settings';
  import { t } from '../i18n';
  import {
    actions,
    type TextSizeResult
  } from '../services/actions';
  import { tooltip } from '../services/tooltip';

  let textSizeResult = $state<TextSizeResult | null>(null);

  async function changeTextSize(): Promise<void> {
    textSizeResult = null;
    await actions.changeSelectedTextSize().then((result) => {
      if (result) textSizeResult = result;
    });
  }
</script>

<div class="panel active" id="panel-selection">
  <h3>{$t('selection.filter')}</h3>
  <div class="toolbar">
    <button
      class="btn btn-primary"
      id="select-text-only-button"
      use:tooltip={$t('selection.textOnlyHint')}
      onclick={() => actions.filterSelection('textOnly')}
      >{$t('selection.textOnly')}</button
    >

    <button
      class="btn"
      id="select-paths-only-button"
      use:tooltip={$t('selection.pathsOnlyHint')}
      onclick={() => actions.filterSelection('pathsOnly')}
      >{$t('selection.pathsOnly')}</button
    >

    <button
      class="btn"
      id="select-shapes-only-button"
      use:tooltip={$t('selection.shapesOnlyHint')}
      onclick={() => actions.filterSelection('shapesOnly')}
      >{$t('selection.shapesOnly')}</button
    >
  </div>

  <h3>{$t('selection.textTools')}</h3>
  <div class="toolbar">
    <button
      class="btn btn-primary"
      id="split-text-button"
      use:tooltip={$t('texttools.splitHint')}
      onclick={actions.splitText}>{$t('texttools.split')}</button
    >

    <button
      class="btn"
      id="merge-text-button"
      use:tooltip={$t('texttools.mergeHint')}
      onclick={actions.mergeText}>{$t('texttools.merge')}</button
    >
  </div>

  <h3>{$t('selection.modifyText')}</h3>
  <div class="toolbar">
    <label for="modify-text-font">{$t('selection.font')}</label>
    <select id="modify-text-font" bind:value={$settings.textFont}>
      <option value="ArialMT">{$t('settings.fontArial')}</option>
      <option value="TimesNewRomanPSMT">{$t('settings.fontTimes')}</option>
      <option value="Helvetica">{$t('settings.fontHelvetica')}</option>
    </select>
    <label for="modify-text-size">{$t('selection.fontSize')}</label>
    <select id="modify-text-size" bind:value={$settings.textSize}>
      <option value={5}>5 pt</option>
      <option value={6}>6 pt</option>
      <option value={7}>7 pt</option>
      <option value={8}>8 pt</option>
    </select>
    <button
      class="btn btn-primary"
      id="modify-text-button"
      use:tooltip={$t('selection.modifyTextHint')}
      onclick={changeTextSize}>{$t('selection.modifyText')}</button
    >
  </div>
  {#if textSizeResult}
    <div class="status" role="status">
      {$t('selection.modifyTextSuccess', [
        String(textSizeResult.changed),
        textSizeResult.font,
        String(textSizeResult.size)
      ])}
    </div>
  {/if}
</div>

<style>
  .status {
    margin-top: 10px;
    color: var(--muted);
    line-height: 1.4;
  }
</style>
