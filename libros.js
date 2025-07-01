// Configuración de Supabase
const SUPABASE_URL = 'https://pgpoykfqkmyljqztbwyu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncG95a2Zxa215bGpxenRid3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTE0NzQsImV4cCI6MjA2NjU2NzQ3NH0.4aIPCEG85wNtQlJtZf7O2RfvT90UtzU81lddVldp8-4';

// Inicializar Supabase (se inicializa en index.html, aquí solo declaramos)
let supabase;

// Función para obtener la instancia de Supabase
function getSupabase() {
  if (!supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Obtener usuario actual
async function getCurrentUser() {
  const { data: { user } } = await getSupabase().auth.getUser();
  return user;
}

// CRUD Libros
async function fetchLibros() {
  const user = await getCurrentUser();
  console.log('=== FETCH LIBROS - CONSULTA A SUPABASE ===');
  console.log('Usuario actual:', user.id);
  console.log('Consultando tabla: libros');
  console.log('Filtros: userID =', user.id, ', ordenado por created_at DESC');
  
  const { data, error } = await getSupabase()
    .from('libros')
    .select('*')
    .eq('userID', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error en fetchLibros:', error);
    throw error;
  }
  
  console.log('=== RESULTADO DE LA CONSULTA ===');
  console.log('Datos obtenidos de Supabase:', data);
  console.log('Cantidad de registros:', data.length);
  console.log('Variable donde se guardan: data (retornada por la función)');
  
  return data;
}

async function agregarLibro(libro) {
  const user = await getCurrentUser();
  libro.userID = user.id;
  const { error } = await getSupabase().from('libros').insert([libro]);
  if (error) throw error;
}

async function actualizarLibro(id, campos) {
  const user = await getCurrentUser();
  const { error } = await getSupabase()
    .from('libros')
    .update(campos)
    .eq('id', id)
    .eq('userID', user.id);
  if (error) throw error;
}

async function borrarLibro(id) {
  const user = await getCurrentUser();
  const { error } = await getSupabase()
    .from('libros')
    .delete()
    .eq('id', id)
    .eq('userID', user.id);
  if (error) throw error;
}

// CRUD Autores Seguidos
async function fetchAutoresSeguidos() {
  const user = await getCurrentUser();
  const { data, error } = await getSupabase()
    .from('autoresSeguidos')
    .select('autor')
    .eq('userID', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(a => a.autor);
}

async function seguirAutor(autor) {
  const user = await getCurrentUser();
  // Verificar si ya está en la tabla
  const { data, error: fetchError } = await getSupabase()
    .from('autoresSeguidos')
    .select('autor')
    .eq('userID', user.id)
    .eq('autor', autor);
  if (fetchError) throw fetchError;
  if (data && data.length > 0) {
    // Ya está seguido
    throw new Error('YA_SIGUES_AUTOR');
  }
  const { error } = await getSupabase().from('autoresSeguidos').insert([{ autor, userID: user.id }]);
  if (error) throw error;
}

async function dejarDeSeguirAutor(autor) {
  const user = await getCurrentUser();
  const { error } = await getSupabase()
    .from('autoresSeguidos')
    .delete()
    .eq('autor', autor)
    .eq('userID', user.id);
  if (error) throw error;
}

// FUNCIONES PARA GUARDAR LIBROS CON CAMPOS CORRECTOS
async function guardarLibro(libroData, btn) {
    try {
        const user = await getCurrentUser();
        const titulo = libroData.title || libroData.titulo || '';
        const autor = libroData.author || libroData.autor || '';
        // Buscar por título+autor+userID
        const { data: existentes, error: errorExist } = await getSupabase()
          .from('libros')
          .select('*')
          .eq('userID', user.id)
          .eq('titulo', titulo)
          .eq('autor', autor);
        if (errorExist) throw errorExist;
        if (existentes && existentes.length > 0) {
          const libroExistente = existentes[0];
          if (libroExistente.YaLei) {
            mostrarMensajeError('Este libro ya está en "Libros Leídos".');
            return;
          } else if (libroExistente.VoyALeer) {
            // Actualizar a YaLei: true, VoyALeer: false
            await actualizarLibro(libroExistente.id, { YaLei: true, VoyALeer: false });
            mostrarMensajeExito('Libro movido a "Libros Leídos".');
            return;
          }
        }
        const libro = {
            titulo,
            autor,
            portada: libroData.cover || libroData.portada || '',
            sinopsis: libroData.sinopsis || libroData.description || '',
            fechaPublicacion: libroData.publishedDate || libroData.fechaPublicacion || null,
            categoria: libroData.categories && libroData.categories.length > 0 ? libroData.categories[0] : 'Sin categoría',
            YaLei: true,
            VoyALeer: false,
            userID: user.id
        };
        await agregarLibro(libro);
        if (btn) {
            btn.textContent = 'Ya en tu biblioteca';
            btn.disabled = true;
            btn.style.backgroundColor = '#555';
            const toReadBtn = btn.nextElementSibling;
            if (toReadBtn && toReadBtn.textContent.includes('Ya en "Quiero Leer"')) {
                btn.style.backgroundColor = '#2ecc71';
            }
        }
        mostrarMensajeExito('Libro agregado a "Ya lo leí"');
    } catch (error) {
        console.error('Error al guardar libro:', error);
        mostrarMensajeError('Error al guardar el libro: ' + error.message);
    }
}

async function guardarLibroToRead(libroData, btn) {
    try {
        const user = await getCurrentUser();
        const titulo = libroData.title || libroData.titulo || '';
        const autor = libroData.author || libroData.autor || '';
        // Buscar por título+autor+userID
        const { data: existentes, error: errorExist } = await getSupabase()
          .from('libros')
          .select('*')
          .eq('userID', user.id)
          .eq('titulo', titulo)
          .eq('autor', autor);
        if (errorExist) throw errorExist;
        if (existentes && existentes.length > 0) {
          const libroExistente = existentes[0];
          if (libroExistente.VoyALeer) {
            mostrarMensajeError('Este libro ya está en "Quiero Leer".');
            return;
          } else if (libroExistente.YaLei) {
            // Actualizar a VoyALeer: true (opcional: YaLei puede quedar true)
            await actualizarLibro(libroExistente.id, { VoyALeer: true });
            mostrarMensajeExito('Libro agregado a "Quiero Leer".');
            return;
          }
        }
        const libro = {
            titulo,
            autor,
            portada: libroData.cover || libroData.portada || '',
            sinopsis: libroData.sinopsis || libroData.description || '',
            fechaPublicacion: libroData.publishedDate || libroData.fechaPublicacion || null,
            categoria: libroData.categories && libroData.categories.length > 0 ? libroData.categories[0] : 'Sin categoría',
            YaLei: false,
            VoyALeer: true,
            userID: user.id
        };
        await agregarLibro(libro);
        if (btn) {
            btn.textContent = 'Ya en "Quiero Leer"';
            btn.disabled = true;
            btn.style.backgroundColor = '#555';
            const readBtn = btn.previousElementSibling;
            if (readBtn && readBtn.textContent.includes('Ya en tu biblioteca')) {
                btn.style.backgroundColor = '#2ecc71';
            }
        }
        mostrarMensajeExito('Libro agregado a "Quiero leer"');
    } catch (error) {
        console.error('Error al guardar libro en "Quiero Leer":', error);
        mostrarMensajeError('Error al guardar el libro: ' + error.message);
    }
}

// Funciones auxiliares para mostrar mensajes
function mostrarMensajeExito(mensaje) {
    // Crear un mensaje temporal de éxito
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);

    // Remover después de 3 segundos
    setTimeout(() => {
        if (mensajeDiv.parentNode) {
            mensajeDiv.parentNode.removeChild(mensajeDiv);
        }
    }, 3000);
}

function mostrarMensajeError(mensaje) {
    // Crear un mensaje temporal de error
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    mensajeDiv.textContent = mensaje;
    document.body.appendChild(mensajeDiv);

    // Remover después de 5 segundos
    setTimeout(() => {
        if (mensajeDiv.parentNode) {
            mensajeDiv.parentNode.removeChild(mensajeDiv);
        }
    }, 5000);
}

// Funciones de autenticación (ya no necesarias aquí, se manejan en login.html)
async function register(email, password) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password
  });
  if (error) {
    alert('Error al registrarse: ' + error.message);
  } else {
    alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
  }
}

