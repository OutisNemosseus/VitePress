#!/usr/bin/env node
/**
 * Generate Docusaurus MDX documentation pages from TLPI source files
 * Uses iframe to embed Monaco Editor HTML pages
 *
 * Structure: docs/{category}/{slug}/index.mdx
 * This allows adding more .md files to each folder later
 */

const fs = require('fs');
const path = require('path');

const TLPI_DIR = path.join(__dirname, '..', 'tlpi-dist');
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const INBOX_DIR = path.join(__dirname, '..', 'Inbox');

const FILE_TYPES = {
  '.c': { label: 'C Source', lang: 'c' },
  '.h': { label: 'C Header', lang: 'c' },
  '.sh': { label: 'Shell Script', lang: 'bash' },
};

// Track all generated folders for inbox matching
const generatedFolders = new Map(); // slug -> { category, fullPath }

function generateMdx(filename, category, config, slug) {
  const iframeSrc = `/code-pages/${category}/${filename}.html`;

  return `---
sidebar_label: "${filename}"
title: "${filename}"
description: "${config.label} from ${category}"
---

# ${filename}

**Category:** \`${category}\` | **Type:** ${config.label}

<iframe
  src="${iframeSrc}"
  width="100%"
  height="700px"
  style={{border: '1px solid #333', borderRadius: '8px'}}
  title="${filename} - Monaco Editor"
/>

`;
}

function findFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  const files = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...findFiles(fullPath, baseDir));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (FILE_TYPES[ext]) {
          const relDir = path.relative(baseDir, dir);
          const slug = item.replace(/\./g, '-').toLowerCase();
          files.push({
            fullPath,
            filename: item,
            ext,
            category: (relDir || 'lib').replace(/\\/g, '/'),
            slug
          });
        }
      }
    }
  } catch (e) {
    console.error('Error reading directory:', e.message);
  }
  return files;
}

function generateSidebars(files) {
  const grouped = {};
  files.forEach(f => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  const categories = Object.keys(grouped).sort();

  const sidebarItems = categories.map(cat => {
    const catFiles = grouped[cat].sort((a, b) => a.filename.localeCompare(b.filename));
    return {
      type: 'category',
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
      items: catFiles.map(f => `${cat}/${f.slug}/index`)
    };
  });

  return `/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Scripts Documentation',
      collapsed: false,
      items: [
        'scripts/index',
        'scripts/generate-docs',
        'scripts/generate-tlpi-html',
        'scripts/inbox-guide',
        'scripts/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Source Code',
      collapsed: false,
      items: ${JSON.stringify(sidebarItems, null, 6).replace(/"/g, "'").replace(/\n/g, '\n    ')}
    }
  ],
};

module.exports = sidebars;
`;
}

function processInbox() {
  if (!fs.existsSync(INBOX_DIR)) {
    console.log('No Inbox folder found, skipping inbox processing.');
    return 0;
  }

  const inboxFiles = fs.readdirSync(INBOX_DIR).filter(f =>
    f.endsWith('.md') || f.endsWith('.mdx')
  );

  if (inboxFiles.length === 0) {
    console.log('Inbox is empty.');
    return 0;
  }

  console.log(`\nProcessing ${inboxFiles.length} inbox file(s)...`);
  let processed = 0;

  for (const file of inboxFiles) {
    // Extract the base name (e.g., "alt_functions" from "alt_functions.md")
    const baseName = file.replace(/\.(md|mdx)$/, '').toLowerCase();

    // Try to find a matching folder
    // Match patterns: exact match, or with -c, -h, -sh suffix
    let matchedFolder = null;

    for (const [slug, info] of generatedFolders) {
      // Check if the inbox file name matches the folder slug
      // e.g., "alt_functions" matches "alt_functions-c"
      if (slug === baseName || slug.startsWith(baseName + '-')) {
        matchedFolder = info;
        break;
      }
    }

    if (matchedFolder) {
      const srcPath = path.join(INBOX_DIR, file);
      const destPath = path.join(matchedFolder.fullPath, file);

      // Copy file to the matching folder
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Copied: ${file} -> ${matchedFolder.category}/${path.basename(matchedFolder.fullPath)}/`);
      processed++;
    } else {
      console.log(`  Skipped: ${file} (no matching folder found)`);
    }
  }

  return processed;
}

function main() {
  console.log('TLPI Docs Generator v2.0');
  console.log('========================\n');

  if (!fs.existsSync(TLPI_DIR)) {
    console.error('Error: tlpi-dist not found at', TLPI_DIR);
    process.exit(1);
  }

  // Create docs directory if needed (but don't clean - preserve existing files)
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  console.log('Scanning', TLPI_DIR, '...');
  const files = findFiles(TLPI_DIR);
  console.log('Found', files.length, 'source files\n');

  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const config = FILE_TYPES[file.ext];

      // Create folder for this file: docs/{category}/{slug}/
      const folderPath = path.join(DOCS_DIR, file.category, file.slug);
      const indexPath = path.join(folderPath, 'index.mdx');

      // Track this folder for inbox matching
      generatedFolders.set(file.slug, {
        category: file.category,
        fullPath: folderPath
      });

      // Only create/overwrite index.mdx if folder doesn't exist
      // This preserves any additional .md files added to the folder
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Always regenerate the index.mdx (source code view)
      const mdx = generateMdx(file.filename, file.category, config, file.slug);
      fs.writeFileSync(indexPath, mdx);
      generated++;
      console.log('Generated:', file.category + '/' + file.slug + '/index.mdx');
    } catch (err) {
      console.error('Error:', file.filename, '-', err.message);
    }
  }

  // Process inbox files
  const inboxProcessed = processInbox();

  // Generate sidebars.js
  console.log('\nGenerating sidebars.js...');
  const sidebarsContent = generateSidebars(files);
  fs.writeFileSync(path.join(__dirname, '..', 'sidebars.js'), sidebarsContent);

  console.log('\n========================');
  console.log(`Generated: ${generated} documentation folders`);
  console.log(`Inbox processed: ${inboxProcessed} file(s)`);
  console.log('Output:', DOCS_DIR);
}

main();
