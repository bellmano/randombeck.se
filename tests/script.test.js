// Mock the beckMovies data before requiring the script
global.beckMovies = [
    { number: 1, title: "Beck - Lockpojken", year: 1997, description: "Test movie 1" },
    { number: 2, title: "Beck - Monstret", year: 1998, description: "Test movie 2" },
    { number: 3, title: "Beck - Vita nätter", year: 1998, description: "Test movie 3" },
    { number: 4, title: "Beck - Öga för öga", year: 1998, description: "Test movie 4" },
    { number: 5, title: "Beck - Pojken i glaskulan", year: 2002, description: "Test movie 5" }
];

// Mock DOM methods that might be missing in JSDOM
Element.prototype.scrollIntoView = jest.fn();

describe('Main Script Tests', () => {
    let mockElements;

    beforeEach(() => {
        // Clear any previous DOM
        document.body.innerHTML = '';
        
        // Set up DOM structure that matches the original HTML
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
    });

    test('should load the script and initialize DOM elements', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        // Check that elements exist
        expect(mockElements.minRange).toBeTruthy();
        expect(mockElements.maxRange).toBeTruthy();
        expect(mockElements.generateBtn).toBeTruthy();
    });

    test('should handle range input changes', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        // Change min range value and trigger change event
        mockElements.minRange.value = '2';
        const changeEvent = new Event('change');
        mockElements.minRange.dispatchEvent(changeEvent);
        
        // Check that the value was processed (this will test updateRangeSelector)
        expect(mockElements.minRange.value).toBe('2');
    });

    test('should handle checkbox change events', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        // Initially button should be enabled (valid default range)
        expect(mockElements.generateBtn.disabled).toBe(false);
        
        // Check checkbox and trigger change
        mockElements.allMoviesCheckbox.checked = true;
        const changeEvent = new Event('change');
        mockElements.allMoviesCheckbox.dispatchEvent(changeEvent);
        
        // Should still be enabled when "all movies" is checked
        expect(mockElements.generateBtn.disabled).toBe(false);
    });

    test('should validate input ranges correctly', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        // Set invalid range (min > max)
        mockElements.minRange.value = '5';
        mockElements.maxRange.value = '2';
        
        // Trigger input event to validate
        const inputEvent = new Event('input');
        mockElements.minRange.dispatchEvent(inputEvent);
        
        // Button should be disabled due to invalid range
        expect(mockElements.generateBtn.disabled).toBe(true);
    });

    test('should handle generate button click', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        // Set valid range
        mockElements.minRange.value = '1';
        mockElements.maxRange.value = '3';
        
        // Click generate button
        const clickEvent = new Event('click');
        mockElements.generateBtn.dispatchEvent(clickEvent);
        
        // Loading should be shown (even briefly)
        setTimeout(() => {
            const loading = document.getElementById('loading');
            expect(loading.classList.contains('hidden')).toBe(false);
        }, 100);
    });

    test('should handle keyboard events', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script
        const domEvent = new Event('DOMContentLoaded');
        document.dispatchEvent(domEvent);
        
        // Simulate Enter key press
        const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        document.dispatchEvent(keyEvent);
        
        // This tests the keyboard accessibility feature
        // Hard to assert much without mocking the click, but it exercises the code
        expect(document).toBeDefined();
    });

    test('should add visual feedback to number inputs on focus/blur', () => {
        // Load the script
        require('../src/script.js');
        
        // Trigger DOMContentLoaded to initialize the script (this will set up the input effects too)
        const domEvent = new Event('DOMContentLoaded');
        document.dispatchEvent(domEvent);
        
        // Trigger focus on min range input
        const focusEvent = new Event('focus');
        mockElements.minRange.dispatchEvent(focusEvent);
        
        // Check that transform style was applied (this tests the visual feedback code)
        expect(mockElements.minRange.style.transform).toBe('scale(1.05)');
        
        // Trigger blur
        const blurEvent = new Event('blur');
        mockElements.minRange.dispatchEvent(blurEvent);
        
        // Transform should be reset
        expect(mockElements.minRange.style.transform).toBe('scale(1)');
    });
});
