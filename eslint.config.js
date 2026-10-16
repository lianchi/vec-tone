import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  formatters: {
    markdown: false,
  },
  rules: {
    'vue/block-order': [
      'error',
      {
        order: [['script', 'template'], 'style'],
      },
    ],
    'node/prefer-global/process': 'off',
    'antfu/consistent-list-newline': 'off',
    'no-console': 'warn',
    'no-alert': 'warn',
  },
})
