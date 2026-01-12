const board = document.getElementById('gameBoard');
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const moveCounter = document.getElementById('moveCounter');
const timeCounter = document.getElementById('timeCounter');
const messageBox = document.getElementById('message');
const scoreList = document.getElementById('scoreList');

const saveBox = document.getElementById('saveScoreBox');
const scoreNameInput = document.getElementById('scoreNameInput');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const saveError = document.getElementById('saveError');
const music = document.getElementById('backgroundMusic');

// Audio para melodías por tiempos (mejor/peor/medio)
let specialAudio = null;

let musicPlaying = false;
let cards = ['casillas/final_fase.jpg',
  'casillas/knuckles_risa.jpg',
  'casillas/robotnik.jpg',
  'casillas/sonic_and_tails.jpg',
  'casillas/sonic_esquiando.jpg',
  'casillas/sonic_mirando_arriba.jpg',
  'casillas/sonic_robot.jpg',
  'casillas/sonic_run.jpg',
  'casillas/super_esmeralda.jpg',
  'casillas/tails.jpg',
];
let cardValues = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let gameStarted = false;
let timer = null;
let time = 0; // centésimas
let matchedPairs = 0;
const totalPairs = cards.length;


// La base de datos usada es Firebase de Google (en cada uno lo tengo bien, pero aquí pongo de ejemplo tu_loquesea)
const firebaseConfig = {
  
  apiKey: "tu_apiKey",

  authDomain: "tu_authDomain",

  databaseURL: "tu_databaseURL",

  projectId: "tu_projectId",

  storageBucket: "tu_storageBucket",

  messagingSenderId: "tu_messagingSenderId",

  appId: "tu_appId"

};

// Inicialización
const app = firebase.initializeApp(firebaseConfig);

// Firestore en vez de Realtime DB
const db = firebase.firestore();

startBtn.addEventListener('click', empezarPartida);
endBtn.addEventListener('click', () => terminarPartida(false));
saveScoreBtn.addEventListener('click', guardarTiempo);

document.addEventListener('DOMContentLoaded', () => {
  actualizarListaTiempos();
});


