/**
 * Fixfit Video Catalog Scraper
 * Scrapes workout video data from fixfit.it categories
 * Outputs per-category JSON files to public/fixfit/
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CATEGORIES = [
    { slug: 'esercizi-total-body', name: 'Total Body' },
    { slug: 'esercizi-glutei-e-gambe', name: 'Gambe e Glutei' },
    { slug: 'esercizi-addominali', name: 'Addominali' },
    { slug: 'esercizi-gag', name: 'GAG' },
    { slug: 'esercizi-braccia', name: 'Braccia e Spalle' },
    { slug: 'esercizi-facili-a-casa', name: 'Principianti' },
    { slug: 'esercizi-hiit-brucia-grassi', name: 'HIIT' },
    { slug: 'esercizi-senza-salti', name: 'Senza Salti' },
    { slug: 'esercizi-di-stretching', name: 'Stretching' },
    { slug: 'workout-fitness', name: 'Workout Completi' },
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode === 404) {
                return resolve(''); // Page doesn't exist
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractVideoLinks(html) {
    const regex = /href="(\/[a-z0-9-]+_\d+_a\/)"/gi;
    const links = new Set();
    let match;
    while ((match = regex.exec(html)) !== null) {
        links.add('https://www.fixfit.it' + match[1].replace(/\/$/, ''));
    }
    return [...links];
}

function extractYouTubeId(html) {
    const match = html.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function extractMeta(html, url) {
    let title = '';
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    if (ogTitle) title = ogTitle[1];
    else {
        const titleTag = html.match(/<title>([^<]+)<\/title>/i);
        if (titleTag) title = titleTag[1];
    }

    let desc = '';
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
    if (ogDesc) desc = ogDesc[1];

    let duration = '';
    const durMatch = desc.match(/(\d{1,2}:\d{2})\s*Min/i);
    if (durMatch) duration = durMatch[1];

    let kcal = 0;
    const kcalMatch = desc.match(/(\d+)\s*Kcal/i);
    if (kcalMatch) kcal = parseInt(kcalMatch[1]);

    let level = '';
    const combined = desc + ' ' + title;
    if (/avanzat/i.test(combined)) level = 'avanzato';
    else if (/intermedi/i.test(combined)) level = 'intermedio';
    else if (/principiant|base/i.test(combined)) level = 'principiante';

    const idMatch = url.match(/_(\d+)_a\/?$/);
    const fixfitId = idMatch ? parseInt(idMatch[1]) : 0;

    return { title: title.trim(), duration, kcal, level, fixfitId };
}

async function scrapeCategory(category) {
    console.log(`\n📂 Scraping: ${category.name}...`);
    const baseUrl = `https://www.fixfit.it/allenamenti/${category.slug}/`;

    const seenUrls = new Set();

    // Fixfit pagination: /1/, /2/, /3/, etc (page 1 = base URL or /1/)
    for (let page = 1; page <= 100; page++) {
        const pageUrl = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        try {
            const html = await fetchPage(pageUrl);
            if (!html || html.length < 500) break; // Empty/404 page

            const links = extractVideoLinks(html);
            if (links.length === 0) break;

            let newCount = 0;
            for (const link of links) {
                if (!seenUrls.has(link)) {
                    seenUrls.add(link);
                    newCount++;
                }
            }

            process.stdout.write(`  Pg ${page}: +${newCount} (total: ${seenUrls.size})  \r`);

            if (newCount === 0) break;
        } catch (e) {
            break;
        }
    }

    console.log(`  Found ${seenUrls.size} unique video URLs across all pages`);

    // Now fetch each video page
    const videos = [];
    const allLinks = [...seenUrls];
    let done = 0;

    // Process in batches of 5 for speed
    for (let i = 0; i < allLinks.length; i += 5) {
        const batch = allLinks.slice(i, i + 5);
        const results = await Promise.all(batch.map(async (videoUrl) => {
            try {
                const html = await fetchPage(videoUrl);
                const ytId = extractYouTubeId(html);
                if (!ytId) return null;

                const meta = extractMeta(html, videoUrl);
                return {
                    yt: ytId,
                    title: meta.title,
                    dur: meta.duration || '',
                    kcal: meta.kcal || 0,
                    lvl: meta.level || '',
                    fid: meta.fixfitId,
                };
            } catch {
                return null;
            }
        }));

        for (const r of results) {
            if (r) videos.push(r);
        }

        done += batch.length;
        process.stdout.write(`  Fetching: ${done}/${allLinks.length} (${videos.length} with YT)  \r`);
    }

    console.log(`  ✅ ${videos.length} videos extracted from ${category.name}`);

    // Sort by fixfit ID (newest first)
    videos.sort((a, b) => b.fid - a.fid);
    return videos;
}

async function main() {
    console.log('🏋️ Fixfit Catalog Scraper (full)\n');

    const outDir = path.join(__dirname, '..', 'public', 'fixfit');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const index = [];
    let totalVideos = 0;

    for (const cat of CATEGORIES) {
        const videos = await scrapeCategory(cat);

        // Save per-category file
        const filename = cat.slug + '.json';
        const filePath = path.join(outDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(videos));

        index.push({
            name: cat.name,
            slug: cat.slug,
            file: filename,
            count: videos.length,
        });

        totalVideos += videos.length;
        console.log(`  💾 Saved ${filename} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
    }

    // Write index file
    const indexPath = path.join(outDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    // Also write a "latest" file with newest 20 videos across all categories
    const allVideos = [];
    for (const cat of CATEGORIES) {
        const filePath = path.join(outDir, cat.slug + '.json');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data.forEach(v => { v.cat = cat.name; });
        allVideos.push(...data);
    }
    // Deduplicate by yt ID
    const seen = new Set();
    const unique = allVideos.filter(v => { if (seen.has(v.yt)) return false; seen.add(v.yt); return true; });
    unique.sort((a, b) => b.fid - a.fid);
    const latestPath = path.join(outDir, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(unique.slice(0, 30)));

    console.log(`\n🎉 Done! ${totalVideos} total videos across ${CATEGORIES.length} categories`);
    console.log(`   Index: ${indexPath}`);
    console.log(`   Latest: ${latestPath} (${unique.slice(0, 30).length} videos)`);
}

main().catch(console.error);
