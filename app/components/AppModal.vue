<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

/**
 * The one dialog, used by both the site and the dashboard.
 *
 * AI-DECISION: there were eight window.confirm/prompt calls and two hand-rolled
 * overlays across the two repositories. A native confirm cannot be styled, cannot
 * say anything in the theme the reader chose, blocks the page while it is up, and
 * on a phone renders as a system sheet that looks like it came from somewhere
 * else. Worse, it is a yes/no with no room to explain what is about to happen —
 * which is exactly what a destructive action needs. See AI-NOTES.md §5.
 *
 * Deliberately identical in both repositories, imports and all, so a fix made in
 * one can be copied to the other without translation.
 *
 * Usage:
 *   <AppModal v-model="open" :title="…" tone="danger" @confirm="doIt" />
 * Free-form content goes in the default slot, and the whole button row can be
 * replaced through #actions when confirm/cancel is not the shape of the choice.
 */

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: '' },
  /** 'default' or 'danger'. Danger colours the confirm button. */
  tone: { type: String, default: 'default' },
  /** Optional icon name for the modal header */
  icon: { type: String, default: '' },
  /** Work in flight: the buttons disable but the dialog stays put. */
  busy: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
  /** Set false where dismissing by accident would lose typed input. */
  dismissible: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const panel = ref(null);
let returnFocusTo = null;

const danger = computed(() => props.tone === 'danger');

function close(reason = 'cancel') {
  if (props.busy) return;
  emit('update:modelValue', false);
  if (reason === 'cancel') emit('cancel');
}

function confirm() {
  if (props.busy || props.confirmDisabled) return;
  emit('confirm');
}

/**
 * How many dialogs currently want the page held still.
 *
 * AI-TRAP: this has to live outside the component, not inside <script setup>.
 * Several AppModals are mounted at once — the layout renders one LogoutButton
 * for the desktop nav and another for the mobile drawer, and Teleport lifts each
 * dialog out of its hidden container — so a per-instance counter lets one modal
 * closing hand scrolling back to a page another modal is still covering.
 */
function lockScroll(on) {
  if (typeof document === 'undefined') return;
  const held = Math.max(0, Number(document.body.dataset.modalCount || 0) + (on ? 1 : -1));
  document.body.dataset.modalCount = String(held);
  document.body.style.overflow = held > 0 ? 'hidden' : '';
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside the dialog, which is what makes it modal for a keyboard. */
function onKeydown(event) {
  if (event.key === 'Escape' && props.dismissible) {
    event.stopPropagation();
    return close();
  }
  if (event.key !== 'Tab' || !panel.value) return;

  const items = [...panel.value.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !panel.value.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.modelValue, async (open) => {
  lockScroll(open);

  if (open) {
    returnFocusTo = typeof document !== 'undefined' ? document.activeElement : null;
    await nextTick();
    // The first field if there is one, so a dialog that asks for something is
    // ready to be typed into; otherwise the panel itself, never the confirm
    // button — landing on "Delete" invites the space bar.
    const field = panel.value?.querySelector('input,textarea,select');
    (field || panel.value)?.focus();
  } else {
    // Back where they were, or the page loses its place entirely.
    returnFocusTo?.focus?.();
    returnFocusTo = null;
  }
});

onBeforeUnmount(() => {
  if (props.modelValue) lockScroll(false);
});
</script>

<template>
  <Teleport to="body">
    <!--
      AI-TRAP: the leave state also turns off pointer events. A dialog is
      `fixed inset-0`, so if Vue never removes it — which happens when
      transitionend does not fire, as in a tab that is not compositing — the
      invisible overlay swallows every click on the page and the site looks
      frozen with nothing on screen to explain it.
    -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0 pointer-events-none"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 selection:bg-accent selection:text-on-accent"
        data-print="hide"
        @keydown="onKeydown"
      >
        <!-- The scrim stays dark in both themes: it sits over the page, not in it. -->
        <div
          class="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
          @click="dismissible && close()"
        />

        <!-- Ambient Modal Glow -->
        <div class="pointer-events-none absolute size-72 rounded-full bg-accent/10 blur-3xl" />

        <!-- Centered Card with Octava 2026 aesthetics -->
        <div
          ref="panel"
          role="dialog" aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
          tabindex="-1"
          class="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-line bg-panel/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 outline-none space-y-4"
        >
          <!-- Header with Icon and Title -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3.5">
              <!-- Icon badge based on tone or prop -->
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs"
                :class="danger
                  ? 'border-danger/30 bg-danger-soft text-danger'
                  : 'border-accent/30 bg-accent-soft text-accent'"
              >
                <Icon
                  :name="icon || (danger ? 'material-symbols:warning-rounded' : 'material-symbols:info-rounded')"
                  class="text-xl"
                />
              </div>

              <div>
                <h2 v-if="title" id="modal-title" class="text-base sm:text-lg font-bold tracking-tight text-ink">
                  {{ title }}
                </h2>
                <p v-if="description" class="mt-1 text-xs sm:text-sm leading-relaxed text-muted">
                  {{ description }}
                </p>
              </div>
            </div>

            <!-- Close Trigger -->
            <button
              v-if="dismissible"
              type="button"
              class="flex size-7 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors cursor-pointer outline-none shrink-0"
              title="Zatvori"
              @click="close()"
            >
              <Icon name="material-symbols:close-rounded" class="text-base" />
            </button>
          </div>

          <div v-if="$slots.default" class="text-xs sm:text-sm text-body">
            <slot />
          </div>

          <div class="pt-2 flex items-center justify-end gap-2.5">
            <slot name="actions">
              <button
                type="button" :disabled="busy"
                class="inline-flex items-center justify-center rounded-xl border border-line-soft bg-surface/80 px-4 py-2 text-xs sm:text-sm font-semibold text-muted hover:border-line hover:bg-surface hover:text-ink transition shadow-2xs disabled:opacity-40 cursor-pointer outline-none"
                @click="close()"
              >
                {{ cancelLabel || 'Odustani' }}
              </button>

              <button
                type="button" :disabled="busy || confirmDisabled"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition shadow-md disabled:opacity-40 cursor-pointer outline-none"
                :class="danger
                  ? 'bg-danger text-on-danger hover:opacity-95 shadow-danger/25 ring-1 ring-danger/30'
                  : 'bg-accent text-on-accent hover:opacity-95 shadow-accent/25 ring-1 ring-accent/30'"
                @click="confirm"
              >
                <Icon v-if="busy" name="svg-spinners:ring-resize" class="text-sm" />
                <span>{{ busy ? '…' : (confirmLabel || 'Potvrdi') }}</span>
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