/* FUNCIÓN PARA EL INICIO DE LA PARTIDA */
function empezarPartida() {
  // Marcamos que la partida está en curso
  gameStarted = true;

  // Bloqueamos el tablero mientras se generan las cartas
  lockBoard = true;

  // Limpiamos resultados anteriores
  const container = document.getElementById('result-container'); // Obtenemos el contenedor de resultados

  // Lo vaciamos
  container.innerHTML = '';

  // Lo ocultamos
  container.style.display = 'none';

  // Reiniciamos variables de la partida
  moves = 0;                               // Movimientos a 0
  matchedPairs = 0;                        // Parejas encontradas a 0
  time = 0;                                // Tiempo a 0
  timeCounter.textContent = formatoTiempo(0); // Mostramos tiempo "00:00:00"
  moveCounter.textContent = '0';           // Mostramos 0 movimientos
  messageBox.textContent = '';             // Quitamos mensajes previos
  board.innerHTML = '';                    // Borramos cartas anteriores
  saveBox.style.display = 'none';          // Ocultamos el cuadro de guardar nick
  scoreNameInput.value = '';               // Limpiamos el input del nick
  saveError.textContent = '';              // Quitamos mensajes de error previos

  // Habilitamos botón terminar juego y deshabilitamos botón empezar juego
  endBtn.disabled = false;
  startBtn.disabled = true;

  // Si la música no está sonando, la arrancamos
  if (!musicPlaying) {

    music.volume = 0.2; // Bajamos el volumen al 2%, para que no se escuche muy alto

    // Si se reproduce bien, marcamos que está sonando
    music.play()
      .then(() => musicPlaying = true)
      .catch(err => console.warn('No se pudo reproducir música:', err)); // Si falla, mostramos error
  }

  // Nos aseguramos de que no haya cronómetro corriendo anteriormente
  clearInterval(timer); 

  // Reiniciamos cartas seleccionadas
  firstCard = null;
  secondCard = null;

  // Creamos lista de imágenes duplicadas, para formar parejas
  const images = [
    'casillas/final_fase.jpg',
    'casillas/knuckles_risa.jpg',
    'casillas/robotnik.jpg',
    'casillas/sonic_and_tails.jpg',
    'casillas/sonic_esquiando.jpg',
    'casillas/sonic_mirando_arriba.jpg',
    'casillas/sonic_robot.jpg',
    'casillas/sonic_run.jpg',
    'casillas/super_esmeralda.jpg',
    'casillas/tails.jpg',
  ];

  // Y la "barajamos"
  cardValues = [...images, ...images].sort(() => 0.5 - Math.random());

  // Generamos las cartas en el tablero
  cardValues.forEach((value) => {

    // Creamos carta conenedora
    const card = document.createElement('div');

    // Le aplicamos css
    card.classList.add('card');

    // Se guarda el valor (la imagen) en data-value
    card.dataset.value = value;

    // Creamos un nuevo contenedor para el efecto flip
    const inner = document.createElement('div');
    inner.classList.add('card-inner');

    // Creamos el contenedor para la cara trasera de la carta (la inicial)
    const back = document.createElement('div');
    back.classList.add('card-face', 'back-face');

    // Creamos la imagen frontal de la carta
    const front = document.createElement('img');
    front.classList.add('card-face', 'front-face')
    front.src = value; // Asignamos la imagen
    front.alt = value.split('/').pop().split('.')[0]; // Texto alternativo (nombre de archivo)

    // Armamos la estructura de la carta y añadimos la carta al tablero
    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    board.appendChild(card);

    // Se añade el evento de click para voltear carta
    card.addEventListener('click', () => clicEnCasilla(card));
  });

  // La animación de entrada de cartas (selecciona todas las cartas)
  const allCards = document.querySelectorAll('.card');

  // Entrada de cartas
  allCards.forEach((card, index) => {
    //Al principio son invisibles
    card.style.opacity = '0';

    setTimeout(() => {
      // Efecto de suavizado
      card.style.transition = 'opacity 0.5s ease';

      // Van apareciendo poco a poco
      card.style.opacity = '1';

      // Cuando aparece la última carta
      if (index === allCards.length - 1) {
        // Desbloquea el tablero
        lockBoard = false;
        
        // Inicia el tiempo de partida
        timer = setInterval(() => {
          time++; // Pasa el tiempo por centésimas
          timeCounter.textContent = formatoTiempo(time); // Se muestra el tiempo de partida en pantalla
        }, 10); // Cada 10 ms
      }
    }, 100 * index); // Retraso escalonado para cada carta
  });

  actualizarListaTiempos(); // Mientras, se va actualizando la lista de mejores tiempos en paralelo
}