async function login(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    alert('Error al iniciar sesión: ' + error.message);
  } else {
    alert('¡Bienvenido!');
    window.location.href = 'index.html';
  }
}

async function logout() {
  await getSupabase().auth.signOut();
  window.location.href = 'login.html';
}


// Función para renderizar la vista de estantería de libros
function renderBookshelfView(libros, filterType = 'all') {
  const panelMisLibros = document.getElementById('panel-mis-libros');
  if (!panelMisLibros) return;

  // Actualizar las variables globales para que funcione el borrado
  window.librosLeidosPanel = libros.filter(libro => libro.YaLei);
  window.librosALeerPanel = libros.filter(libro => libro.VoyALeer);

  // Filtrar libros según el tipo
  let librosAMostrar = libros;
  let tituloSeccion = 'Todos mis libros';
  
  if (filterType === 'read') {
    librosAMostrar = libros.filter(libro => libro.YaLei);
    tituloSeccion = 'Libros Leídos';
  } else if (filterType === 'toRead') {
    librosAMostrar = libros.filter(libro => libro.VoyALeer);
    tituloSeccion = 'Quiero Leer';
  }

  let html = `
    <div class="bookshelf-container">
      <div class="bookshelf-controls">
        <h2 style="color: #f8991c; margin-bottom: 1rem;">${tituloSeccion} (${librosAMostrar.length})</h2>
        <select id="bookshelf-filter" onchange="filterBookshelf(this.value)">
          <option value="all" ${filterType === 'all' ? 'selected' : ''}>Todos los libros</option>
          <option value="read" ${filterType === 'read' ? 'selected' : ''}>Solo leídos</option>
          <option value="toRead" ${filterType === 'toRead' ? 'selected' : ''}>Solo quiero leer</option>
        </select>
      </div>
      <div class="bookshelf">
  `;

  if (librosAMostrar.length === 0) {
    html += `
      <div style="text-align: center; padding: 3rem; color: #888;">
        <h3>No tienes libros en esta categoría</h3>
        <p>¡Ve a "Buscar libros" para agregar algunos!</p>
      </div>
    `;
  } else {
    const librosLeidos = librosAMostrar.filter(libro => libro.YaLei);
    const librosARead = librosAMostrar.filter(libro => libro.VoyALeer);
    if (librosLeidos.length > 0 && filterType !== 'toRead') {
      html += `
        <div class="shelf">
          <h3>Libros Leídos (${librosLeidos.length})</h3>
          <div class="books-grid">
      `;
      librosLeidos.forEach(libro => {
        html += `
          <div class="book-cover-item" data-id="${libro.id}">
            <img src="${libro.portada || 'placeholder-cover.jpg'}" alt="${libro.titulo}">
            <div class="book-info-overlay">
              <p class="book-info-overlay-title">${libro.titulo}</p>
              <p class="book-info-overlay-author">${libro.autor}</p>
            </div>
            <button class="delete-book-x" title="Borrar libro">&times;</button>
          </div>
        `;
      });
      html += `</div></div>`;
    }
    if (librosARead.length > 0 && filterType !== 'read') {
      html += `
        <div class="shelf">
          <h3>Quiero Leer (${librosARead.length})</h3>
          <div class="books-grid">
      `;
      librosARead.forEach(libro => {
        html += `
          <div class="book-cover-item" data-id="${libro.id}">
            <img src="${libro.portada || 'placeholder-cover.jpg'}" alt="${libro.titulo}">
            <div class="book-info-overlay">
              <p class="book-info-overlay-title">${libro.titulo}</p>
              <p class="book-info-overlay-author">${libro.autor}</p>
            </div>
            <button class="delete-book-x" title="Borrar libro">&times;</button>
          </div>
        `;
      });
      html += `</div></div>`;
    }
  }
  html += `</div></div>`;
  panelMisLibros.innerHTML = html;
  document.querySelectorAll('.book-cover-item').forEach(item => {
    // Agregar event listener al botón de borrado existente
    const deleteBtn = item.querySelector('.delete-book-x');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const libroId = item.dataset.id;
        let libro = window.librosLeidosPanel.find(l => l.id == libroId) || window.librosALeerPanel.find(l => l.id == libroId);
        // Si no se encuentra por id, buscar por título y autor
        if (!libro || !libro.id) {
          const title = item.querySelector('.book-info-overlay-title')?.innerText || item.querySelector('img')?.alt;
          const author = item.querySelector('.book-info-overlay-author')?.innerText;
          libro = window.librosLeidosPanel.find(l => l.titulo === title && l.autor === author) ||
                  window.librosALeerPanel.find(l => l.titulo === title && l.autor === author);
        }
        if (!libro || !libro.id) {
          console.warn('No se encontró el id del libro para borrar:', libro);
          return mostrarMensajeError('No se puede borrar: el libro no tiene un ID válido.');
        }
        // Si el libro está en Quiero Leer, mostrar modal con tres opciones
        if (libro.VoyALeer && !libro.YaLei) {
          mostrarModalMoverOBorrarLibro(libro, async (accion) => {
            if (accion === 'borrar') {
              try {
                await borrarLibro(libro.id);
                mostrarMensajeExito('Libro borrado correctamente');
                const libros = await fetchLibros();
                renderBookshelfView(libros, 'toRead');
              } catch (error) {
                mostrarMensajeError('Error al borrar el libro: ' + (error.message || error));
              }
            } else if (accion === 'mover') {
              try {
                await actualizarLibro(libro.id, { VoyALeer: false, YaLei: true });
                mostrarMensajeExito('Libro movido a "Libros Leídos"');
                const libros = await fetchLibros();
                renderBookshelfView(libros, 'toRead');
              } catch (error) {
                mostrarMensajeError('Error al mover el libro: ' + (error.message || error));
              }
            }
            // Si cancela, no hacer nada
          });
          return;
        }
        // Si el libro está en Libros Leídos, mostrar modal con dos opciones
        if (libro.YaLei) {
          mostrarModalBorrarLibroLeido(libro, async (accion) => {
            if (accion === 'borrar') {
              try {
                await borrarLibro(libro.id);
                mostrarMensajeExito('Libro borrado correctamente');
                const libros = await fetchLibros();
                renderBookshelfView(libros, 'read');
              } catch (error) {
                mostrarMensajeError('Error al borrar el libro: ' + (error.message || error));
              }
            }
            // Si cancela, no hacer nada
          });
          return;
        }
        // Si no, comportamiento normal (borrar)
      });
    }
    // Click normal: abrir detalle
    item.addEventListener('click', () => {
      const libroId = item.dataset.id;
      const libro = window.librosLeidosPanel.find(l => l.id == libroId);
      mostrarPanelDetalleLibro(libro, item);
    });
  });
}

