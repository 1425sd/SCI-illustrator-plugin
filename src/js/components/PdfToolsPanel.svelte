<script lang="ts">
  import { workspace } from '../stores/workspace';
  import { t } from '../i18n';
  import {
    actions,
    type ImageRatioResult,
    type PdfCleanupResult
  } from '../services/actions';

  let cleanupResult = $state<PdfCleanupResult | null>(null);
  let ratioResult = $state<ImageRatioResult | null>(null);

  async function cleanupPdf(): Promise<void> {
    cleanupResult = null;
    await actions.cleanupPdfSelection().then((result) => {
      if (result) cleanupResult = result;
    });
  }

  async function changeRatio(): Promise<void> {
    ratioResult = null;
    await actions.changeImageRatio().then((result) => {
      if (result) ratioResult = result;
    });
  }

  const backgroundSizeSummary = $derived(
    cleanupResult?.backgroundSizes?.length
      ? cleanupResult.backgroundSizes.join('、') +
          (cleanupResult.removedBackgrounds >
          cleanupResult.backgroundSizes.length
            ? ' …'
            : '')
      : ''
  );
  import { tooltip } from '../services/tooltip';
  import HelpBadge from './HelpBadge.svelte';
</script>

<div class="panel active" id="panel-pdf">
  <fieldset>
    <legend>{$t('pdf.cleanupTitle')}<HelpBadge key="help.pdf.cleanup" /></legend>
    <p class="panel-description">{$t('pdf.cleanupDescription')}</p>
    <div class="grid">
      <div class="input-group">
        <label for="remove-white-text">{$t('pdf.removeWhiteText')}</label>
        <input
          type="checkbox"
          id="remove-white-text"
          use:tooltip={$t('pdf.removeWhiteTextHint')}
          bind:checked={$workspace.removeWhiteText}
        />
      </div>
    </div>
    <div class="toolbar">
      <button
        class="btn btn-primary"
        id="cleanup-pdf-button"
        use:tooltip={$t('pdf.cleanupDescription')}
        onclick={cleanupPdf}>{$t('pdf.cleanup')}</button
      >
    </div>
    {#if cleanupResult}
      <div class="status" role="status">
        {$t('pdf.cleanupSuccess', [
          String(cleanupResult.removedBackgrounds),
          String(cleanupResult.removedPaths),
          String(cleanupResult.removedGroups)
        ])}
      </div>
      <div class="status status-details" role="status">
        {$t('pdf.cleanupDetails', [
          String(cleanupResult.changedFonts || 0),
          String(cleanupResult.releasedMasks || 0),
          String(cleanupResult.ungroupedGroups || 0),
          String(cleanupResult.embeddedImages || 0)
        ])}
      </div>
      {#if backgroundSizeSummary}
        <div class="status status-details" role="status">
          {$t('pdf.cleanupBackgroundSizes', [backgroundSizeSummary])}
        </div>
      {/if}
      {#if cleanupResult.removedWhiteTexts !== undefined}
        <div class="status status-details" role="status">
          {$t('pdf.cleanupWhiteTexts', [
            String(cleanupResult.removedWhiteTexts)
          ])}
        </div>
      {/if}
      {#if cleanupResult.warning}
        <div class="status status-warning" role="status">
          {$t('pdf.cleanupWarning', [cleanupResult.warning])}
        </div>
      {/if}
      <div class="status status-details" role="status">
        {$t('pdf.cleanupScope', [
          String(cleanupResult.selectionRoots),
          String(cleanupResult.scopeItems)
        ])}
      </div>
    {/if}
  </fieldset>

  <fieldset>
    <legend>{$t('pdf.ratioTitle')}<HelpBadge key="help.pdf.ratio" /></legend>
    <p class="panel-description">{$t('pdf.ratioDescription')}</p>
    <div class="grid">
      <div class="input-group">
        <label for="image-ratio">{$t('pdf.ratio')}</label>
        <input
          type="number"
          id="image-ratio"
          min="0.01"
          step="0.01"
          bind:value={$workspace.imageRatio}
        />
      </div>
      <div class="input-group">
        <label for="ratio-anchor">{$t('pdf.ratioAnchor')}</label>
        <select id="ratio-anchor" bind:value={$workspace.ratioAnchor}>
          <option value="height">{$t('pdf.keepHeight')}</option>
          <option value="width">{$t('pdf.keepWidth')}</option>
        </select>
      </div>
    </div>
    <div class="toolbar">
      <button
        class="btn btn-primary"
        id="change-ratio-button"
        use:tooltip={$t('pdf.ratioDescription')}
        onclick={changeRatio}>{$t('pdf.changeRatio')}</button
      >
    </div>
    {#if ratioResult}
      <div class="status" role="status">
        {$t('pdf.ratioSuccess', [
          String(ratioResult.changed),
          String(ratioResult.ratio)
        ])}
      </div>
    {/if}
  </fieldset>
</div>

<style>
  fieldset {
    min-width: 0;
    margin: 0 0 16px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  legend {
    padding: 0 6px;
    font-weight: 600;
  }

  .panel-description {
    margin: 0 0 12px;
    color: var(--muted);
    line-height: 1.45;
  }

  .status {
    margin-top: 10px;
    color: var(--muted);
    line-height: 1.4;
  }

  .status-details {
    margin-top: 4px;
  }

  .status-warning {
    margin-top: 4px;
    color: var(--warning, #d97706);
  }
</style>
