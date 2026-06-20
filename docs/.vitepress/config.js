import { defineConfig } from 'vitepress'
import fs from 'node:fs'

// 由 scripts/generate-posts.mjs 自动生成的、按语言分组的文章侧边栏
let postsSidebar = []
try {
  postsSidebar = JSON.parse(
    fs.readFileSync(new URL('./generated-sidebar.json', import.meta.url), 'utf8')
  )
} catch {}

export default defineConfig({
  title: '我的文档',
  description: '技术博客',
  base: '/VitePress/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: '文章', link: '/posts/python/monotonic-stack' },
      { text: '标签', link: '/tags' }
    ],
    sidebar: {
      '/guide/': [
        { text: '介绍', link: '/guide/' }
      ],
      '/posts/': postsSidebar
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/OutisNemosseus/VitePress' }
    ]
  }
})
