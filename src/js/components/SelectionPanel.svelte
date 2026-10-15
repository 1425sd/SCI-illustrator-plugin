<script lang="ts">
  import { settings } from '../stores/settings';
  import { workspace } from '../stores/workspace';
  import { t } from '../i18n';
  import {
    actions,
    type LineWidthResult,
    type TextSizeResult
  } from '../services/actions';
  import { tooltip } from '../services/tooltip';
  import HelpBadge from './HelpBadge.svelte';

  let textSizeResult = $state<TextSizeResult | null>(null);
  let lineWidthResult = $state<LineWidthResult | null>(null);

  async function changeTextSize(): Promise<void> {
    textSizeResult = null;
    await actions.changeSelectedTextSize().then((result) => {
      if (result) textSizeResult = result;
    });
  }

  async function changeLineWidth(): Promise<void> {
    lineWidthResult = null;
    await actions.changeSelectedLineWidth().then((result) => {
      if (result) lineWidthResult = result;
    });
  }
</script>

<div class="panel active" id="panel-selection">
  <h3>{$t('selection.filter')}<HelpBadge key="help.selection.filter" /></h3>
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

  <div class="input-group filter-invert-row">
    <label for="filter-invert">{$t('selection.filterInvert')}</label>
    <input
      type="checkbox"
      id="filter-invert"
      use:tooltip={$t('selection.filterInvertHint')}
      bind:checked={$workspace.selectionFilterInvert}
    />
  </div>

  <h3>{$t('selection.textTools')}<HelpBadge key="help.selection.textTools" /></h3>
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

  <h3>{$t('selection.modifyText')}<HelpBadge key="help.selection.modifyText" /></h3>
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

  <h3>{$t('selection.modifyLine')}<HelpBadge key="help.selection.modifyLine" /></h3>
  <div class="toolbar">
    <label for="modify-line-width">{$t('selection.lineWidth')}</label>
    <select id="modify-line-width" bind:value={$settings.lineWidth}>
      <option value={0.25}>0.25 pt</option>
      <option value={0.5}>0.5 pt</option>
      <option value={0.75}>0.75 pt</option>
      <option value={1}>1 pt</option>
    </select>
    <button
      class="btn btn-primary"
      id="modify-line-button"
      use:tooltip={$t('selection.modifyLineHint')}
      onclick={changeLineWidth}>{$t('selection.modifyLine')}</button
    >
  </div>
  {#if lineWidthResult}
    <div class="status" role="status">
      {$t('selection.modifyLineSuccess', [
        String(lineWidthResult.changed),
        String(lineWidthResult.width)
      ])}
    </div>
  {/if}
</div>

<style>
  .filter-invert-row {
    margin-top: 8px;
  }

  .status {
    margin-top: 10px;
    color: var(--muted);
    line-height: 1.4;
  }
</style>
