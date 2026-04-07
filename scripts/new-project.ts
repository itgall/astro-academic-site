/**
 * new-project.ts — Scaffold a new project entry.
 *
 * Usage: npm run new:project
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";

const title = process.argv[2] || "Untitled Project";
const slug = slugify(title, { lower: true, strict: true });
const filePath = join(process.cwd(), "src", "content", "projects", `${slug}.md`);

const frontMatter = `---
title: "${title}"
number: "99"
date: ${new Date().toISOString().split("T")[0]}
tags: []
institution: ""
contentMode: structured
techStack: []
published: false
---

Project description here.
`;

writeFileSync(filePath, frontMatter, "utf-8");
console.log(`Created: src/content/projects/${slug}.md`);
