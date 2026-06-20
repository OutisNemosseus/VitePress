# source/

把你的 `.py` 或 `.java` 源文件放进这个文件夹。

每次运行 `npm run docs:dev` / `npm run docs:build`（或推送到 GitHub），
都会自动在 `docs/posts/` 下生成对应的文章，并用 Monaco（VS Code 内核）
以 IDE 风格渲染代码。

- 文件名 `quicksort.py` → 文章标题 “Quicksort”，链接 `/posts/quicksort`
- 标签自动加上语言名（Python / Java）和 “代码”
- 想加更多语言：编辑 `scripts/generate-posts.mjs` 里的 `LANG` 映射
