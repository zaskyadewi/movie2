import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://zebviyfgdkcialzohcjv.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYnZpeWZnZGtjaWFsem9oY2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDg3ODQsImV4cCI6MjA2NjY4NDc4NH0.1_DYT7pxzNWlC36FTx8cW0cgWIrWFI-59q1iV3VMg_k"
);

async function simpanMovie() {
    const movieId = document.getElementById("movie_id").value;
    const nama = document.getElementById("nama").value;
    const total_kursi = parseInt(document.getElementById("total_kursi").value);
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const status = document.getElementById("status").value;
    const Harga = parseInt(document.getElementById("Harga").value);
    const deskripsi = document.getElementById("deskripsi").value;

    let result;

    if (movieId && movieId !== "") {
        result = await supabase
            .from("movie")
            .update({ nama, total_kursi, start, end, status, Harga, deskripsi })
            .eq("id", movieId);
    } else {
        result = await supabase
            .from("movie")
            .insert([{ nama, total_kursi, start, end, status, Harga, deskripsi }]);
    }

    if (result.error) {
        console.error(result.error);
        alert("Gagal menyimpan data");
    } else {
        alert(movieId ? "Data berhasil diperbarui" : "Data berhasil ditambahkan");
        resetForm();
        loadMovies();
    }
}


async function loadMovies() {
    const tableBody = document.querySelector("#movieTable tbody");
    tableBody.innerHTML = "";

    const { data, error } = await supabase.from("movie").select("*");

    if (error) {
        console.error("Gagal memuat data:", error);
        return;
    }

    data.forEach((movie, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${movie.nama}</td>
            <td>${movie.total_kursi}</td>
            <td>${movie.start}</td>
            <td>${movie.end}</td>
            <td>${movie.status}</td>
            <td>${movie.Harga}</td>
            <td>${movie.deskripsi}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editMovie(${movie.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMovie(${movie.id})">Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


async function deleteMovie(id) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    const { error } = await supabase.from("movie").delete().eq("id", id);
    if (error) {
        console.error(error);
        alert("Gagal menghapus data");
    } else {
        alert("Data berhasil dihapus");
        loadMovies();
    }
}

async function editMovie(id) {
    const { data, error } = await supabase.from("movie").select("*").eq("id", id).single();
    if (error) {
        console.error(error);
        alert("Gagal mengambil data");
        return;
    }

    // Isi form dengan data yang mau di-edit
    document.getElementById("movie_id").value = data.id;
    document.getElementById("nama").value = data.nama;
    document.getElementById("total_kursi").value = data.total_kursi;
    document.getElementById("start").value = data.start;
    document.getElementById("end").value = data.end;
    document.getElementById("status").value = data.status;
    document.getElementById("Harga").value = data.Harga;
    document.getElementById("deskripsi").value = data.deskripsi;

    // Ganti teks tombol jadi "Update"
    const tombol = document.querySelector("button[onclick='simpanMovie()']");
    tombol.textContent = "Update";
    tombol.classList.remove("btn-primary");
    tombol.classList.add("btn-warning");
}


function resetForm() {
    document.getElementById("movie_id").value = "";
    document.getElementById("nama").value = "";
    document.getElementById("total_kursi").value = "";
    document.getElementById("start").value = "";
    document.getElementById("end").value = "";
    document.getElementById("status").value = "";
    document.getElementById("Harga").value = "";
    document.getElementById("deskripsi").value = "";

    // Balikin tombol jadi "Simpan"
    const tombol = document.querySelector("button[onclick='simpanMovie()']");
    tombol.textContent = "Simpan";
    tombol.classList.remove("btn-warning");
    tombol.classList.add("btn-primary");
}

async function loadMovieGallery() {
    const { data, error } = await supabase.from("movie").select("*");

    if (error) {
        console.error("Gagal mengambil data film:", error);
        return;
    }

    const nowShowingContainer = document.getElementById("now-showing-grid");
    const upcomingContainer = document.getElementById("upcoming-grid");

    // Kosongkan dulu kontainer
    nowShowingContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";

    data.forEach(movie => {
        const card = document.createElement("div");
        card.className = "movie-card";
        card.innerHTML = `
            <div class="movie-thumbnail">
                <img src="${movie.poster || 'https://via.placeholder.com/150x220?text=No+Poster'}" alt="${movie.nama}">
            </div>
            <div class="movie-info">
                <h4>${movie.nama}</h4>
                <p class="movie-description">${movie.deskripsi || ''}</p>
                <button class="btn btn-sm btn-primary">Book Now</button>
            </div>
        `;

        if (movie.status.toLowerCase() === "now showing") {
            nowShowingContainer.appendChild(card);
        } else if (movie.status.toLowerCase() === "up comming") {
            upcomingContainer.appendChild(card);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadMovieGallery();
});
window.editMovie = editMovie;
window.deleteMovie = deleteMovie;

loadMovies();

window.simpanMovie = simpanMovie;