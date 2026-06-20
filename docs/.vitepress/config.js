import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '我的文档',
  description: '技术博客',
  base: '/VitePress/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' }
    ],
    sidebar: {
      '/guide/': [
        { text: '介绍', link: '/guide/' }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/OutisNemosseus/VitePress' }
    ]
  }
})