/* FUNCIÓN PARA EL FINAL DE LA PARTIDA */
// La función es asincrona, la cual recibe si la partida se ha ganado (true) o perdido (false)
async function terminarPartida(won) {
  // Pasamos la partida a false (es decir, se terminó)
  gameStarted = false;

  // Se nbloquea el tablero para que no se pueda seguir jugando
  lockBoard = true;

  // Si el temporizador está activo
  if (timer) {
    clearInterval(timer); // Lo detenemos
    timer = null; // Y lo eliminamos
  }

  // Entonces se guarda el tiempo final de la partida
  const finalTime = time;

  // Aparece el tiempo formateado en el marcador
  timeCounter.textContent = formatoTiempo(finalTime);

  // Si la música está sonando se pausa y se reinicia
  if (music) {
    try {
      music.pause();
      music.currentTime = 0;
    } catch (e) { }

    // Actualizamos la música para indicar que ya no está sonando
    musicPlaying = false;
  }

  // Si había algún sonido sonando lo paramos y reiniciamos
  if (specialAudio) { 
    try {
      specialAudio.pause();
      specialAudio.currentTime = 0;
    } catch (e) { }
    specialAudio = null;
  }

  // Se desactiva el botón "Terminar"
  endBtn.disabled = true;

  // Desactivamos el botón "Iniciar" hasta que se guarde el resultado
  startBtn.disabled = true;

  // Se ocultan todas las cartas del tablero
  document.querySelectorAll('.card').forEach(card => {
    card.style.visibility = 'hidden';
  });

  // Obtenemos el contenedor de los resultados
  const container = document.getElementById('result-container');
  
  // Se limpia cualquier resultado anterior
  container.innerHTML = '';

  // Si la partida se para al cancelar
  if (!won) {

    const msgEl = document.createElement('p');

    msgEl.textContent = "PARTIDA CANCELADA";

    msgEl.classList.add('end-message', 'cancelled');

    document.getElementById('gameBoard').appendChild(msgEl);
    
    startBtn.disabled = false;

    return;
  }

  // Si se gana la partida:

  /* 1. OBTENCIÓN DE DATOS DE LA BB.DD. */ 
  // Se crea el array donde se van a ir guardando los tiempos obtenidos
  let scores = [];

  try {
    // Accedemos a la parte "Score" en la BB.DD.
    const snapshot = await db.collection("scores")
      .orderBy("time", "asc") // Ordenamos por menor tiempo
      .limit(50) // Máximo 50 registros
      .get(); // Obtenemos los documentos

    // Se extraen los datos de cada documento
    scores = snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error("Error leyendo Firestore:", err);
  }



  /* 2. AHORA SE CALCULA LA CATEGORÍA EN BASE A LOS 20 MEJORES TIEMPOS */ 
  // La categoría se inicializa como intermedia
  let category = 'middle';

  // En el caso de que no exista ningún registro (primera partida), la categoría es la mejor
  if (scores.length === 0) {
    category = 'best';
  } else {

    // Se guarda el mejor tiempo
    const bestTime = scores[0].time;

    // Se guarda el peor tiempo
    const worstReference = scores.length >= 20

      ? scores[19].time // Si hay al menos 20, tomamos el puesto 20
      : scores[scores.length - 1].time; // Si no, tomamos el último

    // Dependiente del tiempo de la partida, se le adjudica como categoría "mejor" o "peor"
    if (finalTime <= bestTime) {
      category = 'best';
    } else if (finalTime > worstReference) {
      category = 'worst';
    }
  }


  
  /* 3. SE ADJUDICA GIF, SONIDO Y MENSAJE SEGÚN LA CATEGORÍA ASIGNADA PARA LA PARTIDA DEL JUEGADOR */
  let gifSrc = '', soundSrc = '', bigGif = false, message = '';

  if (category === 'best') {

    gifSrc = 'gifs/Gif_mejor_tiempo.webp';
    soundSrc = 'canciones/Sonic the Hedgehog 3 OST - Act Clear.m4a';
    message = 'Eres tan rápido como Sonic, ¡enhorabuena!';
  } else if (category === 'worst') {

    gifSrc = 'gifs/gif_mal_tiempo.webp';
    soundSrc = 'canciones/Sonic The Hedgehog 3 - Game Over.m4a';
    message = 'Tu tiempo es el peor, ¡vuelve a intentarlo!';
  } else {

    gifSrc = 'gifs/gif_rejugar.gif';
    soundSrc = 'canciones/Sonic the Hedgehog 3 OST  Continue.m4a';
    bigGif = true;
    message = 'Hasta Knuckles lo hizo mejor';
  }

  try {
    // Se crea el audio con la canción adjudicada
    playSound(soundSrc, 0.3);

    // Se intenta reproducir
    specialAudio.play().catch(err => console.warn('No se pudo reproducir:', err));
  } catch (e) { }


  /* 4. SE CONSTRUYE LA INTERFAZ DE RESULTADOS */ 
  // Mensaje corresponmdiente. Se crea y se añade al bloque de resultados
  const msgEl = document.createElement('p');
  msgEl.textContent = message;
  msgEl.classList.add('end-message', category);
  container.appendChild(msgEl);

  // Gif correspondiente. Se crea y se añade al bloque de resultados
  const gifEl = document.createElement('img');
  gifEl.src = gifSrc;
  gifEl.alt = 'Resultado';
  gifEl.style.display = 'block';
  gifEl.style.margin = '0 auto';
  gifEl.style.maxWidth = bigGif ? '100%' : '160px';
  container.appendChild(gifEl);

  // Movimientos realizados. Se crea y se añade al bloque de resultados
  const movesEl = document.createElement('p');
  movesEl.innerHTML = `Movimientos: <span class="moves-value">${moves}</span>`;
  movesEl.classList.add("score-text");
  container.appendChild(movesEl);

  // Tiempo empleado. Se crea y se añade al bloque de resultados
  const timeEl = document.createElement('p');
  timeEl.innerHTML = `Tiempo: <span class="time-value">${formatoTiempo(finalTime)}</span>`;
  timeEl.classList.add("score-text");
  container.appendChild(timeEl);

  // Se crea el input para escribir el nick y guardar
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'resultNickInput';
  input.placeholder = 'Tu nick (máximo 12 caracteres)';
  input.style.display = 'block';
  input.style.width = '90%';
  input.style.margin = '10px auto 0';
  container.appendChild(input); // Se añade el botón

  // Se crea un div para los mensajes de error
  const err = document.createElement('div');
  err.id = 'resultSaveError';
  err.style.color = 'black';
  err.style.fontSize = '1.2rem';
  err.style.fontFamily = "'Courier New', monospace";
  err.style.textAlign = 'center';
  container.appendChild(err); // Lo añadimos

  // Se crea el contenedor para el botón
  const btnWrap = document.createElement('div');
  btnWrap.style.display = 'flex';
  btnWrap.style.justifyContent = 'center';
  btnWrap.style.marginTop = '12px';

  // Creamos el botón para guardar el tiempo y su texto
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Guardar registro de partida';

  // Al hacer clic en guardar
  saveBtn.onclick = async () => {

    // Leemos valor y quitamos espacios
    const nick = input.value.trim();

    // Expresión regular para solo letras y númeors
    const validNickRegex = /^[a-zA-Z0-9]+$/;

    // Si el jugador no escribe nada, mensaje de error
    if (nick.length === 0) {
      err.textContent = 'Introduce un nick para guardar';
      return;
    }

    // Si el nick del jugador tiene más de 12 caracteres, mensaje de rror
    if (nick.length > 12) {
      err.textContent = 'Máximo 12 caracteres';
      return;
    }

    // Si contiene caracteres que no son letras y/o números, mensaje de error
    if (!validNickRegex.test(nick)) {
      err.textContent = 'Solo se permiten letras y números';
      return;
    }

    try {
      const snapshot = await db.collection("scores") // Consultamos la BB.DD.
        .where("nick", "==", nick) // Buscamos coincidencia exacta
        .get();
      
      // Si ya existe, mensaje de error
      if (!snapshot.empty) {
        err.textContent = 'Ese nick ya existe, elige otro';
        return;
      }

    } catch (e) {
      console.error("Error comprobando nick:", e);
      err.textContent = 'Error al comprobar el nick';
      return;
    }

    err.textContent = '';

    try {
      // Se guarda el tiempo
      await guardarTiempoEnBD(nick, finalTime, moves);

      // Se actualiza en pantalla
      actualizarListaTiempos();

      container.innerHTML = '';
      container.style.display = 'none';

      // Si había algún sonido, se pausa, se rinicia y se borra
      if (specialAudio) {
        specialAudio.pause();
        specialAudio.currentTime = 0;
        specialAudio = null;
      }

      // Hacemos que vuelva a aparecer el botón "Iniciar"
      startBtn.disabled = false;
    } catch (e) {
      err.textContent = 'Error al guardar en la base de datos';
    }
  };

  // Añadimos el botón dentro del contenedor
  btnWrap.appendChild(saveBtn);

  // Y ese contenedor al DOM
  container.appendChild(btnWrap);
  

  // Para finalizar, aparecen en pantalla todos los resultados 
  container.style.display = 'block';

  mostarMensaje('¡Partida finalizada!');
}




