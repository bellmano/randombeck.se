// Mock the dependencies before requiring them
jest.mock('fs');
jest.mock('node-fetch');

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

describe('fetchRatings.js', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('extractRating', () => {
        const extractRating = (html) => {
            const patterns = [
                /(\d+\.\d)\/10/,
                /<span[^>]*>(\d+\.\d)<\/span>/,
                /<span class="sc-[a-z0-9]+-1[^"]*" data-testid="hero-rating-bar__aggregate-rating__score">(\d+\.\d)<\/span>/,
                /<span itemprop="ratingValue">(\d+\.\d)<\/span>/,
                /IMDb RATING[^0-9]*(\d+\.\d)/i
            ];
            
            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
            return null;
        };

        test('should extract rating using first matching pattern', () => {
            expect(extractRating('8.5/10')).toBe('8.5');
        });

        test('should return null when no pattern matches', () => {
            expect(extractRating('no rating')).toBeNull();
        });
    });

    describe('updateRatings', () => {
        const mockDbContent = `const beckMovies = [
    {
        number: 1,
        title: "Test Movie",
        year: 2020,
        imdbUrl: "https://www.imdb.com/title/tt1234567/",
        posterUrl: "https://example.com/poster.jpg"
    }
];`;

        test('should handle complete flow with rating found', async () => {
            fs.readFileSync.mockReturnValue(mockDbContent);
            fs.writeFileSync.mockImplementation(() => {});
            fetch.mockResolvedValue({
                text: jest.fn().mockResolvedValue('<div>7.5/10</div>')
            });

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should handle parse error', async () => {
            fs.readFileSync.mockReturnValue('invalid content');

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to parse beckDB.js:'),
                expect.any(Error)
            );
        });

        test('should handle movie without imdbUrl', async () => {
            const noUrlDb = `const beckMovies = [{number: 1, title: "No URL", year: 2020}];`;
            fs.readFileSync.mockReturnValue(noUrlDb);
            fs.writeFileSync.mockImplementation(() => {});

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(consoleLogSpy).toHaveBeenCalledWith('No imdbUrl for: No URL');
        });

        test('should handle rating not found', async () => {
            fs.readFileSync.mockReturnValue(mockDbContent);
            fs.writeFileSync.mockImplementation(() => {});
            fetch.mockResolvedValue({
                text: jest.fn().mockResolvedValue('<div>No rating here</div>')
            });

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(consoleLogSpy).toHaveBeenCalledWith('  -> Rating not found');
        });

        test('should handle fetch error', async () => {
            fs.readFileSync.mockReturnValue(mockDbContent);
            fs.writeFileSync.mockImplementation(() => {});
            fetch.mockRejectedValue(new Error('Network error'));

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('  -> Error fetching:')
            );
        });

        test('should format movie with all optional fields', async () => {
            const fullMovie = `const beckMovies = [{
                number: 1,
                title: "Full",
                year: 2020,
                description: "desc",
                imdbUrl: "https://imdb.com/title/tt1/",
                tv4playUrl: "https://tv4.se/",
                posterUrl: "https://poster.jpg"
            }];`;
            fs.readFileSync.mockReturnValue(fullMovie);
            const writeFileSpy = jest.fn();
            fs.writeFileSync.mockImplementation(writeFileSpy);
            fetch.mockResolvedValue({
                text: jest.fn().mockResolvedValue('9.1/10')
            });

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const written = writeFileSpy.mock.calls[0][1];
            expect(written).toContain('description:');
            expect(written).toContain('tv4playUrl:');
            expect(written).toContain('imdbRating:');
        });

        test('should format movie without optional fields', async () => {
            const minimalMovie = `const beckMovies = [{
                number: 1,
                title: "Minimal",
                year: 2020,
                imdbUrl: "https://imdb.com/title/tt1/",
                posterUrl: "https://poster.jpg"
            }];`;
            fs.readFileSync.mockReturnValue(minimalMovie);
            const writeFileSpy = jest.fn();
            fs.writeFileSync.mockImplementation(writeFileSpy);
            fetch.mockResolvedValue({
                text: jest.fn().mockResolvedValue('no rating')
            });

            jest.isolateModules(() => {
                require('../src/fetchRatings.js');
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            const written = writeFileSpy.mock.calls[0][1];
            expect(written).not.toContain('description:');
            expect(written).not.toContain('tv4playUrl:');
            expect(written).not.toContain('imdbRating:');
        });
    });
});
