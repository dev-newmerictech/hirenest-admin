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

const DEFAULT_POST_COUNT = 3;
const DELAY_BETWEEN_POSTS_MS = 3_000; // 3 seconds between posts
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; // Massive 120B model with built-in web search
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"; // Fallback Llama model on OpenRouter
const OPENAI_MODEL = "gpt-4o-mini"; // Fallback if no OpenRouter/Groq key
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
  const RSS_URL = "https://news.google.com/rss/search?q=technology+OR+software+OR+developer+OR+Anthropic+OR+Claude+OR+OpenAI+OR+ChatGPT+OR+LLM+OR+%22artificial+intelligence%22&hl=en-US&gl=US&ceid=US:en";

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

First, use your built-in web search capabilities to research: "${topic}". Find the latest, real-time facts, updates, and community reactions regarding this news.

Then, write a deeply exhaustive, breaking news analysis and comprehensive technical deep dive about it.

STRICT EDITORIAL, LENGTH & GOOGLE SEO REQUIREMENTS:
1. Target Length & Absolute Depth: MINIMUM 2,500 words. Expand every section with dense, exhaustive prose, concrete workflow examples, and granular technological breakdowns.
2. Mandatory Multi-Level Structure:
   - Start immediately with a sharp, high-burstiness news hook (no heading).
   - Create exactly 6 to 8 comprehensive main conceptual sections using ##.
   - For EVERY single main section, create at least 3 distinct subsections using ### exploring concrete frameworks or architectural trade-offs.
   - Integrate structured comparison bullet points and bold key takeaways.
3. Human-First Tone: This must NOT sound like AI. Write with high burstiness, varying sentence lengths drastically. Interleave short, punchy analytical sentences with longer, complex evaluations. Be opinionated, slightly edgy, and authoritative like a seasoned CTO analyzing real-time market shifts.
4. FORBIDDEN AI CLICHÉS: Absolutely DO NOT use classic AI triggers such as: "delve into", "tapestry", "testament", "crucial", "paramount", "supercharge", "it's important to note", "moreover", "ultimately", "in conclusion", "in summary", "foster", "beacon", "landscape".
5. Context & Up-to-Date Authority: Frame the analysis around the breaking facts you just researched.
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
  const isGroq = apiKey.startsWith("gsk_");
  const isOpenRouter = !isGroq && apiKey.startsWith("sk-or-");
  
  let apiUrl = OPENAI_API_URL;
  let model = OPENAI_MODEL;
  let maxTokens = 4096;

  if (isGroq) {
    apiUrl = GROQ_API_URL;
    model = GROQ_MODEL;
    maxTokens = 6000; // Groq limits
  } else if (isOpenRouter) {
    apiUrl = OPENROUTER_API_URL;
    model = OPENROUTER_MODEL;
    maxTokens = 8192;
  }

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
    max_tokens: maxTokens, 
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
        const providerName = isGroq ? "Groq" : (isOpenRouter ? "OpenRouter" : "OpenAI");
        throw new Error(
          `${providerName} API error (${response.status}): ${errorBody}`
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        const providerName = isGroq ? "Groq" : (isOpenRouter ? "OpenRouter" : "OpenAI");
        throw new Error(`Empty response from ${providerName}`);
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

// ─── S3 Publisher ────────────────────────────────────────────────────────
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  // Relies on AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "hirenest-blog-content-1782152942";

/**
 * Helper to get an object from S3 as string
 */
async function getS3ObjectAsString(key: string): Promise<string | null> {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    }));
    
    if (response.Body) {
      return await response.Body.transformToString();
    }
    return null;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null; // Normal if it doesn't exist yet
    }
    throw error;
  }
}

/**
 * Publish a blog post directly to S3.
 *
 * 1. Uploads the full post JSON to `slug.json`.
 * 2. Fetches `index.json`
 * 3. Prepends the post summary to `index.json`
 * 4. Re-uploads `index.json`
 */
async function publishToS3(post: BlogPost): Promise<boolean> {
  try {
    // 1. Upload the full post to slug.json
    log(`    Uploading full post to ${post.slug}.json...`, "gray");
    const fullPostCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `${post.slug}.json`,
      Body: JSON.stringify(post),
      ContentType: "application/json",
      CacheControl: "public, max-age=3600, stale-while-revalidate=86400",
    });
    await s3Client.send(fullPostCommand);

    // 2. Fetch current index.json
    log(`    Fetching index.json...`, "gray");
    const indexDataStr = await getS3ObjectAsString("index.json");
    let indexData: any[] = [];
    if (indexDataStr) {
      try {
        indexData = JSON.parse(indexDataStr);
      } catch (err) {
        log(`    ⚠ Could not parse index.json. Creating new.`, "yellow");
      }
    }

    // 3. Prepend the new post summary
    const summary = {
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      published: post.published,
      tags: post.tags,
      readTime: post.readTime,
      authorName: post.authorName,
      // Extracted from original content logic
      excerpt: post.description,
    };

    // Remove if already exists (in case of re-run with same slug)
    indexData = indexData.filter((p) => p.slug !== post.slug);
    
    // Prepend to top (since we sort newest first)
    indexData.unshift(summary);

    // Ensure array is sorted descending by date just to be safe
    indexData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. Re-upload index.json
    log(`    Uploading updated index.json (${indexData.length} total posts)...`, "gray");
    const indexCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: "index.json",
      Body: JSON.stringify(indexData),
      ContentType: "application/json",
      CacheControl: "public, max-age=300, stale-while-revalidate=3600",
    });
    await s3Client.send(indexCommand);

    return true;
  } catch (err: any) {
    log(`    ✗ Publish to S3 failed: ${err.message}`, "red");
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
  // Prefer Groq (FREE) over OpenRouter over OpenAI
  const groqKey = process.env.GROQ_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const oaiKey = process.env.OPENAI_API_KEY;
  
  const apiKey = groqKey || orKey || oaiKey;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!apiKey) {
    log("Error: GROQ_API_KEY, OPENAI_API_KEY or OPENROUTER_API_KEY is not set", "red");
    log("Set it in your .env file or GitHub Actions secrets", "yellow");
    process.exit(1);
  }

  const isGroq = !!groqKey;
  const isOpenRouter = !isGroq && apiKey.startsWith("sk-or-");
  const displayModel = isGroq ? GROQ_MODEL : (isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL);
  const costNote = isGroq || isOpenRouter ? "FREE ($0)" : `PAID (~$0.002/post)`;

  log(`Configuration:`, "cyan");
  log(`  Posts to generate: ${postCount}`, "gray");
  log(`  AI Model:          ${displayModel}`, "gray");
  log(`  Cost:              ${costNote}`, isOpenRouter ? "green" : "yellow");
  log(`  Mode:              ${dryRun ? "DRY RUN (no publishing)" : "LIVE"}`, dryRun ? "yellow" : "green");
  log(`  S3 Bucket:         ${S3_BUCKET_NAME}`, "gray");
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
        // Publish to S3
        log(`    Publishing to S3...`, "gray");
        const success = await publishToS3(post);

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
