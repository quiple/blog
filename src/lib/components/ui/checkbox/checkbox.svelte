<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import MinusIcon from '@lucide/svelte/icons/minus'
  import type {WithElementRef} from '$lib/utils.js'
  import {cn} from 'cn'
  import type {HTMLInputAttributes} from 'svelte/elements'

  type CheckboxProps = Omit<
    WithElementRef<HTMLInputAttributes, HTMLInputElement>,
    'type' | 'children' | 'checked' | 'indeterminate'
  > & {
    checked?: boolean
    indeterminate?: boolean
  }

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    ...restProps
  }: CheckboxProps = $props()
</script>

<span
  data-slot="checkbox"
  data-checked={checked || indeterminate ? '' : undefined}
  class={cn(
    'relative grid size-4 shrink-0 place-content-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-[input[aria-invalid=true]]:border-destructive/50 dark:has-[input[aria-invalid=true]]:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary',
    className,
  )}
>
  <input
    bind:this={ref}
    type="checkbox"
    class="peer absolute -inset-x-3 -inset-y-2 m-0 cursor-pointer appearance-none disabled:cursor-not-allowed"
    bind:checked
    bind:indeterminate
    {...restProps}
  />
  <span
    data-slot="checkbox-indicator"
    class="pointer-events-none grid place-content-center text-current transition-none [&>svg]:size-3.5"
    aria-hidden="true"
  >
    {#if checked}
      <CheckIcon />
    {:else if indeterminate}
      <MinusIcon />
    {/if}
  </span>
</span>