/* FUNCIÓN PARA MANEJAR EL CLIC DE UNA CARTA */
function clicEnCasilla(card) {

  // Si el tablero está bloqueado, o la carta ya está volteada, o ya está emparejada, entonces ignoramos el clic
  if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

  // Sonido al hacer clic en la primera carta
  if (!firstCard) { // Si aún no se ha volteado la primera carta
    // Se crea el objeto audio con el sonido
    playSound("sonidos/Sonic 3 & Knuckles - Blue Spheres.mp3", 0.15);
  }

  // Aumentamos contador de movimientos
  moves++;

  // Se actualiza el marcador en pantalla
  moveCounter.textContent = moves;

  // Voltear visualmente la carta
  card.classList.add('flipped'); // Es clase CSS que se añade para mostrar el reverso

  // Si todavía no hay primera carta
  if (!firstCard) {
    firstCard = card; // Guardamos esta como primera carta
    return;
  }

  // Si ya había primera, esta es la segunda carta
  secondCard = card;

  // Bloqueamos tablero para evitar más clics durante la comprobación
  lockBoard = true;

  // Comparamos los valores de las dos cartas (atributo "data-value")
  const isMatch = firstCard.dataset.value === secondCard.dataset.value;

  // Si coinciden
  if (isMatch) {
    // Sonido de acierto
    playSound("sonidos/Sonic Ring - Sound Effect.m4a", 0.1);

    // Marcamos la primera carta como emparejada
    firstCard.classList.add('matched');

    // Marcamos la segunda carta
    secondCard.classList.add('matched');

    // Aumentamos contador de parejas conseguidas
    matchedPairs++;

    // Reiniciamos estado del tablero (y así ya se puede seguir jugando)
    resetTablero();

    // Si se completaron todas las parejas, se llama a la función terminarPartida tras 1 segundo
    if (matchedPairs === cardValues.length / 2) {
      setTimeout(() => terminarPartida(true), 1000);
    }

  } else { // Si no hay coincidencia

    // Sonido de fallo
    playSound("sonidos/Sonic 3 & Knuckles - Fail sound effect.m4a", 0.1);

    // Voltear cartas con retraso
    setTimeout(() => {
      // Volvemos a ocultar la primera carta
      firstCard.classList.remove('flipped');

       // Volvemos a ocultar la segunda carta
      secondCard.classList.remove('flipped');

      resetTablero();
    }, 400); // 400ms (para que sea una animación rápida)
  }
}

