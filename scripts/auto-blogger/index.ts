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
const OPENROUTER_MODEL = "google/gemma-3-27b-it:free"; // FREE model on OpenRouter — $0 cost
const OPENAI_MODEL = "gpt-4o-mini"; // Fallback if no OpenRouter key
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
  "Breaking technology news and shifting developer platform paradigms",
  "Latest software engineering trends and modern infrastructure updates",
  "Cutting-edge enterprise strategies for AI integrations and agentic workflows",
  "Tech hiring surges, industry restructuring, and evolving developer job markets",
  "Next-generation digital workspace platforms and remote software tools",
  "Major cloud infrastructure releases and impact on modern scalable architectures",
  "Developer productivity tools, code intelligence platforms, and ecosystem news",
  "Evolving skill demands in software engineering and state-of-the-art tech roles",
  "Deep dives into emerging programming frameworks and release cycles",
  "Cybersecurity ecosystem shifts, devops updates, and platform resilience news",
];

// ─── Live News Fetcher (Google News RSS — free, no API key) ──────────────────

/**
 * Fetch real trending tech headlines from Google News RSS.
 * Returns an array of headline strings. Falls back to empty array on failure.
 */
async function fetchLiveHeadlines(maxHeadlines: number = 15): Promise<string[]> {
  const RSS_URL = "https://news.google.com/rss/search?q=technology+OR+software+OR+AI+OR+developer&hl=en-US&gl=US&ceid=US:en";

  try {
    log("Fetching live tech headlines from Google News...", "cyan");
    const response = await fetch(RSS_URL, {
      headers: { "User-Agent": "Hirenest-AutoBlogger/1.0" },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();

    // Simple XML title extraction — no extra dependencies needed
    const titles: string[] = [];
    // First extract all <item>...</item> blocks, then get the <title> from each
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const block of itemBlocks) {
      if (titles.length >= maxHeadlines) break;
      // Match both CDATA-wrapped and plain titles
      const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      if (!titleMatch) continue;
      const rawTitle = titleMatch[1].trim();
      if (rawTitle.length <= 10) continue;
      // Strip " - Source Name" suffix that Google News appends
      const cleaned = rawTitle.replace(/\s*-\s*[^-]+$/, "").trim();
      if (cleaned.length > 10) titles.push(cleaned);
    }

    log(`✓ Fetched ${titles.length} live headlines`, "green");
    return titles;
  } catch (err: any) {
    log(`⚠ Could not fetch live news (${err.message}), will use AI-only topics`, "yellow");
    return [];
  }
}

/**
 * Generate a list of blog topics using AI for today's posts.
 * Pulls real trending headlines to ground topics in actual current events.
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

  // Fetch real headlines for grounding
  const liveHeadlines = await fetchLiveHeadlines(15);

  // Pick random categories to ensure variety
  const shuffled = [...TOPIC_CATEGORIES].sort(() => Math.random() - 0.5);
  const selectedCategories = shuffled.slice(0, Math.min(count, shuffled.length));

  // Include a shifting random seed to ensure completely fresh outputs day after day
  const randomSeed = Math.random().toString(36).substring(2, 8);

  // Build the live news context block
  const newsContext = liveHeadlines.length > 0
    ? `\n\nHere are REAL trending technology headlines from today. Use these as inspiration to create titles grounded in actual current events:\n${liveHeadlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nBase your titles on these real stories — expand them into deeper, more analytical angles. Do NOT copy them verbatim.`
    : "";

  const prompt = `You are a top-tier technology news editor and enterprise software strategist for Hirenest (hirenest.ai).

Today is ${today}. Generation Seed Context: [${randomSeed}]
${newsContext}

Generate exactly ${count} highly clickable, viral, and authoritative technology news or industry trend article titles. Each title should be:
- Grounded in real, current tech events happening right now${liveHeadlines.length > 0 ? " (use the headlines above as a starting point)" : ""}
- Focused on breaking tech developments, critical software industry shifts, developer tool evolutions, or cutting-edge enterprise strategies
- Exceptionally timely and framed around major real-time movements in ${new Date().getFullYear()}
- Highly specific and engaging to experienced software engineers, tech managers, and digital leaders
- SEO-optimized to capture organic search intent for modern tech stacks and workplace platforms
- Covering aspects of: ${selectedCategories.join(", ")}

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

  const prompt = `You are an elite Technology News Correspondent and Principal Systems Architect writing highly viral, authoritative content for Hirenest (hirenest.ai), a premier platform mapping top developer talent to cutting-edge tech enterprises.

Write a deeply exhaustive, breaking news analysis and comprehensive technical deep dive about: "${topic}"

STRICT EDITORIAL, LENGTH & GOOGLE SEO REQUIREMENTS:
1. Target Length & Absolute Depth: MINIMUM 2,500 words. To achieve this, expand every single section with dense, exhaustive prose, deep structural evaluations, concrete workflow examples, and granular technological breakdowns. Do not write summary fluff.
2. Mandatory Multi-Level Structure:
   - Start immediately with a sharp, high-burstiness news hook establishing the current stakes in ${new Date().getFullYear()} (do not label it with a heading).
   - Create exactly 6 to 8 comprehensive main conceptual sections using ##.
   - For EVERY single main section, you MUST create at least 3 distinct, granular subsections using ### exploring concrete frameworks, developer productivity metrics, architectural trade-offs, ecosystem impacts, or step-by-step engineering considerations.
   - Integrate structured comparison bullet points and bold key takeaways to optimize developer scannability.
3. Human-First Tone (Google E-E-A-T Compliant): Interleave short, punchy analytical sentences with longer, complex evaluations. Avoid recognizable AI symmetry. Use active voice and write with the authoritative pacing of a seasoned Tech Editor or CTO analyzing real-time market shifts.
4. FORBIDDEN AI CLICHÉS: Absolutely DO NOT use classic AI triggers such as: "delve into", "tapestry", "testament", "crucial", "paramount", "supercharge", "it's important to note", "moreover", "ultimately", or boilerplate wrappers like "in conclusion" or "in summary".
5. Context & Up-to-Date Authority: Frame the analysis around breaking technology releases, live industry restructurings, state-of-the-art developer toolchains, and modern cloud paradigms. Synthesize core takeaways naturally alongside a subtle, helpful reference to Hirenest's developer platform.
6. Absolute Exclusions: DO NOT output markdown headers/frontmatter. DO NOT repeat the post title as an H1 inside the body text.

Also provide the following metadata in a JSON block at the VERY END of your response, after all the blog content:

%%%METADATA%%%
{
  "description": "A 150-160 character highly engaging technical SEO meta description optimized for Google Search",
  "readTime": "10 min read"
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
    max_tokens: isOpenRouter ? 8192 : 4096, // Higher for free models to fit 2500+ word blogs
  };

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
  // Prefer OpenRouter (FREE models) over OpenAI (paid) to minimize cost
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
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
  const costNote = isOpenRouter ? "FREE ($0)" : `PAID (~$0.002/post)`;

  log(`Configuration:`, "cyan");
  log(`  Posts to generate: ${postCount}`, "gray");
  log(`  AI Model:          ${displayModel}`, "gray");
  log(`  Cost:              ${costNote}`, isOpenRouter ? "green" : "yellow");
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
