// 扫描 source/ 下的 .py / .java 源文件，自动生成 docs/posts/ 下的文章。
// 每篇文章用 Monaco（VS Code 内核）以 IDE 风格渲染代码。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(root, 'source')
const POSTS_DIR = path.join(root, 'docs', 'posts')

// 支持的语言映射：扩展名 → { Monaco 语言 id, 标签名 }
const LANG = {
  '.py': { language: 'python', label: 'Python' },
  '.java': { language: 'java', label: 'Java' }
}

const pad = n => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const prettify = name =>
  name.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const slugify = name =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

fs.mkdirSync(SOURCE_DIR, { recursive: true })
fs.mkdirSync(POSTS_DIR, { recursive: true })

const files = fs
  .readdirSync(SOURCE_DIR)
  .filter(f => LANG[path.extname(f).toLowerCase()])

let count = 0
for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const { language, label } = LANG[ext]
  const base = path.basename(file, ext)
  const slug = slugify(base)
  const outPath = path.join(POSTS_DIR, `${slug}.md`)

  const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8')

  // 已存在则沿用原日期，避免每次重建日期都变
  let date = today()
  if (fs.existsSync(outPath)) {
    const m = fs.readFileSync(outPath, 'utf8').match(/^date:\s*(.+)$/m)
    if (m) date = m[1].trim()
  }

  // JSON.stringify 得到安全的 JS 字符串字面量；再中和 </script> 防止提前闭合
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
  console.log(`✓ ${file} → docs/posts/${slug}.md`)
}

console.log(`\nGenerated ${count} post(s) from source/`)