// Función para filtrar la estantería (llamada desde el select)
function filterBookshelf(filterType) {
  fetchLibros().then(libros => {
    renderBookshelfView(libros, filterType);
  });
}

// === INICIO PANEL AUTORES SEGUIDOS (renderFollowedAuthorsView) ===
async function renderFollowedAuthorsView() {
  // DEBUG: Log para saber si la función se ejecuta
  console.log('[DEBUG] Ejecutando renderFollowedAuthorsView');

  // Seleccionar el aside correcto dentro de main-panel-flex
  const mainPanel = document.querySelector('#panel-autores-seguidos .main-panel-flex');
  const autoresSidebar = mainPanel ? mainPanel.querySelector('#autores-sidebar') : document.getElementById('autores-sidebar');
  if (!autoresSidebar) {
    console.warn('[DEBUG] No se encontró el aside #autores-sidebar');
    return;
  }

  // Obtener autores seguidos
  const autores = await fetchAutoresSeguidos();

  let html = `
    <div id="autores-sidebar-controls">
      <input type="search" id="author-sidebar-search" placeholder="Buscar en mis autores...">
      <select id="author-sidebar-sort">
        <option value="relevance">Ordenar por Relevancia</option>
        <option value="alphabetical">Ordenar Alfabéticamente</option>
      </select>
    </div>
    <ul id="followed-authors-list">
  `;

  if (autores.length === 0) {
    html += `<li style="color: #888; font-style: italic;">No sigues a ningún autor aún</li>`;
  } else {
    autores.forEach(autor => {
      html += `
        <li data-autor="${autor}">
          <div class="autor-list-row">
            <span class="autor-nombre-lista">${autor}</span>
            <button class="autor-remove-btn" title="Dejar de seguir">&times;</button>
          </div>
        </li>
      `;
    });
  }

  html += `</ul>`;
  autoresSidebar.innerHTML = html;

  // DEBUG: Log del HTML generado
  console.log('[DEBUG] HTML generado para autores seguidos:', autoresSidebar.innerHTML);

  // Búsqueda y orden
  const searchInput = document.getElementById('author-sidebar-search');
  const sortSelect = document.getElementById('author-sidebar-sort');
  const listContainer = document.getElementById('followed-authors-list');

  let authorData = autores.map(name => ({ name }));

  function renderList(authorsToRender) {
    listContainer.innerHTML = '';
    if (authorsToRender.length === 0) {
      listContainer.innerHTML = '<p style="color:#888; text-align:center; padding:1rem;">No sigues a ningún autor o ninguno coincide con la búsqueda.</p>';
      return;
    }
    authorsToRender.forEach(author => {
      const li = document.createElement('li');
      li.dataset.autor = author.name;
      li.innerHTML = `
        <div class="autor-list-row">
          <span class="autor-nombre-lista">${author.name}</span>
          <button class="autor-remove-btn" title="Dejar de seguir">&times;</button>
        </div>
      `;
      li.addEventListener('click', () => {
        listContainer.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        if (typeof renderMyBooksForAuthor === 'function') {
          renderMyBooksForAuthor(author.name);
        }
      });
      li.querySelector('.autor-remove-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        mostrarModalConfirmacionBorrarAutor(author.name, li);
      });
      listContainer.appendChild(li);
    });
  }

  sortSelect.addEventListener('change', () => {
    let sorted = [...authorData];
    if (sortSelect.value === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    renderList(sorted.filter(author => author.name.toLowerCase().includes(searchInput.value.toLowerCase())));
  });

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = authorData.filter(author => author.name.toLowerCase().includes(searchTerm));
    renderList(filteredData);
  });

  renderList(authorData);
}
// === FIN PANEL AUTORES SEGUIDOS (renderFollowedAuthorsView) ===

