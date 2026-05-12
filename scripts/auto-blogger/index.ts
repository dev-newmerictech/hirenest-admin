/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Hirenest Auto-Blogger — Automated Daily Blog Generation & Publishing
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This script:
 *   1. Generates trending topics related to hiring, recruitment, and careers
 *   2. Writes full blog posts using OpenRouter API (Gemini 2.5 Flash — free)
 *   3. Publishes each post directly to the Convex database
 *
 * Usage:
 *   npx tsx scripts/auto-blogger/index.ts
 *   npx tsx scripts/auto-blogger/index.ts --dry-run   (generate but don't publish)
 *   npx tsx scripts/auto-blogger/index.ts --count 5   (override post count)
 *
 * Required Environment Variables:
 *   OPENROUTER_API_KEY       — OpenRouter API key
 *   NEXT_PUBLIC_CONVEX_URL   — Convex deployment URL
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Constants & Configuration ───────────────────────────────────────────────

const DEFAULT_POST_COUNT = 15;
const DELAY_BETWEEN_POSTS_MS = 3_000; // 3 seconds between posts
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash"; // Free tier model on OpenRouter
const MAX_RETRIES = 2;

// ─── Terminal Colors ─────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
} as const;

function log(msg: string, color: keyof typeof C = "reset") {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`${C.gray}[${timestamp}]${C.reset} ${C[color]}${msg}${C.reset}`);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  published: boolean;
  tags: string[];
  readTime: string;
  authorName: string;
}

// ─── Topic Generation ────────────────────────────────────────────────────────

const TOPIC_CATEGORIES = [
  "AI and automation in recruitment",
  "Remote work and hybrid workplace trends",
  "Employee retention strategies",
  "Interview tips for job seekers",
  "Resume building and optimization",
  "Workplace diversity and inclusion",
  "Salary negotiation techniques",
  "Employer branding and talent acquisition",
  "Gig economy and freelancing trends",
  "Upskilling and career development",
  "HR technology and tools",
  "Job market trends and predictions",
  "Work-life balance strategies",
  "Company culture and employee engagement",
  "Startup hiring challenges and solutions",
  "Campus recruitment and fresher hiring",
  "Skill-based hiring vs degree-based hiring",
  "The future of work and Gen Z workforce",
  "Performance management best practices",
  "Employee mental health and wellbeing",
];

/**
 * Generate a list of blog topics using AI for today's posts.
 */
async function generateTopics(
  apiKey: string,
  count: number
): Promise<string[]> {
  log(`Generating ${count} blog topics...`, "cyan");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pick random categories to ensure variety
  const shuffled = [...TOPIC_CATEGORIES].sort(() => Math.random() - 0.5);
  const selectedCategories = shuffled.slice(0, Math.min(count, shuffled.length));

  const prompt = `You are a content strategist for Hirenest, an AI-powered job platform that connects job seekers with employers.

Today is ${today}.

Generate exactly ${count} unique, specific, and trending blog post titles. Each title should be:
- Highly specific (not generic like "tips for interviews")
- Timely and relevant to current industry trends in ${new Date().getFullYear()}
- SEO-friendly and compelling to click
- Covering different aspects of: ${selectedCategories.join(", ")}

Return ONLY a JSON array of strings, with no other text, markdown, or explanation. Example:
["Title One Here", "Title Two Here"]`;

  const response = await callOpenRouter(apiKey, prompt, 0.9);

  try {
    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in AI response");
    }
    const topics: string[] = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("Invalid topics array");
    }

    log(`✓ Generated ${topics.length} topics`, "green");
    return topics.slice(0, count);
  } catch (err) {
    log(`Failed to parse topics, using fallback generation`, "yellow");
    // Fallback: generate topics from category names
    return selectedCategories.slice(0, count).map(
      (cat) => `${cat.charAt(0).toUpperCase() + cat.slice(1)}: What You Need to Know in ${new Date().getFullYear()}`
    );
  }
}

/**
 * Generate a full blog post for a given topic.
 */
