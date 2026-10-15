import type { CompositionResult } from './composer'
import type { SemanticVector } from './vectorizer'

export const isMobile = computed(() => {
  if (typeof navigator === 'undefined')
    return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

export const isDark = useDark()
export const toggleDark = useToggle(isDark)

export const inputState = reactive({
  text: '海上生明月，天涯共此时。情人怨遥夜，竟夕起相思。',
  selectedPoemId: 'moon',
  showInsight: false, // 默认折叠专业向量透镜，保持极致简洁
})

export type CreationMode = 'preset' | 'custom'
export const activeMode = ref<CreationMode>('preset')

export const currentVector = ref<SemanticVector | null>(null)
export const composition = ref<CompositionResult | null>(null)
export const selectedCategory = ref<'classical' | 'rnb' | 'jazz' | 'tiktok'>('classical')
export const loading = ref(false)

export const errorInfo = reactive({
  text: '',
})