function mostrarModalConfirmacionBorrarAutor(autor, liElement) {
  // Si ya hay un modal, lo eliminamos
  document.querySelectorAll('.modal-confirm-borrar-autor').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal-confirm-borrar-autor';
  modal.innerHTML = `
    <div class="modal-confirm-content">
      <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">Dejar de seguir autor?</p>
      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="modal-cancel-btn">Cancelar</button>
        <button class="modal-accept-btn">Aceptar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Centrar modal
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  Object.assign(modal.querySelector('.modal-confirm-content').style, {
    background: '#232526',
    borderRadius: '12px',
    padding: '2rem 2.5rem',
    minWidth: '280px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    color: '#f5f5f5',
    textAlign: 'center',
  });
  modal.querySelector('.modal-cancel-btn').onclick = () => modal.remove();
  modal.querySelector('.modal-accept-btn').onclick = async () => {
    await dejarDeSeguirAutor(autor);
    modal.remove();
    liElement.remove();
  };
}

function mostrarPanelDetalleLibro(libro, elementoReferencia) {
  // Si el libro no tiene id, intento buscarlo en la lista global de libros por título y autor (y portada)
  if (!libro.id && window.librosLeidosPanel) {
    const encontrado = window.librosLeidosPanel.find(l => {
      const titMatch = l.titulo === libro.title || l.titulo === libro.titulo;
      const autMatch = l.autor === libro.author || l.autor === libro.autor;
      const portMatch = (l.portada && (l.portada === libro.cover || l.portada === libro.portada)) || true;
      return titMatch && autMatch && portMatch;
    });
    if (encontrado) {
      libro.id = encontrado.id;
    }
  }
  if (!libro.id && window.librosALeerPanel) {
    const encontrado = window.librosALeerPanel.find(l => {
      const titMatch = l.titulo === libro.title || l.titulo === libro.titulo;
      const autMatch = l.autor === libro.author || l.autor === libro.autor;
      const portMatch = (l.portada && (l.portada === libro.cover || l.portada === libro.portada)) || true;
      return titMatch && autMatch && portMatch;
    });
    if (encontrado) {
      libro.id = encontrado.id;
    }
  }
  if (!libro.id) {
  }
  // Cerrar cualquier panel de detalle abierto y fondo
  document.querySelectorAll('.panel-detalle-libro').forEach(p => p.remove());
  document.querySelectorAll('.detalle-panel-bg').forEach(bg => bg.remove());

  // Crear fondo difuminado/oscuro
  const bg = document.createElement('div');
  bg.className = 'detalle-panel-bg';
  bg.style.position = 'fixed';
  bg.style.top = '0';
  bg.style.left = '0';
  bg.style.width = '100vw';
  bg.style.height = '100vh';
  bg.style.background = 'rgba(0,0,0,0.55)';
  bg.style.zIndex = 9999;
  bg.style.backdropFilter = 'blur(2px)';
  // Cerrar panel al hacer click en el fondo
  bg.addEventListener('click', () => {
    panel.remove();
    bg.remove();
  });
  document.body.appendChild(bg);

  // Crear el panel principal (dos columnas)
  const panel = document.createElement('div');
  panel.className = 'panel-detalle-libro';
  panel.style.background = '#232526';
  panel.style.borderRadius = '18px';
  panel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
  panel.style.padding = '2rem 2rem 1.5rem 2rem';
  panel.style.position = 'fixed';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.height = '';
  panel.style.minHeight = '0';
  panel.style.paddingBottom = '1.5rem';
  panel.style.justifyContent = 'flex-start';
  panel.style.boxSizing = 'border-box';
  panel.style.zIndex = 10000;
  panel.style.width = 'min(700px, 95vw)';
  panel.style.maxWidth = '700px';
  panel.style.left = '50%';
  panel.style.top = '50%';
  panel.style.transform = 'translate(-50%, -50%)';

  // --- NUEVO LAYOUT PANEL DETALLE ---
  // 1. Título en un div de ancho completo
  const tituloDiv = document.createElement('div');
  tituloDiv.innerText = libro.title;
  tituloDiv.style.color = '#f8991c';
  tituloDiv.style.fontWeight = '700';
  tituloDiv.style.fontSize = '1.25rem';
  tituloDiv.style.marginBottom = '1.1rem';
  tituloDiv.style.textAlign = 'left';
  tituloDiv.style.width = '100%';
  panel.appendChild(tituloDiv);

  // 2. Wrapper de columnas
  const columnsWrapper = document.createElement('div');
  columnsWrapper.style.display = 'flex';
  columnsWrapper.style.flexDirection = 'row';
  columnsWrapper.style.gap = '1.2rem';
  columnsWrapper.style.width = '100%';
  columnsWrapper.style.alignItems = 'stretch';
  columnsWrapper.style.height = '100%';

  // Columna izquierda: autor y portada
  const col1 = document.createElement('div');
  col1.style.display = 'flex';
  col1.style.flexDirection = 'column';
  col1.style.alignItems = 'flex-start';
  col1.style.justifyContent = 'flex-start';
  col1.style.flex = '0 0 180px';
  col1.style.minWidth = '140px';
  col1.style.maxWidth = '200px';
  col1.style.height = '100%';

  // Autor
  const autor = document.createElement('div');
  autor.innerText = libro.author;
  autor.style.color = '#ccc';
  autor.style.fontSize = '1rem';
  autor.style.textAlign = 'left';
  autor.style.marginBottom = '0.7rem';
  autor.style.cursor = 'pointer';
  autor.style.textDecoration = 'underline';
  autor.title = 'Haz click para seguir a este autor';
  autor.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const user = await getCurrentUser();
      const { data } = await getSupabase()
        .from('autoresSeguidos')
        .select('autor')
        .eq('userID', user.id)
        .eq('autor', libro.author);
      if (data && data.length > 0) {
        mostrarMensajeExito(`Ya sigues a "${libro.author}"`);
        return;
      }
      if (confirm(`¿Quieres seguir al autor "${libro.author}"?`)) {
        await seguirAutor(libro.author);
        mostrarMensajeExito(`Ahora sigues a "${libro.author}"`);
      }
    } catch (err) {
      if (err.message === 'YA_SIGUES_AUTOR') {
        mostrarMensajeExito(`Ya sigues a "${libro.author}"`);
      } else {
        mostrarMensajeError('No se pudo seguir al autor: ' + (err.message || err));
      }
    }
  });
  col1.appendChild(autor);

  // Portada
  const portada = document.createElement('img');
  portada.src = libro.cover || libro.portada || 'placeholder-cover.jpg';
  portada.alt = `Portada de ${libro.title}`;
  portada.style.width = '140px';
  portada.style.height = '200px';
  portada.style.objectFit = 'cover';
  portada.style.borderRadius = '12px';
  portada.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
  col1.appendChild(portada);

  // Columna derecha: sinopsis
  const col2 = document.createElement('div');
  col2.style.display = 'flex';
  col2.style.flexDirection = 'column';
  col2.style.flex = '1 1 0';
  col2.style.alignItems = 'stretch';
  col2.style.position = 'relative';
  col2.style.height = '100%';

  // Sinopsis
  const sinopsisDiv = document.createElement('div');
  sinopsisDiv.className = 'detalle-modal-sinopsis';
  sinopsisDiv.style.background = '#181a1b';
  sinopsisDiv.style.borderRadius = '10px';
  sinopsisDiv.style.padding = '1.2rem';
  sinopsisDiv.style.height = '100%';
  sinopsisDiv.style.overflowY = 'auto';
  sinopsisDiv.style.fontSize = '0.95rem';
  sinopsisDiv.style.lineHeight = '1.6';
  sinopsisDiv.style.color = '#dcdcdc';
  sinopsisDiv.style.border = '1px solid #2d2d2d';
  sinopsisDiv.innerText = libro.sinopsis || 'No hay sinopsis disponible.';
  col2.appendChild(sinopsisDiv);

  columnsWrapper.appendChild(col1);
  columnsWrapper.appendChild(col2);
  panel.appendChild(columnsWrapper);

  document.body.appendChild(panel);
}

// Función para renderizar la sección de sugerencias
function renderSugerenciasView() {
  console.log('Función renderSugerenciasView ejecutándose');
  
  const panelSugerencias = document.getElementById('panel-sugerencias');
  if (!panelSugerencias) {
    console.error('No se encontró el elemento #panel-sugerencias');
    return;
  }
  console.log('Panel de sugerencias encontrado:', panelSugerencias);

  // Menú de categorías
  let html = `
    <div class="sugerencias-container">
      <h2 class="suggestion-list-title">Sugerencias de Lectura</h2>
      <div class="nyt-lists-nav">
        <button class="nyt-list-pill active" onclick="renderListadoSugerencias('bestsellers')">Bestsellers</button>
        <button class="nyt-list-pill" onclick="renderListadoSugerencias('fiction')">Ficción</button>
        <button class="nyt-list-pill" onclick="renderListadoSugerencias('nonfiction')">No Ficción</button>
        <button class="nyt-list-pill" onclick="renderListadoSugerencias('manga')">Manga</button>
      </div>
      <div id="sugerencias-content"></div>
    </div>
  `;
  panelSugerencias.innerHTML = html;
  console.log('HTML de sugerencias agregado al DOM');
  renderListadoSugerencias('bestsellers');
}

// Nuevo renderizado del listado de sugerencias
window.renderListadoSugerencias = function(categoria) {
  console.log('Función renderListadoSugerencias ejecutándose');
  console.log('Categoría:', categoria);
  
  const content = document.getElementById('sugerencias-content');
  if (!content) {
    console.error('No se encontró el elemento #sugerencias-content');
    return;
  }
  console.log('Elemento content encontrado:', content);

  // Ejemplo de datos (puedes reemplazar por datos reales)
  const sugerencias = {
    bestsellers: [
      { title: 'El Señor de los Anillos', author: 'J.R.R. Tolkien', description: 'Una épica aventura fantástica', cover: 'https://via.placeholder.com/120x180?text=LOTR' },
      { title: '1984', author: 'George Orwell', description: 'Una distopía clásica sobre el control totalitario', cover: 'https://via.placeholder.com/120x180?text=1984' },
      { title: 'Cien años de soledad', author: 'Gabriel García Márquez', description: 'Realismo mágico en su máxima expresión', cover: 'https://via.placeholder.com/120x180?text=100A' }
    ],
    fiction: [
      { title: 'Dune', author: 'Frank Herbert', description: 'Ciencia ficción épica en un desierto interestelar', cover: 'https://via.placeholder.com/120x180?text=Dune' },
      { title: 'El nombre del viento', author: 'Patrick Rothfuss', description: 'Una historia de magia y música', cover: 'https://via.placeholder.com/120x180?text=Kvothe' }
    ],
    nonfiction: [
      { title: 'Sapiens', author: 'Yuval Noah Harari', description: 'Una breve historia de la humanidad', cover: 'https://via.placeholder.com/120x180?text=Sapiens' }
    ],
    manga: [
      { title: 'One Piece', author: 'Eiichiro Oda', description: 'Aventuras piratas en busca del tesoro', cover: 'https://via.placeholder.com/120x180?text=One+Piece' }
    ]
  };
  const libros = sugerencias[categoria] || [];
  console.log('Libros a renderizar:', libros);
  
  let html = `<div class="nyt-list">`;
  libros.forEach((libro, index) => {
    html += `
      <div class="nyt-book-item" data-index="${index}">
        <div class="nyt-item-rank">${index + 1}</div>
        <div class="nyt-item-info">
          <div class="nyt-title">${libro.title}</div>
          <div class="nyt-author">por ${libro.author}</div>
          <div class="nyt-description">${libro.description}</div>
        </div>
        <div class="nyt-item-cover">
          <img src="${libro.cover}" alt="${libro.title}">
        </div>
      </div>
    `;
  });
  html += `</div>`;
  content.innerHTML = html;
  console.log('HTML generado y agregado al DOM');

  // Hover y click para abrir modal
  const items = content.querySelectorAll('.nyt-book-item');
  console.log('Elementos .nyt-book-item encontrados:', items.length);
  
  items.forEach((item, index) => {
    console.log(`Agregando event listeners al item ${index}`);
    item.style.cursor = 'pointer';
    item.addEventListener('mouseenter', () => {
      item.classList.add('nyt-book-item-hover');
    });
    item.addEventListener('mouseleave', () => {
      item.classList.remove('nyt-book-item-hover');
    });
    item.addEventListener('click', function() {
      console.log('Click en libro de sugerencia detectado');
      const idx = parseInt(item.getAttribute('data-index'));
      const libro = libros[idx];
      console.log('Libro seleccionado:', libro);
      console.log('Función mostrarModalSugerenciaLibro:', typeof mostrarModalSugerenciaLibro);
      mostrarModalSugerenciaLibro(libro);
    });
  });
  console.log('Event listeners agregados');
};

// Modal para mostrar detalles y sumar a listas
window.mostrarModalSugerenciaLibro = async function(libro) {
  document.querySelectorAll('.modal-sugerencia-libro').forEach(m => m.remove());

  // Modal con layout de dos columnas y botones abajo
  const modal = document.createElement('div');
  modal.className = 'modal-sugerencia-libro';
  modal.innerHTML = `
    <div class="modal-sugerencia-content" style="max-width: 900px; min-width: 340px; display: flex; flex-direction: column; align-items: stretch;">
      <button class="modal-close-btn" style="position:absolute;top:1.2rem;right:1.2rem;font-size:2rem;background:none;border:none;color:#fff;cursor:pointer;">&times;</button>
      <h2 style="color:#f8991c;margin-bottom:0.5rem;font-size:2.1rem;text-align:left;">${libro.title}</h2>
      <div style="margin-bottom:1.5rem;text-align:left;">
        <span class="modal-sugerencia-autor" style="color:#f5f5f5;font-size:1.15rem;text-decoration:underline;cursor:pointer;">${libro.author}</span>
      </div>
      <div style="display:flex;gap:2.5rem;align-items:flex-start;justify-content:stretch;">
        <div style="flex:0 0 180px;display:flex;justify-content:center;align-items:flex-start;">
          <img src="${libro.cover}" alt="${libro.title}" style="width:180px;height:260px;object-fit:cover;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
        </div>
        <div style="flex:1;">
          <div style="background:#181a1b;border-radius:18px;padding:1.6rem 1.5rem;color:#dcdcdc;font-size:1.08rem;line-height:1.6;min-height:180px;max-height:320px;overflow-y:auto;">${libro.description || 'Sin descripción disponible'}</div>
        </div>
      </div>
      <div style="display:flex;gap:1.2rem;justify-content:center;margin-top:2.5rem;">
        <button class="modal-leido-btn" style="background:#f8991c;color:#181a1b;border:none;border-radius:12px;padding:0.9rem 2.6rem;font-size:1.13rem;font-weight:700;cursor:pointer;">Ya lo leí</button>
        <button class="modal-quiero-btn" style="background:#3498db;color:#fff;border:none;border-radius:12px;padding:0.9rem 2.6rem;font-size:1.13rem;font-weight:700;cursor:pointer;">Lo quiero leer</button>
      </div>
    </div>
  `;
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  document.body.appendChild(modal);
  modal.querySelector('.modal-close-btn').onclick = () => modal.remove();
  modal.querySelector('.modal-leido-btn').onclick = async () => {
    try {
      await guardarLibroDesdeSugerencia(libro);
      mostrarMensajeExito('Libro agregado a "Libros Leídos"');
      modal.remove();
    } catch (error) {
      console.error('Error al guardar libro:', error);
      mostrarMensajeError('Error al agregar el libro');
    }
  };
  modal.querySelector('.modal-quiero-btn').onclick = async () => {
    try {
      await guardarLibroToReadDesdeSugerencia(libro);
      mostrarMensajeExito('Libro agregado a "Quiero Leer"');
      modal.remove();
    } catch (error) {
      console.error('Error al guardar libro:', error);
      mostrarMensajeError('Error al agregar el libro');
    }
  };
  // Autor clickeable (puedes agregar funcionalidad si lo deseas)
  modal.querySelector('.modal-sugerencia-autor').onclick = () => {
    mostrarMensajeExito('¿Quieres seguir a ' + libro.author + '? (Funcionalidad opcional)');
  };
};

// Funciones específicas para el modal de sugerencias
async function guardarLibroDesdeSugerencia(libroData) {
  try {
    const user = await getCurrentUser();
    const titulo = libroData.title || libroData.titulo || '';
    const autor = libroData.author || libroData.autor || '';
    // Buscar por título+autor+userID
    const { data: existentes, error: errorExist } = await getSupabase()
      .from('libros')
      .select('*')
      .eq('userID', user.id)
      .eq('titulo', titulo)
      .eq('autor', autor);
    if (errorExist) throw errorExist;
    if (existentes && existentes.length > 0) {
      const libroExistente = existentes[0];
      if (libroExistente.YaLei) {
        mostrarMensajeError('Este libro ya está en "Libros Leídos".');
        return;
      } else if (libroExistente.VoyALeer) {
        // Actualizar a YaLei: true, VoyALeer: false
        await actualizarLibro(libroExistente.id, { YaLei: true, VoyALeer: false });
        mostrarMensajeExito('Libro movido a "Libros Leídos".');
        return;
      }
    }
    // Si no existe, crear
    const libro = {
      titulo,
      autor,
      portada: libroData.cover || libroData.portada || '',
      sinopsis: libroData.sinopsis || libroData.description || '',
      fechaPublicacion: libroData.publishedDate || libroData.fechaPublicacion || null,
      categoria: libroData.categories && libroData.categories.length > 0 ? libroData.categories[0] : 'Sin categoría',
      YaLei: true,
      VoyALeer: false,
      userID: user.id
    };
    await agregarLibro(libro);
    mostrarMensajeExito('Libro agregado a "Libros Leídos"');
  } catch (error) {
    console.error('Error al guardar libro desde sugerencia:', error);
    throw error;
  }
}

async function guardarLibroToReadDesdeSugerencia(libroData) {
  try {
    const user = await getCurrentUser();
    const titulo = libroData.title || libroData.titulo || '';
    const autor = libroData.author || libroData.autor || '';
    // Buscar por título+autor+userID
    const { data: existentes, error: errorExist } = await getSupabase()
      .from('libros')
      .select('*')
      .eq('userID', user.id)
      .eq('titulo', titulo)
      .eq('autor', autor);
    if (errorExist) throw errorExist;
    if (existentes && existentes.length > 0) {
      const libroExistente = existentes[0];
      if (libroExistente.VoyALeer) {
        mostrarMensajeError('Este libro ya está en "Quiero Leer".');
        return;
      } else if (libroExistente.YaLei) {
        // Actualizar a VoyALeer: true (opcional: YaLei puede quedar true)
        await actualizarLibro(libroExistente.id, { VoyALeer: true });
        mostrarMensajeExito('Libro agregado a "Quiero Leer".');
        return;
      }
    }
    // Si no existe, crear
    const libro = {
      titulo,
      autor,
      portada: libroData.cover || libroData.portada || '',
      sinopsis: libroData.sinopsis || libroData.description || '',
      fechaPublicacion: libroData.publishedDate || libroData.fechaPublicacion || null,
      categoria: libroData.categories && libroData.categories.length > 0 ? libroData.categories[0] : 'Sin categoría',
      YaLei: false,
      VoyALeer: true,
      userID: user.id
    };
    await agregarLibro(libro);
    mostrarMensajeExito('Libro agregado a "Quiero Leer"');
  } catch (error) {
    console.error('Error al guardar libro en "Quiero Leer" desde sugerencia:', error);
    throw error;
  }
}

// Hacer las funciones disponibles globalmente
window.guardarLibro = guardarLibro;
window.guardarLibroToRead = guardarLibroToRead;
window.guardarLibroDesdeSugerencia = guardarLibroDesdeSugerencia;
window.guardarLibroToReadDesdeSugerencia = guardarLibroToReadDesdeSugerencia;
window.mostrarMensajeExito = mostrarMensajeExito;
window.mostrarMensajeError = mostrarMensajeError;
window.mostrarPanelDetalleLibro = mostrarPanelDetalleLibro;

// Función para limpiar completamente la sesión
async function limpiarSesionCompleta() {
  try {
    // Cerrar sesión en Supabase
    await getSupabase().auth.signOut();
    
    // Limpiar localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cookies relacionadas con Supabase
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Redirigir a login
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error al limpiar sesión:', error);
    // Forzar redirección de todas formas
    window.location.href = 'login.html';
  }
}

// Hacer la función disponible globalmente
window.limpiarSesionCompleta = limpiarSesionCompleta; 

// Variables globales para los paneles
window.librosLeidosPanel = [];
window.librosALeerPanel = [];

async function renderLibrosLeidosDirecto() {
  const panel = document.getElementById('panel-mis-libros');
  if (!panel) return;
  panel.innerHTML = '<div style="color:#f8991c;padding:2rem;text-align:center;">Cargando libros...</div>';

  // Obtener usuario actual
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) {
    panel.innerHTML = '<div style="color:#e74c3c;padding:2rem;text-align:center;">No autenticado</div>';
    return;
  }

  // Consultar libros leídos directamente de Supabase
  const { data: libros, error } = await getSupabase()
    .from('libros')
    .select('*')
    .eq('userID', user.id)
    .eq('YaLei', true)
    .order('created_at', { ascending: false });

  if (error) {
    panel.innerHTML = '<div style="color:#e74c3c;padding:2rem;text-align:center;">Error al cargar libros</div>';
    return;
  }

  if (!libros || libros.length === 0) {
    panel.innerHTML = '<div style="color:#888;padding:2rem;text-align:center;">No tienes libros leídos</div>';
    return;
  }

  // Console.log con todos los datos de libros leídos (renderLibrosLeidosDirecto)
  console.log('=== DATOS DE LIBROS LEÍDOS (renderLibrosLeidosDirecto) ===');
  console.log('Variable: libros (local)');
  libros.forEach((libro, index) => {
    console.log(`Libro Leído ${index + 1} - ID: ${libro.id}`, {
      id: libro.id,
      titulo: libro.titulo,
      autor: libro.autor,
      portada: libro.portada,
      sinopsis: libro.sinopsis,
      fechaPublicacion: libro.fechaPublicacion,
      categoria: libro.categoria,
      YaLei: libro.YaLei,
      VoyALeer: libro.VoyALeer,
      rating: libro.rating,
      notas: libro.notas,
      created_at: libro.created_at,
      userID: libro.userID
    });
  });

  let html = `<div class="shelf"><h3>Libros Leídos (${libros.length})</h3><div class="books-grid">`;
  libros.forEach(libro => {
    html += `
      <div class="book-cover-item" data-id="${libro.id}">
        <img src="${libro.portada || 'placeholder-cover.jpg'}" alt="${libro.titulo}">
        <div class="book-info-overlay">
          <p class="book-info-overlay-title">${libro.titulo}</p>
          <p class="book-info-overlay-author">${libro.autor}</p>
        </div>
        <button class="delete-book-x" title="Borrar libro">&times;</button>
      </div>
    `;
  });
  html += `</div></div>`;
  panel.innerHTML = html;

  // Listeners para borrar
  document.querySelectorAll('.book-cover-item .delete-book-x').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const item = btn.closest('.book-cover-item');
      const libroId = item.dataset.id;
      if (!libroId) return;
      mostrarModalMoverOBorrarLibro(libros.find(l => l.id == libroId), async (accion) => {
        if (accion === 'borrar') {
          try {
            await borrarLibro(libroId);
            renderLibrosLeidosDirecto();
          } catch (err) {
            alert('Error al borrar el libro');
          }
        }
      });
    });
  });

  // Listener para abrir detalle
  const portadaItems = document.querySelectorAll('.book-cover-item');
  console.log('Agregando listeners a portadas:', portadaItems.length);
  portadaItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-book-x')) return;
      const libroId = item.dataset.id;
      const libro = libros.find(l => l.id == libroId);
      if (libro) {
        console.log('Libro clickeado:', libro);
        mostrarPanelDetalleLibro(libro, item);
      } else {
        console.warn('No se encontró el libro para el id:', libroId);
      }
    });
  });
}

// Modal para Quiero Leer (tres opciones)
function mostrarModalMoverOBorrarLibro(libro, callback) {
  // Eliminar modales previos
  document.querySelectorAll('.modal-mover-borrar-libro').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal-mover-borrar-libro';
  modal.innerHTML = `
    <div class="modal-mover-borrar-content" style="font-family: 'Inter', sans-serif; background: #232526; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); padding: 2.2rem 2.5rem 1.5rem 2.5rem; min-width: 340px; max-width: 95vw; color: #f5f5f5; text-align: center;">
      <p style="margin-bottom: 2.2rem; font-size: 1.18rem; font-weight: 500; color: #f5f5f5; letter-spacing: 0.1px;">¿Ya leíste el libro o lo quieres borrar?</p>
      <div style="display: flex; gap: 1.2rem; justify-content: center;">
        <button class="modal-mover-btn" style="background: #f8991c; color: #181a1b; border: none; border-radius: 18px; padding: 0.7rem 2.2rem; font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: background 0.2s, color 0.2s;">Ya lo leí</button>
        <button class="modal-borrar-btn" style="background: #f8991c; color: #181a1b; border: none; border-radius: 18px; padding: 0.7rem 2.2rem; font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: background 0.2s, color 0.2s;">Borrar</button>
        <button class="modal-cancel-btn" style="background: #444; color: #fff; border: none; border-radius: 18px; padding: 0.7rem 2.2rem; font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: background 0.2s, color 0.2s;">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  // Hover para los botones
  const moverBtn = modal.querySelector('.modal-mover-btn');
  const borrarBtn = modal.querySelector('.modal-borrar-btn');
  const cancelarBtn = modal.querySelector('.modal-cancel-btn');
  moverBtn.onmouseover = () => moverBtn.style.background = '#ffb347';
  moverBtn.onmouseout = () => moverBtn.style.background = '#f8991c';
  borrarBtn.onmouseover = () => borrarBtn.style.background = '#ffb347';
  borrarBtn.onmouseout = () => borrarBtn.style.background = '#f8991c';
  cancelarBtn.onmouseover = () => cancelarBtn.style.background = '#888';
  cancelarBtn.onmouseout = () => cancelarBtn.style.background = '#444';
  cancelarBtn.onclick = () => { modal.remove(); callback('cancelar'); };
  borrarBtn.onclick = () => { modal.remove(); callback('borrar'); };
  moverBtn.onclick = () => { modal.remove(); callback('mover'); };
}

