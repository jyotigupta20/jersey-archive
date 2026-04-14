import * as chromeLauncher from "chrome-launcher";

interface LighthouseThresholds {
  performance?: number;
  accessibility?: number;
  "best-practices"?: number;
  seo?: number;
}

interface LighthouseResult {
  url: string;
  scores: Record<string, number>;
  passed: boolean;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runLighthouse(
  url: string,
  thresholds: LighthouseThresholds
): Promise<LighthouseResult> {
  // Brief pause so any previous Chrome instance fully releases its port
  await sleep(1000);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // Dynamic import for ESM lighthouse module
    const lighthouse = await import("lighthouse");
    const lh = lighthouse.default || lighthouse;

    const result = await lh(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });

    if (!result?.lhr) {
      throw new Error("Lighthouse did not return a result");
    }

    const categories = result.lhr.categories;
    const scores: Record<string, number> = {};

    for (const [key, category] of Object.entries(categories)) {
      scores[key] = Math.round((category as { score: number }).score * 100);
    }

    let passed = true;
    const failures: string[] = [];

    for (const [key, minScore] of Object.entries(thresholds)) {
      const actual = scores[key] ?? 0;
      if (actual < minScore) {
        passed = false;
        failures.push(`${key}: ${actual} < ${minScore}`);
      }
    }

    if (!passed) {
      const failureMsg = failures.join(", ");
      const allScores = Object.entries(scores)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      throw new Error(
        `Lighthouse thresholds not met for ${url}\n  Failed: ${failureMsg}\n  All scores: ${allScores}`
      );
    }

    return { url, scores, passed };
  } finally {
    await chrome.kill();
  }
}
