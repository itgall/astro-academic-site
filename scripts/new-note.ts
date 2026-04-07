/**
 * new-note.ts — Scaffold a new digital garden note.
 *
 * Usage: npm run new:note
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";

const title = process.argv[2] || "Untitled Note";
const slug = slugify(title, { lower: true, strict: true });
const filePath = join(process.cwd(), "src", "content", "notes", `${slug}.md`);

const frontMatter = `---
title: "${title}"
date: ${new Date().toISOString().split("T")[0]}
maturity: seedling
description: ""
tags: []
published: false
---

Note content here.
`;

writeFileSync(filePath, frontMatter, "utf-8");
console.log(`Created: src/content/notes/${slug}.md`);
