// --- Elementos ---
const form = document.getElementById('book-form');
const titleInput = document.getElementById('title');
const resultadosLista = document.getElementById('resultados-lista');
const resultadoDetalle = document.getElementById('resultado-detalle');
const bookPanel = document.getElementById('book-panel');
const bookCoverPreview = document.getElementById('book-cover-preview');
const bookTitle = document.getElementById('book-title');
const bookAuthor = document.getElementById('book-author');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const reseñasDiv = document.getElementById('reseñas');
const sinopsisDiv = document.getElementById('sinopsis');
const myReviewTextarea = document.getElementById('my-review');
const starRating = document.getElementById('star-rating');
const saveReviewBtn = document.getElementById('save-review');
const savedReviewMsg = document.getElementById('saved-review-msg');
const saveBookBtn = document.getElementById('save-book');
const coverSuggestions = document.getElementById('cover-suggestions');
const ordenContainer = document.getElementById('orden-container');
const ordenSelect = document.getElementById('orden-select');
const checkTitulo = document.getElementById('check-titulo');
const checkAutor = document.getElementById('check-autor');

let currentBookData = null;
let currentCoverDataUrl = '';
let myReview = '';
let myStars = 0;
let resultados = [];
let seleccionadoIdx = null;
let resultadosOriginal = [];
let ordenActual = 'none';

// --- Tabs ---
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabContents.forEach(tc => tc.style.display = 'none');
        document.getElementById(btn.dataset.tab).style.display = 'block';
    });
});

// --- Buscar libro en Google Books y sugerir portadas ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultadosLista.style.display = 'none';
    resultadoDetalle.style.display = 'none';
    resultadosLista.innerHTML = 'Buscando...';
    seleccionadoIdx = null;
    ordenContainer.style.display = 'none';
    // Resetear el menú de orden a 'calificación' y la variable de orden
    ordenSelect.value = 'rating';
    ordenActual = 'rating';
    const texto = titleInput.value.trim();
    // Construir query según los checklists
    let query = '';
    if (checkTitulo.checked && checkAutor.checked) {
        query = `intitle:${encodeURIComponent(texto)}+inauthor:${encodeURIComponent(texto)}`;
    } else if (checkTitulo.checked) {
        query = `intitle:${encodeURIComponent(texto)}`;
    } else if (checkAutor.checked) {
        query = `inauthor:${encodeURIComponent(texto)}`;
    } else {
        resultadosLista.innerHTML = '<div style="color:#f5f5f5;">Selecciona al menos una opción: Título o Autor.</div>';
        resultadosLista.style.display = 'block';
        return;
    }
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=20&printType=books&langRestrict=es`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            resultados = data.items.map(item => item.volumeInfo);
            resultadosOriginal = [...resultados];
            ordenContainer.style.display = 'flex';
            // Ordenar por calificación antes de mostrar
            resultados = [...resultados].sort((a, b) => {
                if (typeof b.averageRating === 'number' && typeof a.averageRating === 'number') {
                    return b.averageRating - a.averageRating;
                }
                if (typeof b.averageRating === 'number') return 1;
                if (typeof a.averageRating === 'number') return -1;
                return 0;
            });
            renderResultados();
            resultadosLista.style.display = 'block';
        } else {
            resultadosLista.innerHTML = '<div style="color:#f5f5f5;">No se encontraron resultados.</div>';
            resultadoDetalle.innerHTML = '';
            ordenContainer.style.display = 'none';
            resultadosLista.style.display = 'block';
        }
    } catch (err) {
        resultadosLista.innerHTML = '<div style="color:#f5f5f5;">Error al buscar libros.</div>';
        resultadoDetalle.innerHTML = '';
        ordenContainer.style.display = 'none';
        resultadosLista.style.display = 'block';
    }
});

ordenSelect.addEventListener('change', () => {
    ordenActual = ordenSelect.value;
    if (ordenActual === 'none') {
        resultados = [...resultadosOriginal];
    } else if (ordenActual === 'rating') {
        resultados = [...resultados].sort((a, b) => {
            // Si ambos tienen calificación, ordenar de mayor a menor
            if (typeof b.averageRating === 'number' && typeof a.averageRating === 'number') {
                return b.averageRating - a.averageRating;
            }
            // Si solo uno tiene calificación, ese va primero
            if (typeof b.averageRating === 'number') return 1;
            if (typeof a.averageRating === 'number') return -1;
            // Si ninguno tiene calificación, mantener el orden
            return 0;
        });
    } else if (ordenActual === 'alpha') {
        resultados = [...resultados].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', {sensitivity: 'base'}));
    }
    renderResultados();
});

function renderResultados() {
    let html = '';
    resultados.forEach((libro, idx) => {
        const cover = libro.imageLinks && libro.imageLinks.thumbnail ? libro.imageLinks.thumbnail : 'https://via.placeholder.com/70x70?text=Sin+Portada';
        const title = libro.title || '';
        const author = libro.authors ? libro.authors.join(', ') : 'Autor desconocido';
        const rating = libro.averageRating || 0;
        const ratingsCount = libro.ratingsCount ? libro.ratingsCount.toLocaleString('es-ES') : '0';
        html += `
        <div class="book-search-card" data-idx="${idx}">
            <img class="book-search-cover" src="${cover}" alt="Portada del libro">
            <div class="book-search-info">
                <div class="book-search-title">${title}</div>
                <div class="book-search-author">${author}</div>
                <div class="book-search-rating">
                    ${renderEstrellasHTML(rating)}
                </div>
                <div class="book-search-rating-count" style="color:#f5f5f5; font-size:0.95rem; margin-top:0.1rem;">
                    ${ratingsCount} calificaciones
                </div>
            </div>
            <button class="book-search-add-btn" data-idx="${idx}">Agregar</button>
        </div>
        `;
    });
    resultadosLista.innerHTML = html;
    resultadosLista.style.display = 'block';
    resultadosLista.querySelectorAll('.book-search-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            guardarLibro(idx, btn);
        });
    });
    // Mostrar detalle al hacer click en la tarjeta (opcional, puedes quitar si no lo quieres)
    resultadosLista.querySelectorAll('.book-search-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar que el click en el botón de agregar dispare el detalle
            if (e.target.classList.contains('book-search-add-btn')) return;
            const idx = parseInt(card.getAttribute('data-idx'));
            renderDetalle(idx);
        });
    });
}

function renderEstrellasHTML(n) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="star${i > n ? ' empty' : ''}">★</span>`;
    }
    return html;
}

