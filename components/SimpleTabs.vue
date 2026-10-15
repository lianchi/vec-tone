<template>
  <fieldset
    class="flex-inline flex-wrap items-center border rounded-md border-base bg-ink"
    :class="[divide ? '' : 'p-0.25em gap-1', blocked ? 'w-full' : '']"
  >
    <label
      v-for="i, idx of options"
      :key="i.label"
      :disabled="disabled"
      class="relative flex-center flex-nowrap px-2 py-1 border-base hover:bg-secondary"
      :class="[
        (divide && idx) ? 'border-l border-base ml--1px' : '',
        (divide && idx === 0) ? 'rounded-l' : '',
        (divide && idx === options.length - 1) ? 'rounded-r' : '',
        divide ? '' : 'rounded',
        i.value === input ? ' text-primary !bg-primary/15' : '',
        disabled ? 'disabled' : '',
        blocked ? 'flex-1' : '',
      ]"
    >
      <div :class="[i.value === input ? '' : 'op50']" class="flex items-center gap-1">
        <div v-if="i.icon" :class="i.icon" />
        <span>{{ i.label }}</span>
      </div>
      <input
        v-model="input"
        type="radio"
        :disabled="disabled"
        :value="i.value"
        :title="i.label"
        class="absolute inset-0 cursor-pointer opacity-0"
      >
    </label>
  </fieldset>
</template>

<script setup lang="ts" generic="T extends string | number = string">
export interface Option<V = any> {
  value: V
  label: string
  icon?: string
}

defineProps<{
  blocked?: boolean
  disabled?: boolean
  divide?: boolean
  options: Option<T>[]
}>()

const input = defineModel<T>('modelValue')
</script>
