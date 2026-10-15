import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    {
      'flex-center': 'flex items-center justify-center',
      'bg-ink': 'bg-white dark:bg-black',
      'bg-base': 'bg-#f2f4f6 dark:bg-dark-900',
      'bg-secondary': 'bg-light-500 dark:bg-dark-300',
      'bg-active': 'bg-light-700 dark:bg-dark-100',
      'border-base': 'border-light-900 dark:border-dark-300',
      'border-box': 'border border-base rounded',
      'text-button': 'border-box bg-secondary hover:bg-active px3 py1 flex gap-1 items-center justify-center',
      'text-button-bg': 'rounded text-white hover:op85 px3 py2 flex-center gap-1',
      'icon-button': 'border-box border-0 op-40 hover:op-80 p1',
      'icon-button-sm': 'icon-button p0.5 text-sm',
      'color-base': 'text-gray-900 dark:text-gray-300',
      'color-gray': 'text-gray-900:70 dark:text-gray-300:70',
      'color-fade': 'text-gray-500:50 dark:text-gray-400:50',
      'a-primary': 'text-primary hover:text-primary/80 cursor-pointer',
      'a-error': 'hover:text-red-400/80 cursor-pointer',
      'glass-effect': 'backdrop-blur-6 bg-white/80 dark:bg-[#151515]/60',
      'primary-tip': 'bg-primary:10 text-primary border-current',
      'blue-tip': 'bg-blue-500:10 text-blue border-current',
      'green-tip': 'bg-green-500:10 text-green border-current',
      'orange-tip': 'bg-orange-500:10 text-orange border-current',
      'yellow-tip': 'bg-yellow-500:10 text-yellow-5 border-current',
      'purple-tip': 'bg-violet-500:10 text-violet border-current',
      'red-tip': 'bg-red-500:10 text-red border-current',
    },
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        ph: () => import('@iconify-json/ph/icons.json').then(i => i.default as any),
      },
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  theme: {
    colors: {
      primary: '#0d9488',
    },
  },
})
