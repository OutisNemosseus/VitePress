---
title: Hello
date: 2026-06-20
tags:
  - C
  - 代码
source: hello.c
---

<script setup>
const code = "#include <stdio.h>\n\n/* A tiny C demo to verify Monaco IDE rendering. */\nint main(void) {\n    for (int i = 0; i < 3; i++) {\n        printf(\"Hello, TLPI! (%d)\\n\", i);\n    }\n    return 0;\n}\n"
</script>

# Hello

> 由 `source/hello.c` 自动生成 · C

<MonacoViewer :code="code" language="c" filename="hello.c" />