// Función para los efectos de sonido
function playSound(src, volume) {
  const sound = new Audio(src);
  sound.volume = volume;
  sound.currentTime = 0;
  sound.play().catch(err => console.warn(err));
}



/* FUNCIÓN PARA VACIAR LAS VARIABLES DE LAS 2 CARTAS */
function resetTablero() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}




/* FUNCIÓN QUE MARCA LAS CARTAS COMO EMPAREJADAS */
function parejaEncontrada() {
  // Añadimos clase "matched" a la primera y segunda carta
  firstCard.classList.add('matched');
  secondCard.classList.add('matched');

  // Se incrementa el nº de parejas conseguidas
  matchedPairs++;

  // Se reinician las variables de tablero
  reiniciar();

  // Si todas las parejas están completas, se termina la partida con victoria
  if (matchedPairs === totalPairs) {
    terminarPartida(true);
  }
}



/* FUNCIÓN PARA VOLTEAR DE NUEVO LA CARTA SI NO COINCIDEN */
function parejaIncorrecta() {
  // Se bloquea el tablero temporalmente
  lockBoard = true;

  // Esperamos 1 segundo (para que el jugador tenga tiempo de ver las cartas)
  setTimeout(() => {
    // Quitamos la clase flipped para las 2 cartas (vuelven a ocultarse)
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');

    reiniciar();
  }, 1000);
}




/* FUNCIÓN PARA REINICIAR PARTIDA */
function reiniciar() {
  // Reiniciamos referencias a las cartas
  [firstCard, secondCard] = [null, null];

  // Permitimos volver a jugar
  lockBoard = false;

  // Aumentamos el número de movimientos
  moves++;

  // Se actualiza marcador en pantalla
  moveCounter.textContent = moves;
}



/* FUNCIÓN PARA OBTENER MEJOR Y PEOR TIEMPO DESDE LA BB.DD. */
// Clasifica un tiempo dentro de "best", "worst" o "middle"
function marcarCategoriaPorTiempo(finalTime, scores) {

  // Si no hay registros, cualquier tiempo es el mejor
  if (scores.length === 0) return 'best';

  // El mejor tiempo (primer elemento, ya está ordenado)
  const bestTime = scores[0].time;

  // El peor tiempo de la lista
  const worstTime = scores[scores.length - 1].time;

  // Si es mejor que el mejor, entonces categoría "best"
  if (finalTime < bestTime) return 'best';

  // Si es peor que el peor, entonces categoría "worst"
  if (finalTime > worstTime) return 'worst';

  return 'middle'; // En cualquier otro caso, intermedio
}



