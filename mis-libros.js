const listaLibros = document.getElementById('libros-lista');
const buscador = document.getElementById('buscador-libros');
const detallePanel = document.getElementById('detalle-panel');
const panelAutor = document.getElementById('panel-autor');

let libros = [];
let libroSeleccionadoIdx = null;
let autorSeleccionado = null;
let paginaActual = 1;
const LIBROS_POR_PAGINA = 20;

function cargarLibros() {
    try {
        // Usar el sistema de autenticación si está disponible
        if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
            libros = auth.getUserBooks();
            console.log('Libros cargados del usuario:', libros.length);
        } else {
            // Fallback al sistema anterior si no hay autenticación
            libros = JSON.parse(localStorage.getItem('libros_guardados') || '[]');
            console.log('Libros cargados desde localStorage:', libros.length);
        }
        
        // Ordenar alfabéticamente por autor
        libros.sort((a, b) => {
            const autorA = (a.author || '').toLowerCase();
            const autorB = (b.author || '').toLowerCase();
            if (autorA < autorB) return -1;
            if (autorA > autorB) return 1;
            return 0;
        });
        
        console.log('Libros ordenados y listos para mostrar');
    } catch (error) {
        console.error('Error al cargar libros:', error);
        libros = [];
    }
}

function renderLista(filtro = '') {
    listaLibros.innerHTML = '';
    const filtroLower = filtro.trim().toLowerCase();
    // Filtrar libros
    const librosFiltrados = libros.filter(libro =>
        !filtroLower ||
        (libro.title && libro.title.toLowerCase().includes(filtroLower)) ||
        (libro.author && libro.author.toLowerCase().includes(filtroLower))
    );
    // Tabla
    let html = `<table class="tabla-libros">
        <thead>
            <tr>
                <th>Autor</th>
                <th>Título</th>
                <th>Mi calificación</th>
            </tr>
        </thead>
        <tbody>
    `;
    librosFiltrados.forEach((libro, idx) => {
        const califKey = `myRating_${libro.title}_${libro.author}`;
        const myRating = parseInt(localStorage.getItem(califKey) || '0');
        html += `<tr data-idx="${idx}">
            <td class="tabla-libros-autor">${libro.author}</td>
            <td class="tabla-libros-titulo">${libro.title}</td>
            <td class="tabla-libros-micalif" data-key="${califKey}">${renderStarsInput(myRating)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    listaLibros.innerHTML = html;
    // Lógica de estrellas interactivas
    listaLibros.querySelectorAll('.tabla-libros-micalif').forEach(td => {
        const key = td.getAttribute('data-key');
        td.querySelectorAll('span').forEach((star, i) => {
            star.addEventListener('click', () => {
                localStorage.setItem(key, (i + 1).toString());
                renderLista(buscador.value);
            });
        });
    });
    // Lógica de mostrar portada ampliada
    listaLibros.querySelectorAll('tr[data-idx]').forEach(tr => {
        tr.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-borrar-libro') || e.target.tagName === 'SPAN') return;
            const idx = parseInt(tr.getAttribute('data-idx'));
            const libro = librosFiltrados[idx];
            const src = libro.cover || '';
            const modal = document.getElementById('modal-portada');
            const modalImg = document.getElementById('modal-portada-img');
            modalImg.src = src;
            // Botón buscar más libros de autor
            let btnBuscar = document.getElementById('modal-portada-buscar');
            if (!btnBuscar) {
                btnBuscar = document.createElement('button');
                btnBuscar.id = 'modal-portada-buscar';
                btnBuscar.className = 'modal-portada-buscar-btn';
                modalImg.parentElement.appendChild(btnBuscar);
            }
            btnBuscar.textContent = `Buscar más libros de ${libro.author}`;
            btnBuscar.onclick = () => {
                window.location.href = `index.html?autor=${encodeURIComponent(libro.author)}`;
            };
            // Botón borrar libro
            let btnBorrar = document.getElementById('modal-portada-borrar');
            if (!btnBorrar) {
                btnBorrar = document.createElement('button');
                btnBorrar.id = 'modal-portada-borrar';
                btnBorrar.className = 'modal-portada-borrar-btn';
                modalImg.parentElement.appendChild(btnBorrar);
            }
            btnBorrar.textContent = 'Borrar libro';
            btnBorrar.onclick = () => {
                const idxEnLibros = libros.findIndex(l => l.title === libro.title && l.author === libro.author);
                if (idxEnLibros !== -1) {
                    libros.splice(idxEnLibros, 1);
                    
                    // Usar el sistema de autenticación si está disponible
                    if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
                        auth.removeBook(libro.title, libro.author);
                        console.log('Libro removido del usuario:', auth.getCurrentUser().username);
                    } else {
                        // Fallback al sistema anterior
                        localStorage.setItem('libros_guardados', JSON.stringify(libros));
                    }
                    
                    renderLista(buscador.value);
                }
                modal.style.display = 'none';
            };
            // Alinear botones
            btnBuscar.style.display = 'inline-block';
            btnBuscar.style.width = 'auto';
            btnBuscar.style.marginRight = '1rem';
            btnBorrar.style.display = 'inline-block';
            btnBorrar.style.width = 'auto';
            btnBorrar.style.marginRight = '0';
            modal.style.display = 'flex';
        });
    });
}

function renderPaginacion(totalPaginas) {
    let paginacion = document.getElementById('paginacion-panel');
    if (!paginacion) {
        paginacion = document.createElement('div');
        paginacion.id = 'paginacion-panel';
        paginacion.className = 'paginacion-panel';
        listaLibros.parentElement.appendChild(paginacion);
    }
    paginacion.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = 'paginacion-btn' + (i === paginaActual ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            paginaActual = i;
            renderLista(buscador.value);
            });
        paginacion.appendChild(btn);
        }
}

function mostrarDetalle(idx) {
    libroSeleccionadoIdx = idx;
    renderLista(buscador.value);
    const libro = libros[idx];
    detallePanel.innerHTML = `
        <img src="${libro.cover || ''}" alt="Tapa del libro">
        <div class="detalle-titulo">${libro.title}</div>
        <div class="detalle-autor">${libro.author || ''}</div>
        <div class="detalle-sinopsis">${libro.sinopsis || 'Sin sinopsis.'}</div>
        <button class="detalle-btn" id="borrar-libro-btn">Borrar libro</button>
    `;
    detallePanel.style.display = 'flex';
    document.getElementById('borrar-libro-btn').onclick = function() {
        const libro = libros[idx];
        libros.splice(idx, 1);
        
        // Usar el sistema de autenticación si está disponible
        if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
            auth.removeBook(libro.title, libro.author);
            console.log('Libro removido del usuario:', auth.getCurrentUser().username);
        } else {
            // Fallback al sistema anterior
            localStorage.setItem('libros_guardados', JSON.stringify(libros));
        }
        
        libroSeleccionadoIdx = null;
        cargarLibros();
        renderLista(buscador.value);
        detallePanel.style.display = 'none';
        panelAutor.style.display = 'none';
    };
}

function mostrarPanelAutor(autor) {
    autorSeleccionado = autor;
    const librosAutor = libros.filter(l => l.author === autor);
    if (librosAutor.length === 0) {
        panelAutor.style.display = 'none';
        return;
    }
    panelAutor.innerHTML = `
        <div class="panel-autor-titulo">${autor}</div>
        <ul class="panel-autor-lista">
            ${librosAutor.map((l, idx) => `<li data-idx="${libros.indexOf(l)}">${l.title}</li>`).join('')}
        </ul>
    `;
    panelAutor.style.display = 'flex';
    // Click en título de libro en panel de autor
    panelAutor.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', (e) => {
            const idx = parseInt(li.getAttribute('data-idx'));
            mostrarDetalle(idx);
        });
    });
}

buscador.addEventListener('input', () => {
    libroSeleccionadoIdx = null;
    renderLista(buscador.value);
    detallePanel.style.display = 'none';
    panelAutor.style.display = 'none';
});

// Inicialización
cargarLibros();
renderLista();

function renderStars(n) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span style=\"color:${i <= n ? '#FFD700' : '#ccc'};font-size:1.2rem;\">★</span>`;
    }
    return html;
}

function renderStarsInput(n) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span style=\"color:${i <= n ? '#FFD700' : '#ccc'};font-size:1.2rem;cursor:pointer;\">★</span>`;
    }
    return html;
}

// Modal cerrar
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-portada');
    const closeBtn = document.querySelector('.modal-portada-close');
    const bg = document.querySelector('.modal-portada-bg');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    bg.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}); 