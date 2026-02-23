/**
 * Fixfit Video Catalog Scraper
 * Scrapes workout video data from fixfit.it categories
 * Outputs public/fixfit-catalog.json
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
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchPage(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractVideoLinks(html) {
    // Find all workout links like /some-workout-name_1234_a/
    const regex = /href="(\/[a-z0-9-]+_\d+_a\/)"/gi;
    const links = new Set();
    let match;
    while ((match = regex.exec(html)) !== null) {
        links.add('https://www.fixfit.it' + match[1].replace(/\/$/, ''));
    }
    return [...links];
}

function extractYouTubeId(html) {
    // Look for youtube-nocookie.com/embed/VIDEO_ID or youtube.com/embed/VIDEO_ID
    const match = html.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function extractMeta(html, url) {
    // Title from og:title or <title>
    let title = '';
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    if (ogTitle) title = ogTitle[1];
    else {
        const titleTag = html.match(/<title>([^<]+)<\/title>/i);
        if (titleTag) title = titleTag[1];
    }

    // Description from og:description — often contains "35:00 Minuti - 267 Kcal - Total Body"
    let desc = '';
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
    if (ogDesc) desc = ogDesc[1];

    // Parse duration from description
    let duration = '';
    const durMatch = desc.match(/(\d{1,2}:\d{2})\s*Min/i);
    if (durMatch) duration = durMatch[1];

    // Parse kcal
    let kcal = 0;
    const kcalMatch = desc.match(/(\d+)\s*Kcal/i);
    if (kcalMatch) kcal = parseInt(kcalMatch[1]);

    // Parse level
    let level = '';
    if (/avanzat/i.test(desc)) level = 'avanzato';
    else if (/intermedi/i.test(desc)) level = 'intermedio';
    else if (/principiant/i.test(desc)) level = 'principiante';
    // Also check title
    if (!level) {
        if (/avanzat/i.test(title)) level = 'avanzato';
        else if (/intermedi/i.test(title)) level = 'intermedio';
        else if (/principiant/i.test(title)) level = 'principiante';
    }

    // Extract fixfit internal ID from URL
    const idMatch = url.match(/_(\d+)_a\/?$/);
    const fixfitId = idMatch ? parseInt(idMatch[1]) : 0;

    return { title: title.trim(), duration, kcal, level, fixfitId };
}

async function scrapeCategory(category) {
    console.log(`📂 Scraping: ${category.name}...`);
    const url = `https://www.fixfit.it/allenamenti/${category.slug}/`;

    // Fetch multiple pages (page 1, 2, 3)
    const videos = [];
    const seenUrls = new Set();

    for (let page = 1; page <= 3; page++) {
        const pageUrl = page === 1 ? url : `${url}page/${page}/`;
        try {
            const html = await fetchPage(pageUrl);
            const links = extractVideoLinks(html);

            if (links.length === 0) break;

            for (const link of links) {
                if (seenUrls.has(link)) continue;
                seenUrls.add(link);
            }

            console.log(`  Page ${page}: ${links.length} links found`);
        } catch (e) {
            console.log(`  Page ${page}: error - ${e.message}`);
            break;
        }
    }

    // Now fetch each video page to get YouTube ID and metadata
    const allLinks = [...seenUrls];
    console.log(`  Fetching ${allLinks.length} video pages...`);

    for (const videoUrl of allLinks) {
        try {
            const html = await fetchPage(videoUrl);
            const ytId = extractYouTubeId(html);
            if (!ytId) continue;

            const meta = extractMeta(html, videoUrl);

            videos.push({
                yt: ytId,
                title: meta.title,
                cat: category.name,
                dur: meta.duration || '',
                kcal: meta.kcal || 0,
                lvl: meta.level || '',
                fid: meta.fixfitId,
                url: videoUrl,
            });

            // Small delay to be polite
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.log(`  Error: ${videoUrl} - ${e.message}`);
        }
    }

    console.log(`  ✅ ${videos.length} videos extracted`);
    return videos;
}

async function main() {
    console.log('🏋️ Fixfit Catalog Scraper\n');

    const allVideos = [];
    const seenYtIds = new Set();

    for (const cat of CATEGORIES) {
        const videos = await scrapeCategory(cat);
        for (const v of videos) {
            if (!seenYtIds.has(v.yt)) {
                seenYtIds.add(v.yt);
                allVideos.push(v);
            }
        }
        // Delay between categories
        await new Promise(r => setTimeout(r, 500));
    }

    // Sort by fixfit ID (newest first)
    allVideos.sort((a, b) => b.fid - a.fid);

    const outPath = path.join(__dirname, '..', 'public', 'fixfit-catalog.json');
    fs.writeFileSync(outPath, JSON.stringify(allVideos, null, 2));

    console.log(`\n🎉 Done! ${allVideos.length} unique videos saved to ${outPath}`);
    console.log(`   File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