/* FUNCIÓN PARA CONVERTIR EL TIEMPO EN CENTÉSIMAS */
function formatoTiempo(t) {

  const cent = t % 100;

  const secs = Math.floor(t / 100) % 60;

  const mins = Math.floor(t / 6000);

  // Se devuelve el String con 2 digitos en cada campo
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(cent).padStart(2, '0')}`;
}



/* FUNCIÓN PARA MOSTRAR EL MENSAJE EN PANTALLA */
function mostarMensaje(text) {
  messageBox.textContent = text;
}




/* FUNCIÓN QUE GUARDA RESULTADO, TANTO EN NAVEGADOR DE PC COMO MÓVIL */
function guardarTiempo() {

  // Buscar el input visible (scoreNameInput o resultNickInput)
  let name = '';
  let errorBox = saveError;

  // Si existe el input dinámico y está visible, usar ese
  const dynamicInput = document.getElementById('resultNickInput');
  const dynamicError = document.getElementById('resultSaveError');

  if (dynamicInput && dynamicInput.offsetParent !== null) {
    name = dynamicInput.value.trim();
    errorBox = dynamicError || saveError;
  } else {
    name = scoreNameInput.value.trim();
    errorBox = saveError;
  }

  // Si no hay nombre, aparece mensaje de error
  if (name === '') {
    errorBox.textContent = "Por favor, introduce un nombre.";
    return;
  }

  errorBox.textContent = '';

  // Se oculta el cuadro de guardado si existe
  if (saveBox) saveBox.style.display = 'none';
  
  // Llamamos a la función que guarda en la BB.DD.
  guardarTiempoEnBD(name, time, moves);

  mostarMensaje(`🎉 Resultado guardado como "${name}"`);
}



/* FUNCIÓN PARA GUARDAR UN REGISTRO EN LA BB.DD. */
async function guardarTiempoEnBD(nick, time, moves) {

  try {
    // Añadimos documento a la colección "scores", con el nick, el tiempo, etc.
    await db.collection('scores').add({
      nick: nick,
      time: time,
      moves: moves,
      date: new Date().toISOString() // Fecha en formato ISO
    });
  } catch (error) {
    console.error("❌ Error al guardar:", error);
    throw error;
  }
}




/* FUNCIÓN PARA RENOVAR LOS TIEMPOS DE LA LISTA */
function actualizarListaTiempos() {
  // Obtenemos lista de tiempos
  const scoreList = document.getElementById('scoreList');

  // Referencia a la colección "scores"
  const scoresRef = db.collection('scores')
    .orderBy('time', 'asc') // Ordenamos de menor a mayor tiempo
    .limit(20); // Máximo 20 registros

  // Suscripción en tiempo real a Firestore
  scoresRef.onSnapshot((snapshot) => { // Nos suscribimos para que actualice automáticamente

    scoreList.innerHTML = '';

    // Si no hay datos, se crea el texto de que no hay tiempos
    if (snapshot.empty) {

      const li = document.createElement('li');

      li.textContent = "No hay tiempos aún";

      li.style.textAlign = "center";

      li.style.listStyleType = "none";

      scoreList.appendChild(li);

      return;
    }

    // Para iterar ahora en los documentos
    let i = 1;

    // Si hay resultados → recorremos los documentos
    snapshot.forEach(doc => {
      // Se extraem los datos del documento
      const s = doc.data();

      const li = document.createElement('li');

      // Texto: posición, nick, tiempo formateado y movimientos
      li.textContent = `${i}. ${s.nick || 'Anónimo'} - ${formatoTiempo(s.time)} (${s.moves} movs)`;

      scoreList.appendChild(li);

      i++;
    });
  }, (error) => {
    console.error('❌ Error leyendo scores desde Firestore:', error);
    scoreList.innerHTML = '<li>Error cargando tiempos</li>';
  });
}


//**En endGame, la línea con template string corregida:
const p = document.createElement('p');
p.textContent = `Movimientos: ${moves} — Tiempo: ${formatoTiempo(finalTime)}`;
p.style.marginTop = '10px';
container.appendChild(p);


document.addEventListener('DOMContentLoaded', () => {
  actualizarListaTiempos(); // Ahora suscribe en tiempo real
});
