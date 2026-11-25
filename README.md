# Tessera 🎲

**Juegos de fiesta para jugar con amigos con un solo móvil.**

👉 **Jugar ahora: <https://danahez.github.io/tessera/>**

En la antigua Roma, la *tessera* era la ficha o el dado con el que se jugaba en las reuniones.
Esta es la versión de bolsillo: una colección de juegos para quedar, pasarse el móvil y reírse un rato.
No hace falta que cada uno instale nada, ni crear cuentas, ni tener conexión una vez abierta.

---

## Los juegos

### 🎭 Gestrudis
Mímica por números. Quien presenta elige una carta entre cuatro. Cada carta tiene un tema y seis opciones numeradas del 1 al 6.
Reparte cartas físicas del 1 al 6 a los demás y lee en voz alta qué es cada número. Después empiezan **30 segundos**:
cada jugador hace su mímica (sin hablar, pero con sonidos) mientras quien presenta reparte otras cartas boca abajo intentando adivinar quién es cada número.
Al acabar el tiempo se comprueba si ha acertado todos. No hay puntos: es para reírse.

*Necesitáis dos juegos de cartas o papelitos con los números del 1 al 6: uno para repartir y otro para adivinar.*

### 🚫 Tabú
Describe la palabra sin decir ninguna de las cuatro prohibidas. Tu grupo tiene que adivinarla antes de que se acabe el tiempo.
**Acierto +1 · Tabú −1 · Pasar 0.**

### 🔊 Sound Charades
Haz lo que pone en la pantalla **solo con sonidos**: sin hablar y sin usar los brazos.
De una olla exprés a Chewbacca o un ganso enfadado. Los demás adivinan.

### ☝️ Just One
Sale una palabra secreta. Quien adivina no la ve: el móvil se enseña a los demás.
Cada uno escribe **una sola palabra** de pista, las pistas repetidas se eliminan y quien adivina solo ve las que quedan.
Acierte o falle, se pasa a la siguiente y el móvil va rotando.

### ⚖️ Dios en el Bar
Sale un debate polémico y la app decide al azar qué lado de la mesa defiende cada postura.
Quien sujeta el móvil escucha a los dos bandos y decide quién gana.

---

## Cómo se juega

- **Un solo móvil.** Se pasa de mano en mano o lo sujeta quien presenta.
- **En español o en inglés.** Tabú, Sound Charades y Just One tienen versión en inglés (nivel B1-B2), pensada para jugar con amigos de otros países.
- **Con o sin puntos.** En Tabú y Sound Charades podéis jugar en un solo grupo o en dos equipos,
  con los puntos de cada turno o con un marcador hasta el número de rondas que elijáis.
- **Sin pasar a lo loco.** En Tabú, Sound Charades y Just One, el botón de pasar se bloquea unos segundos
  con cada palabra nueva (se puede cambiar en el menú).
- **Sin repeticiones.** Durante el mismo día no se repite ninguna carta. A partir de las 5:00 de la mañana se vuelve a barajar todo.
- **La pantalla no se apaga** mientras jugáis, y suena un aviso cuando se acaba el tiempo (se puede silenciar).

## Instalarla en el móvil

1. Abre <https://danahez.github.io/tessera/> en **Chrome** (Android) o **Safari** (iPhone).
2. Android: menú ⋮ → **Instalar aplicación** o **Añadir a pantalla de inicio**.
   iPhone: botón de compartir → **Añadir a pantalla de inicio**.
3. Aparecerá como una app más. Ábrela una vez con conexión y después funcionará también sin internet.

---

## Por dentro

Es una web estática hecha con HTML, CSS y JavaScript, sin frameworks ni servidor.
No guarda nada fuera de tu móvil: los ajustes y las cartas que han salido se quedan en el propio navegador.

```
index.html        Menú principal
juegos/           Un archivo por juego, con sus cartas dentro
shared/           Código y estilos comunes (mazo, temporizador, diseño)
sw.js             Permite jugar sin conexión
```

¿Ideas para cartas nuevas o para algún juego más? Se aceptan sugerencias.
