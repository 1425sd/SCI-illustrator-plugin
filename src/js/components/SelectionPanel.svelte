<script lang="ts">
  import { t } from '../i18n';
  import { actions } from '../services/actions';
  import { tooltip } from '../services/tooltip';
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
</div>
