// Mock the beckMovies data before requiring the script
global.beckMovies = [
    { number: 1, title: "Beck - Lockpojken", year: 1997, description: "Test movie 1", imdbRating: "6.2", tv4playUrl: "https://tv4play.se/1", posterUrl: "https://poster1.jpg" },
    { number: 2, title: "Beck - Monstret", year: 1998, description: "Test movie 2" },
    { number: 3, title: "Beck - Vita nätter", year: 1998, description: "Test movie 3", imdbRating: "5.9" },
    { number: 4, title: "Beck - Öga för öga", year: 1998, description: "Test movie 4" },
    { number: 5, title: "Beck - Pojken i glaskulan", year: 2002, description: "Test movie 5" }
];

// Mock DOM methods that might be missing in JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock crypto.getRandomValues
Object.defineProperty(globalThis, 'crypto', {
    value: {
        getRandomValues: jest.fn((buffer) => {
            buffer[0] = Math.floor(Math.random() * 0xFFFFFFFF);
            return buffer;
        })
    },
    writable: true
});

describe('Main Script Tests', () => {
    let mockElements;
    let generator;
    let scriptLoaded = false;

    beforeEach(() => {
        document.body.innerHTML = `
            <div>
                <input id="min-range" type="number" value="1" min="1" max="5">
                <input id="max-range" type="number" value="5" min="1" max="5">
                <input id="all-movies-checkbox" type="checkbox">
                <button id="generate-btn">Generate</button>
                <div id="range-selector"></div>
                <div id="loading" class="hidden"></div>
                <div id="error" class="hidden"><p></p></div>
                <div id="movie-result" class="hidden">
                    <img id="movie-image">
                    <h2 id="movie-title"></h2>
                    <div id="movie-rating"></div>
                    <p id="movie-description"></p>
                    <a id="movie-link"></a>
                </div>
            </div>
        `;

        mockElements = {
            minRange: document.getElementById('min-range'),
            maxRange: document.getElementById('max-range'),
            allMoviesCheckbox: document.getElementById('all-movies-checkbox'),
            generateBtn: document.getElementById('generate-btn'),
            rangeSelector: document.getElementById('range-selector')
        };

        jest.clearAllTimers();
        jest.useFakeTimers();

        if (!scriptLoaded) {
            require('../src/script.js');
            scriptLoaded = true;
        }
        
        document.dispatchEvent(new Event('DOMContentLoaded'));
        generator = globalThis.beckGenerator;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should initialize and handle range validation', () => {
        expect(generator).toBeTruthy();
        
        // Test out-of-bounds values
        mockElements.minRange.value = '0';
        mockElements.minRange.dispatchEvent(new Event('change'));
        expect(mockElements.minRange.value).toBe('1');

        mockElements.maxRange.value = '100';
        mockElements.maxRange.dispatchEvent(new Event('change'));
        expect(mockElements.maxRange.value).toBe('5');

        // Test min/max adjustment
        mockElements.minRange.value = '4';
        mockElements.maxRange.value = '2';
        mockElements.minRange.dispatchEvent(new Event('change'));
        expect(mockElements.maxRange.value).toBe('4');

        // Test invalid range disables button
        mockElements.minRange.value = '5';
        mockElements.maxRange.value = '2';
        mockElements.minRange.dispatchEvent(new Event('input'));
        expect(mockElements.generateBtn.disabled).toBe(true);
    });

    test('should handle all movies checkbox toggle', () => {
        mockElements.allMoviesCheckbox.checked = true;
        mockElements.allMoviesCheckbox.dispatchEvent(new Event('change'));
        expect(mockElements.rangeSelector.classList.contains('dimmed')).toBe(true);
        expect(mockElements.generateBtn.disabled).toBe(false);

        mockElements.allMoviesCheckbox.checked = false;
        mockElements.allMoviesCheckbox.dispatchEvent(new Event('change'));
        expect(mockElements.rangeSelector.classList.contains('dimmed')).toBe(false);
    });

    test('should add visual feedback on focus/blur', () => {
        mockElements.minRange.dispatchEvent(new Event('focus'));
        expect(mockElements.minRange.style.transform).toBe('scale(1.05)');
        
        mockElements.minRange.dispatchEvent(new Event('blur'));
        expect(mockElements.minRange.style.transform).toBe('scale(1)');

        mockElements.maxRange.dispatchEvent(new Event('focus'));
        expect(mockElements.maxRange.style.transform).toBe('scale(1.05)');
    });

    test('should handle keyboard accessibility', () => {
        const clickSpy = jest.spyOn(mockElements.generateBtn, 'click');
        
        // Should trigger on Enter when enabled
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(clickSpy).toHaveBeenCalled();
        
        clickSpy.mockClear();
        
        // Should not trigger on other keys
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(clickSpy).not.toHaveBeenCalled();
        
        // Should not trigger when button disabled
        mockElements.minRange.value = '10';
        mockElements.minRange.dispatchEvent(new Event('input'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(clickSpy).toHaveBeenCalledTimes(0);
        
        clickSpy.mockRestore();
    });

    test('should show error for invalid range', () => {
        mockElements.minRange.value = '10';
        mockElements.maxRange.value = '2';
        mockElements.generateBtn.dispatchEvent(new Event('click'));

        const error = document.getElementById('error');
        expect(error.classList.contains('hidden')).toBe(false);
        expect(error.querySelector('p').textContent).toContain('Ogiltigt intervall');
    });

    test('should generate and display movie with all fields', () => {
        mockElements.minRange.value = '1';
        mockElements.maxRange.value = '1';
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        
        jest.advanceTimersByTime(1100);

        const movieResult = document.getElementById('movie-result');
        expect(movieResult.classList.contains('hidden')).toBe(false);
        
        // Check IMDB rating shown
        const movieRating = document.getElementById('movie-rating');
        expect(movieRating.classList.contains('hidden')).toBe(false);
        expect(movieRating.innerHTML).toContain('6.2');
        
        // Check TV4 link shown
        const movieLink = document.getElementById('movie-link');
        expect(movieLink.style.display).toBe('inline-flex');
        
        // Check poster set
        const movieImage = document.getElementById('movie-image');
        expect(movieImage.src).toContain('poster1.jpg');
    });

    test('should handle movie without optional fields', () => {
        mockElements.minRange.value = '2';
        mockElements.maxRange.value = '2';
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        
        jest.advanceTimersByTime(1100);

        expect(document.getElementById('movie-rating').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('movie-link').style.display).toBe('none');
    });

    test('should generate with all movies checkbox', () => {
        mockElements.allMoviesCheckbox.checked = true;
        mockElements.allMoviesCheckbox.dispatchEvent(new Event('change'));
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        
        jest.advanceTimersByTime(1100);
        
        expect(document.getElementById('movie-result').classList.contains('hidden')).toBe(false);
    });

    test('should handle movie not found and exceptions', () => {
        const originalGetRandom = generator.getRandomNumber;
        
        // Test movie not found
        generator.getRandomNumber = jest.fn(() => 999);
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        jest.advanceTimersByTime(1100);
        
        let error = document.getElementById('error');
        expect(error.classList.contains('hidden')).toBe(false);
        expect(error.querySelector('p').textContent).toContain('Kunde inte hitta');

        // Test exception
        generator.getRandomNumber = jest.fn(() => { throw new Error('Test'); });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        jest.advanceTimersByTime(1100);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(error.querySelector('p').textContent).toContain('Ett fel uppstod');
        
        generator.getRandomNumber = originalGetRandom;
        consoleSpy.mockRestore();
    });

    test('should show loading and scroll behaviors', () => {
        const scrollSpy = jest.spyOn(Element.prototype, 'scrollIntoView');
        
        mockElements.generateBtn.dispatchEvent(new Event('click'));
        
        // Loading shown immediately
        expect(document.getElementById('loading').classList.contains('hidden')).toBe(false);
        
        // Scroll behaviors triggered
        jest.advanceTimersByTime(1200);
        expect(scrollSpy).toHaveBeenCalled();
        
        scrollSpy.mockRestore();
    });
});