function guardarLibro(idx, btn) {
    const libro = resultados[idx];
        const libroAGuardar = {
            title: libro.title || '',
            author: libro.authors ? libro.authors.join(', ') : '',
            cover: libro.imageLinks && libro.imageLinks.thumbnail ? libro.imageLinks.thumbnail : '',
            sinopsis: libro.description || '',
            review: '',
            stars: libro.averageRating || 0
        };
        let libros = JSON.parse(localStorage.getItem('libros_guardados') || '[]');
        libros.push(libroAGuardar);
        localStorage.setItem('libros_guardados', JSON.stringify(libros));
    btn.textContent = '¡Guardado!';
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = 'Agregar';
        btn.disabled = false;
    }, 2000);
}

function renderDetalle(idx) {
    const libro = resultados[idx];
    const sinopsis = libro.description ? libro.description : 'Sin sinopsis disponible.';
    resultadoDetalle.innerHTML = `
        <img class="resultado-tapa" src="${libro.imageLinks && libro.imageLinks.thumbnail ? libro.imageLinks.thumbnail : ''}" alt="Tapa del libro">
        <div class="resultado-info">
            <div class="resultado-titulo">${libro.title || ''}</div>
            <div class="resultado-autor">${libro.authors ? libro.authors.join(', ') : ''}</div>
            <div class="resultado-estrellas">${renderEstrellas(libro.averageRating)}</div>
            <button id="btn-escuchar-sinopsis" style="margin-bottom:0.7rem;background:#232526;color:#39ff14;border:none;border-radius:6px;padding:0.3rem 1rem;cursor:pointer;font-weight:600;align-self:flex-end;">🔊 Escuchar sinopsis</button>
        </div>
        <div class="resultado-sinopsis-panel">
            <div id="texto-sinopsis">${sinopsis}</div>
        </div>
    `;
    resultadoDetalle.style.display = 'block';
    // Posicionar el panel de detalle a la altura del item seleccionado
    const card = document.querySelector(`.book-search-card[data-idx='${idx}']`);
    if (card) {
        const mainBusqueda = document.querySelector('.main-busqueda');
        const cardRect = card.getBoundingClientRect();
        const mainRect = mainBusqueda.getBoundingClientRect();
        // Calcular el top relativo al contenedor principal
        const top = cardRect.top - mainRect.top + mainBusqueda.scrollTop;
        resultadoDetalle.style.top = top + 'px';
    } else {
        resultadoDetalle.style.top = '0px';
    }
    // Lógica de síntesis de voz
    const btnEscuchar = document.getElementById('btn-escuchar-sinopsis');
    let utterance = null;
    btnEscuchar.addEventListener('click', () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btnEscuchar.textContent = '🔊 Escuchar sinopsis';
            return;
        }
        const texto = document.getElementById('texto-sinopsis').textContent;
        utterance = new window.SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        btnEscuchar.textContent = '⏹️ Detener';
        utterance.onend = () => {
            btnEscuchar.textContent = '🔊 Escuchar sinopsis';
    };
        window.speechSynthesis.speak(utterance);
    });
}

function renderEstrellas(n) {
    if (!n) return '';
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span style="color:${i <= n ? '#FFD700' : '#ccc'};">★</span>`;
    }
    return html;
}

// --- Guardar reseña personal ---
saveReviewBtn.addEventListener('click', () => {
    myReview = myReviewTextarea.value.trim();
    if (myReview && myStars > 0) {
        localStorage.setItem('myReview_' + (currentBookData?.title || titleInput.value), JSON.stringify({review: myReview, stars: myStars}));
        savedReviewMsg.style.display = 'block';
        setTimeout(() => savedReviewMsg.style.display = 'none', 2000);
    }
});

// --- Votación de estrellas ---
starRating.querySelectorAll('span').forEach(star => {
    star.addEventListener('click', () => {
        myStars = parseInt(star.dataset.star);
        setStars(myStars);
    });
});
function setStars(n) {
    starRating.querySelectorAll('span').forEach(star => {
        star.style.color = (parseInt(star.dataset.star) <= n) ? '#FFD700' : '#ccc';
    });
}

// --- Guardar libro completo ---
saveBookBtn.addEventListener('click', () => {
    if (!currentBookData) return;
    const libro = {
        title: currentBookData.title || titleInput.value,
        author: (currentBookData.authors && currentBookData.authors.join(', ')) || '',
        cover: currentCoverDataUrl,
        sinopsis: currentBookData.description || '',
        review: myReviewTextarea.value.trim(),
        stars: myStars
    };
    let libros = JSON.parse(localStorage.getItem('libros_guardados') || '[]');
    libros.push(libro);
    localStorage.setItem('libros_guardados', JSON.stringify(libros));
    saveBookBtn.textContent = '¡Guardado!';
    setTimeout(() => saveBookBtn.textContent = 'Guardar libro', 2000);
}); 