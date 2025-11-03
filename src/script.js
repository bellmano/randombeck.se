class BeckMovieGenerator {
    constructor() {
        this.movies = beckMovies;
        this.initializeEventListeners();
        this.initializeRangeValues();
        this.updateRangeSelector();
    }

    initializeRangeValues() {
        const maxRangeInput = document.getElementById('max-range');
        maxRangeInput.value = this.movies.length;
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const minRangeInput = document.getElementById('min-range');
        const maxRangeInput = document.getElementById('max-range');
        const allMoviesCheckbox = document.getElementById('all-movies-checkbox');

        generateBtn.addEventListener('click', () => this.generateRandomMovie());
        
        // Update ranges and validate when inputs change
        minRangeInput.addEventListener('change', () => this.updateRangeSelector());
        maxRangeInput.addEventListener('change', () => this.updateRangeSelector());
        minRangeInput.addEventListener('input', () => this.validateInputs());
        maxRangeInput.addEventListener('input', () => this.validateInputs());

        // Handle "All movies" checkbox
        allMoviesCheckbox.addEventListener('change', () => {
            this.toggleAllMoviesMode();
            this.validateInputs();
        });
    }

    updateRangeSelector() {
        const minRangeInput = document.getElementById('min-range');
        const maxRangeInput = document.getElementById('max-range');
        const maxMovies = this.movies.length;
        const minValue = Number.parseInt(minRangeInput.value);
        const maxValue = Number.parseInt(maxRangeInput.value);

        // Set min/max bounds
        minRangeInput.min = 1;
        minRangeInput.max = maxMovies;
        maxRangeInput.min = 1;
        maxRangeInput.max = maxMovies;

        // Ensure values are within bounds
        if (minValue < 1 || minValue > maxMovies) {
            minRangeInput.value = 1;
        }
        if (maxValue < 1 || maxValue > maxMovies) {
            maxRangeInput.value = maxMovies;
        }

        // Ensure min doesn't exceed max and vice versa
        if (minValue > maxValue) {
            maxRangeInput.value = minValue;
        }
        if (maxValue < minValue) {
            minRangeInput.value = maxValue;
        }

        this.validateInputs();
    }

    toggleAllMoviesMode() {
        const allMoviesCheckbox = document.getElementById('all-movies-checkbox');
        const rangeSelector = document.getElementById('range-selector');
        
        if (allMoviesCheckbox.checked) {
            // Dim the range selector when "All movies" is checked
            rangeSelector.classList.add('dimmed');
        } else {
            // Enable range selector when unchecked
            rangeSelector.classList.remove('dimmed');
        }
    }

    validateInputs() {
        const allMoviesCheckbox = document.getElementById('all-movies-checkbox');
        const generateBtn = document.getElementById('generate-btn');

        // If "All movies" is checked, always allow generation
        if (allMoviesCheckbox.checked) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
            return;
        }

        // Otherwise validate range inputs
        const minRange = Number.parseInt(document.getElementById('min-range').value);
        const maxRange = Number.parseInt(document.getElementById('max-range').value);

        const isValid = minRange >= 1 && maxRange >= 1 && 
                       minRange <= this.movies.length && 
                       maxRange <= this.movies.length && 
                       minRange <= maxRange;

        generateBtn.disabled = !isValid;
        
        if (!isValid) {
            generateBtn.style.opacity = '0.6';
            generateBtn.style.cursor = 'not-allowed';
        } else {
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
    }

    generateRandomMovie() {
        const allMoviesCheckbox = document.getElementById('all-movies-checkbox');
        
        let minRange, maxRange;
        
        if (allMoviesCheckbox.checked) {
            // Use all movies (1 to total length)
            minRange = 1;
            maxRange = this.movies.length;
        } else {
            // Use custom range
            minRange = Number.parseInt(document.getElementById('min-range').value);
            maxRange = Number.parseInt(document.getElementById('max-range').value);

            // Validate ranges only if not using all movies
            if (minRange < 1 || maxRange < 1 || minRange > maxRange || 
                minRange > this.movies.length || maxRange > this.movies.length) {
                this.showError('Ogiltigt intervall. Vänligen kontrollera dina nummer.');
                return;
            }
        }

        // Show loading state
        this.showLoading();

        // Simulate loading delay for better UX
        setTimeout(() => {
            try {
                const randomNumber = this.getRandomNumber(minRange, maxRange);
                const selectedMovie = this.movies.find(movie => movie.number === randomNumber);

                if (selectedMovie) {
                    this.displayMovie(selectedMovie);
                } else {
                    this.showError('Kunde inte hitta Beck-filmen. Vänligen försök igen.');
                }
            } catch (error) {
                console.error('Error generating random movie:', error);
                this.showError('Ett fel uppstod. Vänligen försök igen.');
            }
        }, 1000);
    }

    getRandomNumber(min, max) {
    // Use crypto.getRandomValues for secure random number generation
    const range = max - min + 1;
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xFFFFFFFF + 1);
    return Math.floor(randomNumber * range) + min;
    }

    displayMovie(movie) {
        const movieResult = document.getElementById('movie-result');
        const movieImage = document.getElementById('movie-image');
        const movieTitle = document.getElementById('movie-title');
        const movieRating = document.getElementById('movie-rating');
        const movieDescription = document.getElementById('movie-description');
        const movieLink = document.getElementById('movie-link');

        // Set movie information with year
        movieTitle.textContent = `${movie.title} (${movie.year})`;
        
        // Handle IMDB rating and runtime display
        if (movie.imdbRating || movie.runtime) {
            let ratingContent = '';
            
            if (movie.imdbRating) {
                ratingContent += `
                    <div class="rating-item">
                        <span class="rating-label">IMDB:</span>
                        <span class="rating-value">${movie.imdbRating}</span>
                        <span class="rating-star">★</span>
                    </div>
                `;
            }
            
            if (movie.runtime) {
                ratingContent += `
                    <div class="rating-item">
                        <span class="rating-label">Längd:</span>
                        <span class="rating-value">${movie.runtime}</span>
                        <span class="runtime-icon">🕐</span>
                    </div>
                `;
            }
            
            movieRating.innerHTML = ratingContent;
            movieRating.classList.remove('hidden');
        } else {
            movieRating.classList.add('hidden');
        }
        
        movieDescription.textContent = movie.description;
        
        // Set TV4 Play link or hide if not available
        if (movie.tv4playUrl) {
            movieLink.href = movie.tv4playUrl;
            movieLink.textContent = 'Streama filmen på TV4 Play';
            movieLink.style.display = 'inline-flex';
        } else {
            movieLink.style.display = 'none';
        }

        // Handle poster image loading
        if (movie.posterUrl) {
            movieImage.src = movie.posterUrl;
            movieImage.alt = `Affisch för ${movie.title}`;
        }

        // Hide loading and error states
        this.hideLoading();
        this.hideError();

        // Show movie result with animation
        movieResult.classList.remove('hidden');
        
        // Smooth scroll to result
        setTimeout(() => {
            movieResult.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const movieResult = document.getElementById('movie-result');
        const error = document.getElementById('error');

        movieResult.classList.add('hidden');
        error.classList.add('hidden');
        loading.classList.remove('hidden');

        // Smooth scroll to loading indicator
        setTimeout(() => {
            loading.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.classList.add('hidden');
    }

    showError(message) {
        const error = document.getElementById('error');
        const movieResult = document.getElementById('movie-result');
        const loading = document.getElementById('loading');

        error.querySelector('p').textContent = message;
        
        movieResult.classList.add('hidden');
        loading.classList.add('hidden');
        error.classList.remove('hidden');

        // Smooth scroll to error
        setTimeout(() => {
            error.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }

    hideError() {
        const error = document.getElementById('error');
        error.classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const generator = new BeckMovieGenerator();
    // Store reference to prevent it from being garbage collected
    globalThis.beckGenerator = generator;
});

// Add some nice visual feedback for inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Add keyboard support for better accessibility
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const generateBtn = document.getElementById('generate-btn');
        if (!generateBtn.disabled) {
            generateBtn.click();
        }
    }
});
