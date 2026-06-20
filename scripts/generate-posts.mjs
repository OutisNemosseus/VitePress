// 扫描 source/ 下的源文件，按语言分类生成 docs/posts/<语言>/ 下的文章，
// 每篇用 Monaco（VS Code 内核）以 IDE 风格渲染代码，并自动生成分组侧边栏。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(root, 'source')
const DOCS_DIR = path.join(root, 'docs')
const POSTS_DIR = path.join(DOCS_DIR, 'posts')
const SIDEBAR_FILE = path.join(DOCS_DIR, '.vitepress', 'generated-sidebar.json')

// 扩展名 → { Monaco 语言 id, 标签名, 子目录, 分类名 }
const LANG = {
  '.py': { language: 'python', label: 'Python', dir: 'python', category: 'Python' },
  '.java': { language: 'java', label: 'Java', dir: 'java', category: 'Java' },
  '.c': { language: 'c', label: 'C', dir: 'c', category: 'C' },
  '.h': { language: 'c', label: 'C', dir: 'c', category: 'C' },
  '.cpp': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.cc': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.cxx': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.hpp': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' }
}

// 子目录 → 侧边栏分类名（手写文章在根目录，归到“随笔”）
const DIR_CATEGORY = { python: 'Python', java: 'Java', c: 'C', cpp: 'C++' }
const CATEGORY_ORDER = ['Python', 'Java', 'C', 'C++', '随笔']

const pad = n => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const prettify = name =>
  name.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const slugify = name =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// 递归列出某目录下所有 .md
function walkMd(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMd(full))
    else if (entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

fs.mkdirSync(SOURCE_DIR, { recursive: true })
fs.mkdirSync(POSTS_DIR, { recursive: true })

// 1) 清理上一次自动生成的文章（带 source: frontmatter 的才删，手写文章不动）
for (const md of walkMd(POSTS_DIR)) {
  const txt = fs.readFileSync(md, 'utf8')
  if (/^source:\s*/m.test(txt)) fs.rmSync(md)
}

// 2) 从 source/ 生成文章，按语言分目录
const files = fs
  .readdirSync(SOURCE_DIR)
  .filter(f => LANG[path.extname(f).toLowerCase()])

const usedSlugs = new Set()
let count = 0
for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const { language, label, dir } = LANG[ext]
  const base = path.basename(file, ext)

  let slug = slugify(base)
  if (usedSlugs.has(`${dir}/${slug}`)) slug = `${slug}-${ext.slice(1)}`
  usedSlugs.add(`${dir}/${slug}`)

  const outDir = path.join(POSTS_DIR, dir)
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${slug}.md`)

  const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8')

  // 已存在则沿用原日期（清理那步已删除，所以这里基本都是新日期；保留逻辑以防手动保留）
  let date = today()

  const codeLiteral = JSON.stringify(content).replace(/<\/script>/gi, '<\\/script>')

  const md = `---
title: ${prettify(base)}
date: ${date}
tags:
  - ${label}
  - 代码
source: ${file}
---

<script setup>
const code = ${codeLiteral}
</script>

# ${prettify(base)}

> 由 \`source/${file}\` 自动生成 · ${label}

<MonacoViewer :code="code" language="${language}" filename="${file}" />
`

  fs.writeFileSync(outPath, md, 'utf8')
  count++
  console.log(`✓ ${file} → docs/posts/${dir}/${slug}.md`)
}

// 3) 扫描所有文章，按分类生成侧边栏
const groups = {}
for (const md of walkMd(POSTS_DIR)) {
  const rel = path.relative(POSTS_DIR, md).split(path.sep)
  const topDir = rel.length > 1 ? rel[0] : ''
  const category = DIR_CATEGORY[topDir] || '随笔'

  const txt = fs.readFileSync(md, 'utf8')
  const m = txt.match(/^title:\s*["']?(.+?)["']?\s*$/m)
  const title = m ? m[1] : path.basename(md, '.md')

  // VitePress 链接：相对 docs 的路径，去掉 .md，正斜杠
  const link = '/' + path.relative(DOCS_DIR, md).replace(/\\/g, '/').replace(/\.md$/, '')

  ;(groups[category] ||= []).push({ text: title, link })
}

const sidebar = CATEGORY_ORDER.filter(c => groups[c]).map(c => ({
  text: c,
  collapsed: false,
  items: groups[c].sort((a, b) => a.text.localeCompare(b.text))
}))

fs.mkdirSync(path.dirname(SIDEBAR_FILE), { recursive: true })
fs.writeFileSync(SIDEBAR_FILE, JSON.stringify(sidebar, null, 2), 'utf8')

console.log(`\nGenerated ${count} post(s); sidebar groups: ${sidebar.map(g => g.text).join(', ') || '(none)'}`)
