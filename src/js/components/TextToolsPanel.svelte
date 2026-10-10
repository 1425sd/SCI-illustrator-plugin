<script lang="ts">
  import { t } from '../i18n';
  import { actions } from '../services/actions';
  import { tooltip } from '../services/tooltip';
</script>

<div class="panel active" id="panel-text">
  <h3>{$t('texttools.split')}</h3>
  <div class="toolbar">
    <button
      class="btn btn-primary"
      id="split-text-button"
      use:tooltip={$t('texttools.splitHint')}
      onclick={actions.splitText}>{$t('texttools.split')}</button
    >
  </div>
</div>
