const state = {
    selectedCinema: null,
    selectedShowtime: null,
    selectedSeats: [],
    currentSelectedMovie: null, // Dapat diisi dari movie.js saat film dipilih
};

async function loadCinemas() {
    const cinemaSelect = document.getElementById("cinema-select-dropdown");
    const { data, error } = await supabase.from('cinemas').select('*');
    if (error) {
        console.error("Error loading cinemas:", error);
        return;
    }
    cinemaSelect.innerHTML = data.map(cinema => `<option value="${cinema.name}">${cinema.name}</option>`).join('');
}

async function loadShowtimes(movieId) {
    const showtimeContainer = document.getElementById("showtime-select-container");
    const { data, error } = await supabase.from('showtimes').select('*').eq('movie_id', movieId);
    if (error) {
        console.error("Error loading showtimes:", error);
        return;
    }
    showtimeContainer.innerHTML = data.map(showtime => `<button class="showtime-option-btn">${showtime.time}</button>`).join('');
}

function selectSeat(seat) {
    const seatElement = document.getElementById(seat);
    if (state.selectedSeats.includes(seat)) {
        state.selectedSeats = state.selectedSeats.filter(s => s !== seat);
        seatElement.classList.remove('selected');
    } else {
        if (state.selectedSeats.length < 6) {
            state.selectedSeats.push(seat);
            seatElement.classList.add('selected');
        } else {
            alert("Maksimal 6 kursi dapat dipilih.");
        }
    }
}

async function saveBookingDetails() {
    const bookingDetails = {
        movieId: state.currentSelectedMovie.id,
        cinema: state.selectedCinema,
        showtime: state.selectedShowtime,
        seats: state.selectedSeats,
        totalPrice: calculateTotalPrice(state.selectedSeats.length),
    };

    const { error } = await supabase.from('bookings').insert([bookingDetails]);
    if (error) {
        console.error("Error saving booking:", error);
        alert("Gagal menyimpan pemesanan.");
    } else {
        alert("Pemesanan berhasil!");
        // Lanjutkan ke halaman konfirmasi
        showPage('confirmation-page'); // Pastikan showPage didefinisikan di movie.js
    }
}

function calculateTotalPrice(seatCount) {
    const pricePerSeat = 50000; // Misalnya harga per kursi
    return seatCount * pricePerSeat;
}

document.getElementById('cinema-select-dropdown').addEventListener('change', (e) => {
    state.selectedCinema = e.target.value;
});

document.getElementById('showtime-select-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('showtime-option-btn')) {
        state.selectedShowtime = e.target.innerText;
    }
});

document.getElementById('proceed-to-payment-btn').addEventListener('click', async () => {
    if (!state.selectedCinema || !state.selectedShowtime || state.selectedSeats.length === 0) {
        alert("Silakan lengkapi semua informasi sebelum melanjutkan.");
        return;
    }
    await saveBookingDetails();
});