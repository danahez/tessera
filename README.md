# Juegos con amigos

Juegos de fiesta para jugar en grupo con un solo móvil. Es una web que se
instala como app (PWA) y funciona sin conexión una vez abierta.

| Juego | Archivo |
|---|---|
| 🎭 Gestrudis | `juegos/gestrudis.html` |
| 🚫 Tabú | `juegos/tabu.html` |
| 🔊 Sound Charades | `juegos/sound-charades.html` |
| ☝️ Just One | `juegos/just-one.html` |
| ⚖️ Dios en el Bar (debates) | `juegos/debates.html` |

## Estructura

```
index.html             Menú principal con todos los juegos
manifest.webmanifest   Nombre, icono y colores de la app instalada
sw.js                  Service worker: guarda copia para jugar sin conexión
.nojekyll              Indica a GitHub Pages que publique los archivos tal cual
icons/                 Iconos de la app
shared/common.js       Utilidades comunes (mazo sin repeticiones, temporizador,
                       sonido, pantalla encendida, espera para pasar)
shared/turns.js        Motor de turnos/equipos/marcador (Tabú y Sound Charades)
shared/estilo.css      Diseño común de Tabú, Sound Charades y Just One
juegos/                Un archivo HTML por juego
Claude/                Contexto del proyecto para trabajar con IA
_originales/           Copia de las versiones antiguas (NO se sube)
```

## Publicar en GitHub Pages (desde la web, sin comandos)

### 1. Crear el repositorio
1. Entra en <https://github.com> → botón **New** (o **+** → *New repository*).
2. Nombre, por ejemplo `juegos`. Márcalo como **Public**
   (con el plan gratuito, Pages solo funciona en repositorios públicos).
3. **Create repository**.

### 2. Subir los archivos
1. En el repositorio vacío, pulsa **uploading an existing file**
   (o **Add file → Upload files**).
2. Desde el explorador de archivos del ordenador, **arrastra a la página**
   estos elementos (las carpetas se suben con su contenido y respetan la estructura):
   - `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, `.nojekyll`
   - carpetas `icons`, `shared`, `juegos` y `Claude`
3. **No subas** la carpeta `_originales`.
4. Abajo, pulsa **Commit changes**.

> `.nojekyll` es un archivo oculto: si no lo ves, activa "mostrar archivos
> ocultos" (Ctrl+H en Linux). No es imprescindible, pero conviene subirlo.

### 3. Activar la web
1. En el repositorio: **Settings → Pages**.
2. En *Build and deployment*: **Source: Deploy from a branch**,
   rama **main**, carpeta **/ (root)** → **Save**.
3. En un par de minutos estará en `https://TU_USUARIO.github.io/juegos/`
   (la dirección aparece arriba en esa misma página).

## Instalar en el móvil (Android)

Abre la dirección en **Chrome** (no desde el navegador interno de Telegram) →
pulsa **📲 Instalar como app** en el menú, o ⋮ → *Instalar aplicación* /
*Añadir a pantalla de inicio*. Aparecerá el icono como una app más.

## Actualizar o añadir juegos

- **Cambiar un archivo**: en GitHub, entra en el archivo → icono del lápiz ✏️ →
  edita → **Commit changes**. O bien **Add file → Upload files** y sube la nueva
  versión con el mismo nombre dentro de la misma carpeta (la sustituye).
- Con conexión, la app siempre carga la última versión publicada
  (a veces hay que cerrarla y abrirla de nuevo, o esperar un par de minutos).
- **Juego nuevo**:
  1. Sube `mi-juego.html` dentro de la carpeta `juegos`.
  2. En `index.html`, copia uno de los bloques `<a class="game">` y cambia enlace y texto.
  3. En `sw.js`, añade `'juegos/mi-juego.html',` a la lista `PRECACHE`
     y sube un número la versión de `CACHE` (`juegos-v2` → `juegos-v3`) para que funcione sin conexión.

## Probar en el ordenador (opcional)

Abrir los HTML con doble clic funciona para echar un vistazo, aunque el modo
sin conexión y la instalación como app solo funcionan desde la web publicada.
