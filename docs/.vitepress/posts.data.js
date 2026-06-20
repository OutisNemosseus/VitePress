import { createContentLoader } from 'vitepress'

// 在构建时扫描 docs/posts 下的所有 .md，收集标题/日期/标签
export default createContentLoader('posts/*.md', {
  transform(raw) {
    return raw
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title || url,
        url,
        date: frontmatter.date || '',
        tags: frontmatter.tags || []
      }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  }
})
