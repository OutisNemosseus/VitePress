import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '我的文档',
  description: '技术博客',
  base: '/VitePress/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '文章', link: '/posts/monotonic-stack' },
      { text: '标签', link: '/tags' }
    ],
    sidebar: {
      '/guide/': [
        { text: '介绍', link: '/guide/' }
      ],
      '/posts/': [
        {
          text: '文章',
          items: [
            { text: '单调栈 · 接雨水', link: '/posts/monotonic-stack' },
            { text: '策略模式', link: '/posts/design-pattern-strategy' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/OutisNemosseus/VitePress' }
    ]
  }
})
