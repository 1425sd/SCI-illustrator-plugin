<script lang="ts">
  import { workspace } from '../stores/workspace';
  import { t } from '../i18n';
  import {
    actions,
    type ImageRatioResult,
    type PdfCleanupResult,
    type TextSizeResult
  } from '../services/actions';

  let cleanupResult = $state<PdfCleanupResult | null>(null);
  let textSizeResult = $state<TextSizeResult | null>(null);
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

  async function changeTextSize(): Promise<void> {
    textSizeResult = null;
    await actions.changeSelectedTextSize().then((result) => {
      if (result) textSizeResult = result;
    });
  }
</script>

<div class="panel active" id="panel-pdf">
  <fieldset>
    <legend>{$t('pdf.cleanupTitle')}</legend>
    <p class="panel-description">{$t('pdf.cleanupDescription')}</p>
    <div class="toolbar">
      <button
        class="btn btn-primary"
        id="cleanup-pdf-button"
        onclick={cleanupPdf}>{$t('pdf.cleanup')}</button
      >
    </div>
    <div class="text-tools">
      <label for="pdf-text-size">{$t('pdf.textSize')}</label>
      <select id="pdf-text-size" bind:value={$workspace.pdfTextSize}>
        <option value={6}>6 pt</option>
        <option value={5}>5 pt</option>
      </select>
      <button
        class="btn btn-secondary btn-sm"
        id="change-pdf-text-size-button"
        onclick={changeTextSize}>{$t('pdf.modifyText')}</button
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
    {/if}
    {#if textSizeResult}
      <div class="status" role="status">
        {$t('pdf.modifyTextSuccess', [
          String(textSizeResult.changed),
          String(textSizeResult.size)
        ])}
      </div>
    {/if}
  </fieldset>

  <fieldset>
    <legend>{$t('pdf.ratioTitle')}</legend>
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

  .text-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }

  .text-tools label {
    color: var(--muted);
    white-space: nowrap;
  }

  .text-tools select {
    flex: 0 0 72px;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }
</style>
