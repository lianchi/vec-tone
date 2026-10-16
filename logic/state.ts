import type { CompositionResult, MusicCategory } from './composer'
import type { SemanticVector } from './vectorizer'

export const isDark = useDark()
export const toggleDark = useToggle(isDark)

export const currentVector = ref<SemanticVector | null>(null)
export const composition = ref<CompositionResult | null>(null)
export const selectedCategory = ref<MusicCategory>('classical')
export const loading = ref(false)

export const errorInfo = reactive({
  text: '',
})
