export interface Tab<T extends string = string> {
  value: T
  label: string
  icon?: string
  [key: string]: any
}

export function useUrlQuery<T extends string = string>(tabs: Ref<Tab<T>[]> | Tab<T>[]) {
  const urlParams: any = useUrlSearchParams('history')
  const tabsRef = ref(tabs) as Ref<Tab<T>[]>

  function defaultTab(): T {
    const c = urlParams.tab as T | undefined
    if (c && tabsRef.value.some(u => u.value === c))
      return c

    const firstTab = (tabsRef.value[0]?.value ?? 'poetry') as T
    urlParams.tab = firstTab
    return firstTab
  }

  const activeTab = ref<T>(defaultTab()) as Ref<T>

  watch(activeTab, (v) => {
    urlParams.tab = v
  })

  return {
    activeTab,
  }
}
