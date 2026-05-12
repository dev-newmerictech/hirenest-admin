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
 *   OPENAI_API_KEY or OPENROUTER_API_KEY — API key for generation
 *   NEXT_PUBLIC_CONVEX_URL               — Convex deployment URL
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Constants & Configuration ───────────────────────────────────────────────

const DEFAULT_POST_COUNT = 15;
const DELAY_BETWEEN_POSTS_MS = 3_000; // 3 seconds between posts
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.5-flash"; // Free tier model on OpenRouter
const OPENAI_MODEL = "gpt-4o-mini"; // Cost-effective fast model on OpenAI
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
  authorName?: string;
}

// ─── Topic Generation ────────────────────────────────────────────────────────

const TOPIC_CATEGORIES = [
  "AI and automation platforms in recruitment",
  "Next-generation HR technology and software stacks",
  "Modern software tools shaping hybrid and remote work environments",
  "Predictive analytics and data-driven talent acquisition",
  "Digital upskilling and future-proofing tech careers",
  "Leveraging artificial intelligence for automated candidate screening",
  "Cloud-based workspace platforms and digital collaboration tech",
  "Skill-based tech assessment platforms vs traditional credentialing",
  "Optimizing recruitment pipelines with machine learning algorithms",
  "Cybersecurity and privacy considerations in HR software systems",
  "Emerging developer tools and impact on tech hiring strategies",
  "Tech enterprise strategies for integrating AI assistants in workflows",
  "Automated scheduling and onboarding software platforms",
  "Evaluating code analysis tools for tech talent assessment",
  "Digital platforms driving the modern gig economy and distributed teams",
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

  // Include a shifting random seed to ensure completely fresh outputs day after day
  const randomSeed = Math.random().toString(36).substring(2, 8);

  const prompt = `You are a content strategist for Hirenest, an AI-powered job platform that connects job seekers with employers.

Today is ${today}. Generation Seed Context: [${randomSeed}]

Generate exactly ${count} unique, specific, and trending blog post titles. Each title should be:
- Highly specific (not generic like "tips for interviews")
- Completely fresh and distinct from any typical standard articles you generate
- Timely and relevant to current industry trends in ${new Date().getFullYear()}
- SEO-friendly and compelling to click
- Covering different aspects of: ${selectedCategories.join(", ")}

Return ONLY a JSON array of strings, with no other text, markdown, or explanation. Example:
["Title One Here", "Title Two Here"]`;

  const response = await callAI(apiKey, prompt, 0.9);

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

  const prompt = `You are a Principal Tech Lead and veteran technical systems architect writing authoritative content for Hirenest (hirenest.ai), an advanced platform connecting elite tech talent with cutting-edge engineering organizations.

Write a deeply comprehensive, highly granular, SEO-optimized technical blog post about: "${topic}"

STRICT EDITORIAL & GOOGLE SEO REQUIREMENTS:
1. Target Length: 2000-2500 words. Provide deep technical walkthroughs, concrete architectural trade-offs, framework comparisons, and real-world engineering workflow breakdowns.
2. Human-First Tone (Google E-E-A-T Compliant): Write with high burstiness and varied sentence structures. Interleave short, punchy statements with deep analytical breakdowns. Avoid robotic symmetry. Use active voice and sound like a seasoned engineering leader mentoring a team.
3. FORBIDDEN AI CLICHÉS: Absolutely DO NOT use classic AI detection triggers such as: "delve into", "tapestry", "testament", "crucial", "paramount", "supercharge", "it's important to note", "moreover", "ultimately", or generic summations like "in conclusion" or "in summary".
4. Formatting & Structure:
   - Start immediately with a sharp, engaging hook and technical introduction (do not label it with a heading)
   - Use ## for main conceptual sections (4-6 comprehensive sections)
   - Use ### for granular architectural deep-dives, specific tool integrations, real-world failure scenarios, or comparative matrices
   - Incorporate actionable insights, bolded key takeaways, and numbered bullet lists to maximize scannability for human developers
   - Conclude naturally by synthesizing core architectural impacts alongside a seamless, helpful reference to Hirenest's talent mapping platform
5. Context: Reference current year (${new Date().getFullYear()}) software methodologies, cloud infrastructure paradigms, and technology ecosystems.
6. Absolute Exclusions: DO NOT output markdown headers/frontmatter. DO NOT repeat the post title as an H1 inside the body text.

Also provide the following metadata in a JSON block at the VERY END of your response, after all the blog content:

%%%METADATA%%%
{
  "description": "A 150-160 character technical SEO meta description summarizing the stack or platform insights",
  "readTime": "8 min read"
}
%%%END_METADATA%%%`;

  const response = await callAI(apiKey, prompt, 0.7);

  // Extract metadata from the response
  let description = "";
  let readTime = "8 min read";
  let content = response;

  const metadataMatch = response.match(
    /%%%METADATA%%%([\s\S]*?)%%%END_METADATA%%%/
  );
  if (metadataMatch) {
    content = response.replace(/%%%METADATA%%%[\s\S]*?%%%END_METADATA%%%/, "").trim();
    try {
      const metadata = JSON.parse(metadataMatch[1].trim());
      description = metadata.description || "";
      readTime = metadata.readTime || "8 min read";
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
    description: description || `Deep dive into ${topic} with authoritative engineering insights on Hirenest.`,
    content: fullContent,
    date: today,
    published: true,
    tags: [], // Intentionally empty to prevent clickable UI tags
    readTime,
    // authorName intentionally omitted to prevent clickable author routing / 404s
  };

  log(`    ✓ Generated (${post.content.length} chars)`, "green");
  return post;
}

// ─── AI API Client ───────────────────────────────────────────────────────────

async function callAI(
  apiKey: string,
  prompt: string,
  temperature: number = 0.7
): Promise<string> {
  const isOpenRouter = apiKey.startsWith("sk-or-");
  const apiUrl = isOpenRouter ? OPENROUTER_API_URL : OPENAI_API_URL;
  const model = isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (isOpenRouter) {
    headers["HTTP-Referer"] = "https://hirenest.ai";
    headers["X-Title"] = "Hirenest Auto-Blogger";
  }

  const bodyPayload: any = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
  };

  if (isOpenRouter) {
    bodyPayload.max_tokens = 4096;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `${isOpenRouter ? "OpenRouter" : "OpenAI"} API error (${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error(`Empty response from ${isOpenRouter ? "OpenRouter" : "OpenAI"}`);
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
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey) {
    log("Error: OPENAI_API_KEY or OPENROUTER_API_KEY environment variable is not set", "red");
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

  const isOpenRouter = apiKey.startsWith("sk-or-");
  const displayModel = isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL;

  log(`Configuration:`, "cyan");
  log(`  Posts to generate: ${postCount}`, "gray");
  log(`  AI Model:          ${displayModel}`, "gray");
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
