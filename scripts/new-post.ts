/**
 * new-post.ts — Scaffold a new blog post with front matter template.
 *
 * Usage: npm run new:post
 * Prompts for title, category, and creates a new .md file in src/content/posts/
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";

const title = process.argv[2] || "Untitled Post";
const slug = slugify(title, { lower: true, strict: true });
const date = new Date().toISOString().split("T")[0];
const filePath = join(process.cwd(), "src", "content", "posts", `${slug}.md`);

const frontMatter = `---
title: "${title}"
date: ${date}
category: technical
description: ""
tags: []
published: false
---

Write your post here.
`;

writeFileSync(filePath, frontMatter, "utf-8");
console.log(`Created: src/content/posts/${slug}.md`);
