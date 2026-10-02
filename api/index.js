const express = require("express");
const cors = require("cors");

const APP_ID = 1572073081;
// App Store storefronts to pull reviews from, in priority order: English first, then French
const STOREFRONTS = [
    { country: "us", language: "en" },
    { country: "gb", language: "en" },
    { country: "ca", language: "en" },
    { country: "au", language: "en" },
    { country: "nz", language: "en" },
    { country: "ie", language: "en" },
    { country: "fr", language: "fr" },
];

const REQUEST_TIMEOUT_MS = 4000;
const REQUEST_RETRIES = 1;
const CACHE_TTL_MS = 10 * 60 * 1000;

const MIN_RATING = 4;
const MIN_MAJOR_VERSION = 3;

async function fetchJson(url, retries = REQUEST_RETRIES) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        return await response.json();
    } catch (error) {
        if (retries > 0) return fetchJson(url, retries - 1);
        throw error;
    }
}

async function fetchAppInfo() {
    const { results } = await fetchJson(`https://itunes.apple.com/lookup?id=${APP_ID}&country=us`);
    if (!results?.length) throw new Error(`App ${APP_ID} not found`);
    return { version: results[0].version, releaseNotes: results[0].releaseNotes };
}

async function fetchReviews({ country, language }) {
    const { feed } = await fetchJson(
        `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${APP_ID}/sortby=mostHelpful/json`
    );
    // The feed returns a single object instead of an array when there is only one review
    const entries = [].concat(feed?.entry ?? []);
    return entries
        .filter(entry => entry["im:rating"])
        .map(entry => ({
            id: entry.id.label,
            title: entry.title.label,
            userName: entry.author.name.label,
            text: entry.content.label,
            rating: Number(entry["im:rating"].label),
            version: entry["im:version"].label,
            language,
        }));
}

function isShowcaseReview(review) {
    return review.rating >= MIN_RATING
        && parseInt(review.version, 10) >= MIN_MAJOR_VERSION;
}

async function loadPayload() {
    const [appInfo, ...reviewResults] = await Promise.allSettled([
        fetchAppInfo(),
        ...STOREFRONTS.map(fetchReviews),
    ]);

    if (appInfo.status === "rejected") throw appInfo.reason;

    const fulfilled = reviewResults.filter(result => result.status === "fulfilled");
    if (!fulfilled.length) throw new Error("All review feeds failed");
    reviewResults
        .filter(result => result.status === "rejected")
        .forEach(result => console.warn("Review feed failed:", result.reason?.message));

    const seen = new Set();
    const reviews = fulfilled
        .flatMap(result => result.value)
        .filter(review => !seen.has(review.id) && seen.add(review.id))
        .filter(isShowcaseReview)
        .map(({ id, ...review }) => review);

    return { ...appInfo.value, reviews };
}

// In-memory cache, kept alive across requests on a warm serverless instance
let cached = null;
let pending = null;

async function getPayload() {
    if (cached && Date.now() < cached.expiresAt) return cached.data;

    // Share a single upstream fetch between concurrent requests
    pending ??= loadPayload()
        .then(data => {
            cached = { data, expiresAt: Date.now() + CACHE_TTL_MS };
            return data;
        })
        .finally(() => { pending = null; });

    try {
        return await pending;
    } catch (error) {
        // Serve stale data rather than failing when Apple is unreachable
        if (cached) {
            console.warn("Serving stale data:", error.message);
            return cached.data;
        }
        throw error;
    }
}

const app = express();

app.use(cors({
    origin: '*'
}));

app.get("/", async (req, res) => {
    try {
        const payload = await getPayload();
        // Let Vercel's CDN cache the response so most requests never hit this function
        res.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
        res.json(payload);
    } catch (error) {
        console.error(error);
        res.set("Cache-Control", "no-store");
        res.status(502).json({ error: "Failed to fetch App Store data" });
    }
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}

// Exporter l'app pour Vercel
module.exports = app;