// Modal para Libros Leídos (dos opciones)
function mostrarModalBorrarLibroLeido(libro, callback) {
  // Eliminar modales previos
  document.querySelectorAll('.modal-mover-borrar-libro').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal-mover-borrar-libro';
  modal.innerHTML = `
    <div class="modal-mover-borrar-content" style="font-family: 'Inter', sans-serif; background: #232526; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); padding: 2.2rem 2.5rem 1.5rem 2.5rem; min-width: 320px; max-width: 95vw; color: #f5f5f5; text-align: center;">
      <p style="margin-bottom: 2.2rem; font-size: 1.18rem; font-weight: 500; color: #f5f5f5; letter-spacing: 0.1px;">¿Estás seguro de que quieres borrar este libro?</p>
      <div style="display: flex; gap: 1.2rem; justify-content: center;">
        <button class="modal-borrar-btn" style="background: #f8991c; color: #181a1b; border: none; border-radius: 8px; padding: 0.7rem 2.2rem; font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: background 0.2s, color 0.2s;">Borrar</button>
        <button class="modal-cancel-btn" style="background: #444; color: #fff; border: none; border-radius: 8px; padding: 0.7rem 2.2rem; font-size: 1.05rem; font-weight: 600; cursor: pointer; transition: background 0.2s, color 0.2s;">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0', left: '0', right: '0', bottom: '0',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });
  // Hover para los botones
  const borrarBtn = modal.querySelector('.modal-borrar-btn');
  const cancelarBtn = modal.querySelector('.modal-cancel-btn');
  borrarBtn.onmouseover = () => borrarBtn.style.background = '#ffb347';
  borrarBtn.onmouseout = () => borrarBtn.style.background = '#f8991c';
  cancelarBtn.onmouseover = () => cancelarBtn.style.background = '#888';
  cancelarBtn.onmouseout = () => cancelarBtn.style.background = '#444';
  cancelarBtn.onclick = () => { modal.remove(); callback('cancelar'); };
  borrarBtn.onclick = () => { modal.remove(); callback('borrar'); };
}

l