async function generateBlogPost(
  apiKey: string,
  topic: string,
  index: number
): Promise<BlogPost> {
  log(`  [${index + 1}] Writing: "${topic}"...`, "blue");

  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are an expert content writer for Hirenest (hirenest.ai), an AI-powered platform connecting job seekers with employers.

Write a comprehensive, SEO-optimized blog post about: "${topic}"

STRICT REQUIREMENTS:
1. Length: 1200-2000 words
2. Tone: Professional but approachable, data-driven where possible
3. Structure:
   - Start with a compelling introduction (no heading for intro)
   - Use ## for main section headings (3-5 sections)
   - Use ### for subsection headings where appropriate
   - Include bullet points and numbered lists where relevant
   - End with a conclusion section and a subtle call-to-action mentioning Hirenest
4. Include practical, actionable advice
5. Reference current year (${new Date().getFullYear()}) trends where appropriate
6. DO NOT use any frontmatter or metadata — just the raw markdown content
7. DO NOT start with the title as a heading — I will add it separately

Also provide the following metadata in a JSON block at the VERY END of your response, after all the blog content:

%%%METADATA%%%
{
  "description": "A 150-160 character SEO meta description for this post",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "readTime": "X min read"
}
%%%END_METADATA%%%`;

  const response = await callOpenRouter(apiKey, prompt, 0.7);

  // Extract metadata from the response
  let description = "";
  let tags: string[] = [];
  let readTime = "5 min read";
  let content = response;

  const metadataMatch = response.match(
    /%%%METADATA%%%([\s\S]*?)%%%END_METADATA%%%/
  );
  if (metadataMatch) {
    content = response.replace(/%%%METADATA%%%[\s\S]*?%%%END_METADATA%%%/, "").trim();
    try {
      const metadata = JSON.parse(metadataMatch[1].trim());
      description = metadata.description || "";
      tags = Array.isArray(metadata.tags) ? metadata.tags : [];
      readTime = metadata.readTime || "5 min read";
    } catch {
      log(`    ⚠ Could not parse metadata, using defaults`, "yellow");
    }
  }

  // Generate a URL-friendly slug from the title
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80)
    .replace(/-$/, "");

  // Prepend the title as an H1 heading to the content
  const fullContent = `# ${topic}\n\n${content}`;

  const post: BlogPost = {
    slug,
    title: topic,
    description: description || `Learn about ${topic} and discover actionable insights on Hirenest.`,
    content: fullContent,
    date: today,
    published: true,
    tags,
    readTime,
    authorName: "Hirenest Team",
  };

  log(`    ✓ Generated (${post.content.length} chars, ${post.tags.length} tags)`, "green");
  return post;
}

// ─── OpenRouter API Client ───────────────────────────────────────────────────

async function callOpenRouter(
  apiKey: string,
  prompt: string,
  temperature: number = 0.7
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://hirenest.ai",
          "X-Title": "Hirenest Auto-Blogger",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenRouter API error (${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error("Empty response from OpenRouter");
      }

      return text;
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        log(
          `    ⚠ API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}`,
          "yellow"
        );
        // Exponential backoff
        await sleep(2000 * (attempt + 1));
      } else {
        throw err;
      }
    }
  }

  throw new Error("All retry attempts exhausted");
}

// ─── Convex Publisher ────────────────────────────────────────────────────────

/**
 * Publish a blog post to the Convex database.
 *
 * Uses the Convex HTTP API directly (no SDK dependency needed).
 * The createOrUpdatePost mutation has no server-side auth check —
 * it relies on Supabase auth at the dashboard route level, so we can
 * call it directly from a script using the HTTP API.
 */
