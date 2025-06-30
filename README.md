# 📚 Sistema de Gestión de Libros

Un sistema web para gestionar tu colección de libros con búsqueda, categorización y gestión completa.

## ✨ Características

- **Búsqueda de libros** usando Google Books API
- **Gestión de libros leídos** y lista de "Quiero leer"
- **Categorización inteligente** - un libro puede estar en ambas listas
- **Interfaz moderna y responsive**
- **Autenticación de usuarios** con Supabase
- **Base de datos en la nube** para persistencia de datos
- **Indicadores visuales** para libros en múltiples categorías

## 🚀 Instalación

1. **Clona o descarga** los archivos del proyecto
2. **Inicia el servidor local**:
   ```bash
   python3 -m http.server 8000
   ```
3. **Abre en tu navegador**:
   - http://localhost:8000/login.html (página de login)
   - http://localhost:8000 (página principal con todas las funcionalidades)

## 📖 Cómo Funciona

- **Autenticación**: Sistema de login/registro con Supabase
- **Búsqueda**: Busca libros por título o autor usando Google Books API
- **"Ya lo leí"**: Marca libros como leídos
- **"Lo quiero leer"**: Agrega libros a tu lista de lectura futura
- **Categorías múltiples**: Un libro puede estar tanto en "leídos" como en "quiero leer"
- **Gestión completa**: Mueve libros entre categorías, quita de listas específicas o borra completamente

## 🛠️ Estructura del Proyecto

```
MisAudiolibros/
├── index.html              # Página principal con todas las funcionalidades
├── login.html              # Página de autenticación
├── libros.js               # Lógica de búsqueda y gestión de libros
├── libros.css              # Estilos de la aplicación
└── README.md               # Este archivo
```

## 🎯 Funcionalidades Principales

### Autenticación
- **Registro**: Crear cuenta nueva con email y contraseña
- **Login**: Iniciar sesión con credenciales existentes
- **Logout**: Cerrar sesión y redirigir a login

### Navegación
- **Buscar libros**: Búsqueda en Google Books API
- **Autores que sigo**: Gestión de autores seguidos
- **Libros leídos**: Vista de todos los libros marcados como leídos
- **Quiero leer**: Vista de todos los libros en tu lista de lectura
- **Sugerencias**: Listas de libros recomendados

### Gestión de Libros
- **Marcar como leído**: Agrega a "Libros leídos" sin quitar de "Quiero leer"
- **Agregar a "Quiero leer"**: Agrega a la lista sin quitar de "Leídos"
- **Quitar de esta lista**: Solo quita de la categoría actual
- **Borrar completamente**: Elimina el libro de todas las listas
- **Indicadores visuales**: Círculo verde para libros en ambas categorías

### Características Avanzadas
- **Búsqueda por autor**: Redirección automática con búsqueda
- **Cambio de portadas**: Subir imágenes personalizadas
- **Calificaciones**: Sistema de estrellas para calificar libros
- **Síntesis de voz**: Escuchar sinopsis de libros
- **Seguir autores**: Sistema para seguir autores favoritos

## 📝 Notas Técnicas

- **Base de datos**: Supabase (PostgreSQL en la nube)
- **Autenticación**: Supabase Auth con email/password
- **Almacenamiento**: Datos persistentes en la nube
- **Responsive**: Interfaz optimizada para móviles y desktop
- **API**: Integración con Google Books para búsqueda de libros

## 🔧 Configuración de Supabase

El proyecto está configurado para usar Supabase con las siguientes tablas:

### Tabla `libros`
- `id` (text, primary key)
- `title` (text)
- `author` (text)
- `cover` (text, URL de la imagen)
- `sinopsis` (text)
- `publishedDate` (text)
- `category` (text)
- `isRead` (boolean)
- `toRead` (boolean)
- `calificacion` (smallint)
- `notas` (text)
- `userID` (uuid, foreign key a auth.users)
- `created_at` (timestamp)

### Tabla `autoresSeguidos`
- `id` (uuid, primary key)
- `autor` (text)
- `userID` (uuid, foreign key a auth.users)
- `created_at` (timestamp)

---

¡Disfruta organizando tu colección de libros! 📖✨ 