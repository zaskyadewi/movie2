    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

    const supabaseUrl = 'https://zebviyfgdkcialzohcjv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnZpeWZnZGtjaWFsem9oY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDg3ODQsImV4cCI6MjA2NjY4NDc4NH0.1_DYT7pxzNWlC36FTx8cW0cgWIrWFI-59q1iV3VMg_k'; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    (() => {
        const state = {
            selectedCityName: "Jakarta",
            allMovies: [],
            currentUser: null,
            currentSelectedMovie: null,
            selectedCinema: null, 
            selectedShowtime: null,
            selectedSeats: [],
            heroSlider: null,
        };

        const promoMoviesConfig = [
            { movieId: 1, promoImageUrl: 'https://www.themoviedb.org/t/p/original/r5i252L6gX4s62x9V5a5hYtI2J5.jpg', trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { movieId: 8, promoImageUrl: 'https://www.themoviedb.org/t/p/original/k4mS5gQT51a2aI8W4P9v0yXh5Y.jpg', trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ];

        // === DOM SELECTORS ===
        const mainContent = document.getElementById("main-content");
        const citySelect = document.getElementById("city-select");
        const userAuthNav = document.getElementById("user-auth-nav");

        // === HELPER FUNCTIONS ===
        const showPage = (pageId) => {
            mainContent.querySelectorAll('section[id]').forEach(s => s.classList.add('hidden'));
            const page = document.getElementById(pageId);
            if (page) page.classList.remove('hidden');
            window.scrollTo(0, 0);
        };

        // === AUTHENTICATION MODULE ===
        const authModule = (() => {
            const authModal = document.getElementById('auth-modal');
            const authContentContainer = document.getElementById('auth-content-container');
            const loginTemplate = document.getElementById('login-form-template');
            const registerTemplate = document.getElementById('register-form-template');

            const open = (formType = 'login') => {
                authContentContainer.innerHTML = '';
                const template = formType === 'login' ? loginTemplate : registerTemplate;
                authContentContainer.appendChild(template.content.cloneNode(true));
                authModal.classList.remove('hidden');

                const form = authContentContainer.querySelector('form');
                const link = authContentContainer.querySelector(formType === 'login' ? '#show-register-link' : '#show-login-link');
                
                form.addEventListener('submit', formType === 'login' ? handleLogin : handleRegister);
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    open(formType === 'login' ? 'register' : 'login');
                });
            };

            const close = () => authModal.classList.add('hidden');

            const displayFormError = (form, message) => {
                const errorEl = form.querySelector('.error-message');
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            };

            const handleLogin = async (e) => {
                e.preventDefault();
                const form = e.target;
                const { data, error } = await supabase.auth.signIn({
                    email: form.querySelector('#login-email').value,
                    password: form.querySelector('#login-password').value
                });

                if (error) {
                    displayFormError(form, error.message);
                    return;
                }

                localStorage.setItem('movieDayToken', data.session.access_token);
                localStorage.setItem('movieDayUser', JSON.stringify(data.user));
                state.currentUser = data.user;
                updateUserNav();
                close();
                alert(`Selamat datang kembali, ${state.currentUser.email}!`);
            };

            const handleRegister = async (e) => {
                e.preventDefault();
                const form = e.target;
                const { data, error } = await supabase.auth.signUp({
                    email: form.querySelector('#register-email').value,
                    password: form.querySelector('#register-password').value
                });

                if (error) {
                    displayFormError(form, error.message);
                    return;
                }

                alert('Registrasi berhasil! Silakan login.');
                open('login');
            };
            
            const handleLogout = async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('movieDayToken');
                localStorage.removeItem('movieDayUser');
                state.currentUser = null;
                updateUserNav();
                alert('Anda telah logout.');
                showPage('movie-gallery-page');
            };

            const checkStatus = () => {
                const userJson = localStorage.getItem('movieDayUser');
                if (userJson) {
                    state.currentUser = JSON.parse(userJson);
                }
                updateUserNav();
            };

            const updateUserNav = () => {
                userAuthNav.innerHTML = '';
                if (state.currentUser) {
                    userAuthNav.innerHTML = `<span class="user-profile-name">Halo, ${state.currentUser.email}!</span><button id="logout-btn" class="user-auth-nav-item">Logout</button>`;
                    document.getElementById('logout-btn').addEventListener('click', handleLogout);
                } else {
                    userAuthNav.innerHTML = `<button id="login-header-btn" class="user-auth-nav-item">Login</button><button id="register-header-btn" class="user-auth-nav-item">Daftar</button>`;
                    document.getElementById('login-header-btn').addEventListener('click', () => open('login'));
                    document.getElementById('register-header-btn').addEventListener('click', () => open('register'));
                }
            };
            
            authModal.addEventListener('click', e => { if(e.target === authModal) close(); });
            authModal.querySelector('.close-modal-btn').addEventListener('click', close);
            
            return { checkStatus, open };
        })();

        // === MOVIE & UI RENDERING ===
        const populateCities = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/Cities');
                const Cities = await response.json();

                citySelect.innerHTML = Cities.map(c => `<option value="${c.city_name}">${c.city_name}</option>`).join('');
                state.selectedCityName = citySelect.value;
                await renderContentForCity();
            } catch (error) {
                console.error("Gagal memuat kota:", error);
                citySelect.innerHTML = '<option>Gagal</option>';
            }
        };
        
        const renderMovieCarousel = (gridElement, Movies, status) => {
            gridElement.innerHTML = '';
            if (Movies && Movies.length > 0) {
                Movies.forEach(movie => {
                    const buttonHtml = status === 'now_showing'
                        ? `<button class="book-now-btn" data-movieid="${movie.movie_id}">Book Now</button>`
                        : `<button class="upcoming-details-btn" data-movieid="${movie.movie_id}">View Details</button>`;
                    
                    const movieCard = document.createElement('div');
                    movieCard.className = 'movie-card';
                    movieCard.innerHTML = `
                        <div class="movie-poster" style="background-image: url('${movie.poster_url || ''}')"></div>
                        <div class="movie-info">
                            <div class="movie-title">${movie.title}</div>
                            ${buttonHtml}
                        </div>`;
                    gridElement.appendChild(movieCard);
                });
            } else {
                gridElement.innerHTML = `<p>Tidak ada film untuk kategori ini.</p>`;
            }
        };

        const renderContentForCity = async () => {
            document.getElementById('now-showing-grid').innerHTML = "<p>Memuat...</p>";
            document.getElementById('upcoming-grid').innerHTML = "<p>Memuat...</p>";
            try {
                const [nsMovies, ucMovies] = await Promise.all([
                    supabase.from('Movies').select('*').eq('status', 'now_showing').eq('city_name', state.selectedCityName),
                    supabase.from('Movies').select('*').eq('status', 'upcoming').eq('city_name', state.selectedCityName)
                ]);

                state.allMovies = [...nsMovies.data, ...ucMovies.data];
                renderMovieCarousel(document.getElementById('now-showing-grid'), nsMovies.data, 'now_showing');
                renderMovieCarousel(document.getElementById('upcoming-grid'), ucMovies.data, 'upcoming');
                
                if (!state.heroSlider) state.heroSlider = new HeroSlider();
                state.heroSlider.updateSlides(state.allMovies);

            } catch (error) {
                console.error("Gagal memuat film:", error);
                document.getElementById('now-showing-grid').innerHTML = "<p>Gagal memuat film Now Showing.</p>";
                document.getElementById('upcoming-grid').innerHTML = "<p>Gagal memuat film Upcoming.</p>";
            }
        };

        // === HERO SLIDER ===
        class HeroSlider {
            constructor() {
                this.sliderEl = document.querySelector('.hero-slider');
                this.dotsContainerEl = document.querySelector('.hero-dots');
                this.currentSlide = 0;
                this.slidesData = [];
                document.getElementById('hero-prev-btn').addEventListener('click', () => this.prev());
                document.getElementById('hero-next-btn').addEventListener('click', () => this.next());
            }
            updateSlides(allMovies) {
                this.slidesData = promoMoviesConfig.map(promo => {
                    const movieData = allMovies.find(m => m.movie_id === promo.movieId);
                    return movieData ? { ...movieData, promoImageUrl: promo.promoImageUrl, trailerUrl: promo.trailerUrl } : null;
                }).filter(Boolean);
                this.init();
            }
            init() {
                this.sliderEl.innerHTML = '';
                this.dotsContainerEl.innerHTML = '';
                if (this.slidesData.length === 0) return;
                this.slidesData.forEach((movie, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'hero-slide';
                    slide.style.backgroundImage = `url('${movie.promoImageUrl}')`;
                    slide.innerHTML = `
                        <div class="hero-content">
                            <h2>${movie.title}</h2>
                            <p>${movie.synopsis.split('\n')[0]}</p>
                            <div class="hero-buttons">
                                <button class="btn book-now" data-movieid="${movie.movie_id}">Book Now</button>
                                <button class="btn watch-trailer" data-trailerurl="${movie.trailerUrl}">Watch Trailer</button>
                            </div>
                        </div>`;
                    this.sliderEl.appendChild(slide);
                    const dot = document.createElement('div');
                    dot.className = 'hero-dot';
                    dot.addEventListener('click', () => this.goTo(index));
                    this.dotsContainerEl.appendChild(dot);
                });
                this.update(); this.start();
            }
            update() { 
                if (this.slidesData.length === 0) return; 
                this.sliderEl.style.transform = `translateX(-${this.currentSlide * 100}%)`; 
                this.dotsContainerEl.childNodes.forEach((d, i) => d.classList.toggle('active', i === this.currentSlide)); 
            }
            goTo(index) { 
                this.currentSlide = index; 
                this.update(); 
            }
            next() { 
                this.currentSlide = (this.currentSlide + 1) % this.slidesData.length; 
                this.update(); 
            }
            prev() { 
                this.currentSlide = (this.currentSlide - 1 + this.slidesData.length) % this.slidesData.length; 
                this.update(); 
            }
            start() { 
                this.slideInterval = setInterval(() => this.next(), 7000); 
            }
        }

        // === GLOBAL EVENT LISTENERS ===
        citySelect.addEventListener('change', () => { 
            state.selectedCityName = citySelect.value; 
            renderContentForCity(); 
            showPage('movie-gallery-page'); 
        });

        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.book-now-btn, .hero-buttons .book-now')) {
                const movie = state.allMovies.find(m => m.movie_id == target.dataset.movieid); 
                if (movie) bookingModule.open(movie);
            } else if (target.matches('.upcoming-details-btn')) {
                const movie = state.allMovies.find(m => m.movie_id == target.dataset.movieid); 
                if (movie) upcomingDetailPage.open(movie);
            } else if (target.matches('.carousel-nav-btn')) {
                const grid = target.parentElement.querySelector('.Movies-grid');
                grid.scrollBy({ left: target.classList.contains('next') ? (grid.clientWidth * 0.9) : -(grid.clientWidth * 0.9), behavior: 'smooth' });
            } else if (target.matches('.hero-buttons .watch-trailer')) {
                trailerModule.open(target.dataset.trailerurl);
            } else if (target.matches('.back-button')) {
                showPage(target.dataset.target);
            } else if (target.matches('#back-to-home-btn')) {
                showPage('movie-gallery-page');
            }
        });

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            authModule.checkStatus();
            populateCities();
            showPage('movie-gallery-page');
        });

    })();