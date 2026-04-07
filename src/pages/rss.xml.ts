/**
 * rss.xml.ts — RSS feed generator.
 *
 * Generates an RSS 2.0 feed from all published blog posts.
 */
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { siteMetadata } from "@data/meta";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts", ({ data }: { data: { published: boolean } }) => data.published);

  const sortedPosts = [...posts].sort(
    (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
      b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: siteMetadata.title,
    description: siteMetadata.description,
    site: context.site?.toString() ?? siteMetadata.siteUrl,
    items: sortedPosts.map((post: { id: string; data: { title: string; date: Date; description: string; tags: string[] } }) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>${siteMetadata.language}</language>`,
  });
}
