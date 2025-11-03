// This script reads beckDB.js, fetches IMDB ratings for each imdbUrl, and updates the imdbRating field.

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const dbPath = path.join(__dirname, '../data/beckDB.js');

function extractRating(html) {
    // Try multiple patterns for IMDB rating extraction
    const patterns = [
        // New IMDB rating pattern - looks for rating/10 format
        /(\d+\.\d)\/10/,
        // Alternative pattern for span with rating value - made safer with possessive quantifier alternative
        /<span[^>]{0,200}>(\d+\.\d)<\/span>/,
        // Legacy patterns for backward compatibility
        /<span class="sc-[a-z0-9]+-1[^"]*" data-testid="hero-rating-bar__aggregate-rating__score">(\d+\.\d)<\/span>/,
        /<span itemprop="ratingValue">(\d+\.\d)<\/span>/,
        // Additional pattern for rating display - limited backtracking
        /IMDb RATING[^0-9]{0,50}(\d+\.\d)/i
    ];
    
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function updateRatings() {
    let dbContent = fs.readFileSync(dbPath, 'utf8');
    let movies;
    try {
        dbContent = dbContent.replace(/const beckMovies = /, 'return ');
        dbContent = dbContent.replace(/;\s*$/, '');
        const parseFunction = new Function(dbContent);
        movies = parseFunction();
    } catch (e) {
        console.error('Failed to parse beckDB.js:', e);
        return;
    }

    for (const movie of movies) {
        if (!movie.imdbUrl) {
            console.log(`No imdbUrl for: ${movie.title}`);
            continue;
        }
        try {
            console.log(`Fetching IMDB rating for: ${movie.title}`);
            const res = await fetch(movie.imdbUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            const html = await res.text();
            
            const rating = extractRating(html);
            if (rating) {
                movie.imdbRating = rating;
                console.log(`  -> Rating: ${rating}`);
            } else {
                console.log(`  -> Rating not found`);
            }
        } catch (err) {
            console.log(`  -> Error fetching: ${err}`);
        }
    }

    // Custom formatting to maintain original JavaScript object style (unquoted keys)
    const formatMovie = (movie) => {
        let result = '    {\n';
        result += `        number: ${movie.number},\n`;
        result += `        title: "${movie.title}",\n`;
        result += `        year: ${movie.year},\n`;
        if (movie.description) {
            result += `        description: "${movie.description.replaceAll('"', '\\"')}",\n`;
        }
        result += `        imdbUrl: "${movie.imdbUrl}",\n`;
        if (movie.tv4playUrl) {
            result += `        tv4playUrl: "${movie.tv4playUrl}",\n`;
        }
        if (movie.posterUrl) {
            result += `        posterUrl: "${movie.posterUrl}"`;
            if (movie.runtime || movie.imdbRating) {
                result += ',';
            }
        }
        if (movie.runtime) {
            if (!movie.posterUrl) result += ',';
            result += `\n        runtime: "${movie.runtime}"`;
            if (movie.imdbRating) {
                result += ',';
            }
        }
        if (movie.imdbRating) {
            if (!movie.posterUrl && !movie.runtime) result += ',';
            result += `\n        imdbRating: "${movie.imdbRating}"`;
        }
        result += '\n    }';
        return result;
    };

    const formattedMovies = movies.map(formatMovie).join(',\n');
    const newContent = `const beckMovies = [\n${formattedMovies}\n];\n`;
    fs.writeFileSync(dbPath, newContent, 'utf8');
    console.log('beckDB.js updated with latest IMDB ratings.');
}

updateRatings();