async function publishToConvex(
  convexUrl: string,
  post: BlogPost
): Promise<boolean> {
  try {
    // Convex HTTP API endpoint for mutations
    // Format: POST https://<deployment>.convex.cloud/api/mutation
    const apiUrl = convexUrl.replace(/\/$/, "") + "/api/mutation";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "posts:createOrUpdatePost",
        args: {
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          date: post.date,
          published: post.published,
          tags: post.tags,
          readTime: post.readTime,
          authorName: post.authorName,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Convex API error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();

    if (result.status === "error") {
      throw new Error(`Convex mutation error: ${result.errorMessage || JSON.stringify(result)}`);
    }

    return true;
  } catch (err: any) {
    log(`    ✗ Publish failed: ${err.message}`, "red");
    return false;
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printSummary(
  results: { topic: string; success: boolean }[],
  startTime: number
) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("");
  log("═══════════════════════════════════════════════════", "bold");
  log("           AUTO-BLOGGER EXECUTION SUMMARY          ", "bold");
  log("═══════════════════════════════════════════════════", "bold");
  console.log("");
  log(`  Total Posts Attempted:  ${results.length}`, "blue");
  log(`  Successfully Published: ${succeeded}`, "green");
  if (failed > 0) {
    log(`  Failed:                 ${failed}`, "red");
  }
  log(`  Total Time:             ${elapsed}s`, "cyan");
  console.log("");

  if (failed > 0) {
    log("  Failed Posts:", "red");
    results
      .filter((r) => !r.success)
      .forEach((r) => log(`    • ${r.topic}`, "red"));
    console.log("");
  }

  log("═══════════════════════════════════════════════════", "bold");
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

async function main() {
  console.log("");
  log("═══════════════════════════════════════════════════", "bold");
  log("     🚀 HIRENEST AUTO-BLOGGER — Starting Run       ", "magenta");
  log("═══════════════════════════════════════════════════", "bold");
  console.log("");

  // ── Parse CLI Arguments ──
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const countArgIdx = args.indexOf("--count");
  const postCount =
    countArgIdx >= 0 ? parseInt(args[countArgIdx + 1], 10) : DEFAULT_POST_COUNT;

  if (isNaN(postCount) || postCount < 1 || postCount > 30) {
    log("Error: --count must be between 1 and 30", "red");
    process.exit(1);
  }

  // ── Validate Environment ──
  const apiKey = process.env.OPENROUTER_API_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey) {
    log("Error: OPENROUTER_API_KEY environment variable is not set", "red");
    log("Set it in your .env file or GitHub Actions secrets", "yellow");
    process.exit(1);
  }

  if (!convexUrl && !dryRun) {
    log(
      "Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set",
      "red"
    );
    log("Set it in your .env file or GitHub Actions secrets", "yellow");
    process.exit(1);
  }

  log(`Configuration:`, "cyan");
  log(`  Posts to generate: ${postCount}`, "gray");
  log(`  AI Model:          ${AI_MODEL}`, "gray");
  log(`  Mode:              ${dryRun ? "DRY RUN (no publishing)" : "LIVE"}`, dryRun ? "yellow" : "green");
  log(`  Convex URL:        ${convexUrl ? convexUrl.substring(0, 40) + "..." : "N/A"}`, "gray");
  console.log("");

  const startTime = Date.now();

  // ── Step 1: Generate Topics ──
  const topics = await generateTopics(apiKey, postCount);
  console.log("");
  log("Topics to write:", "cyan");
  topics.forEach((t, i) => log(`  ${i + 1}. ${t}`, "gray"));
  console.log("");

  // ── Step 2: Generate & Publish Posts ──
  const results: { topic: string; success: boolean }[] = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];

    try {
      // Generate the blog post
      const post = await generateBlogPost(apiKey, topic, i);

      if (dryRun) {
        log(`    [DRY RUN] Would publish: "${post.slug}"`, "yellow");
        results.push({ topic, success: true });
      } else {
        // Publish to Convex
        log(`    Publishing to Convex...`, "gray");
        const success = await publishToConvex(convexUrl!, post);

        if (success) {
          log(`    ✓ Published: /blog/${post.slug}`, "green");
        }

        results.push({ topic, success });
      }
    } catch (err: any) {
      log(`  ✗ Failed: "${topic}" — ${err.message}`, "red");
      results.push({ topic, success: false });
    }

    // Delay between posts to avoid rate limiting
    if (i < topics.length - 1) {
      log(`    ⏳ Waiting ${DELAY_BETWEEN_POSTS_MS / 1000}s before next post...`, "gray");
      await sleep(DELAY_BETWEEN_POSTS_MS);
    }
  }

  // ── Step 3: Print Summary ──
  printSummary(results, startTime);

  // Exit with error code if any posts failed
  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0 && !dryRun) {
    process.exit(1);
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  log(`Fatal error: ${err.message}`, "red");
  console.error(err);
  process.exit(1);
});
