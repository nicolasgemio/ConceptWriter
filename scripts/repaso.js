let targetText = "";
let currentIndex = 0; // Mantiene el progreso incluso al volver atrás
let editableListenerAdded = false;
let paragraphs = []; // Array para almacenar párrafos
let currentParagraph = 0; // Índice del párrafo actual
let isParagraphMode = false; // Indica si estamos en modo párrafos

// Función para normalizar texto (omitir mayúsculas y tildes)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina diacríticos (tildes)
}

// Función para verificar si un carácter es alfanumérico o espacio
function isAlphanumericOrSpace(char) {
  return /[a-zA-Z0-9\s]/.test(char);
}

// Función para avanzar al siguiente carácter que se debe escribir
function skipToNextWritableChar() {
  while (currentIndex < targetText.length && !isAlphanumericOrSpace(targetText[currentIndex])) {
    currentIndex++;
  }
}

// Función para cargar PDF
async function loadPDF(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    showError("Cargando PDF...");
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    // Extraer texto de todas las páginas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }

    // Limpiar y separar en párrafos
    const cleanText = fullText.replace(/\s+/g, ' ').trim();
    
    // Separar por párrafos usando diferentes criterios
    let tempParagraphs = [];
    
    // Primero intentar separar por saltos de línea dobles
    if (cleanText.includes('\n\n')) {
      tempParagraphs = cleanText.split(/\n\s*\n/);
    } else {
      // Si no hay saltos dobles, separar por oraciones largas (más de 100 caracteres)
      const sentences = cleanText.split(/\.\s+/);
      let currentParagraph = '';
      
      for (let sentence of sentences) {
        if (currentParagraph.length + sentence.length > 200 && currentParagraph.length > 0) {
          tempParagraphs.push(currentParagraph.trim() + '.');
          currentParagraph = sentence;
        } else {
          currentParagraph += (currentParagraph ? '. ' : '') + sentence;
        }
      }
      
      if (currentParagraph.trim()) {
        tempParagraphs.push(currentParagraph.trim());
      }
    }
    
    paragraphs = tempParagraphs.filter(p => p.trim().length > 20); // Filtrar párrafos muy cortos
    
    if (paragraphs.length === 0) {
      showError("No se pudo extraer texto del PDF.");
      return;
    }

    // Configurar modo párrafos
    isParagraphMode = true;
    currentParagraph = 0;
    currentIndex = 0;
    
    // Establecer el primer párrafo
    targetText = paragraphs[0].trim();
    document.getElementById("source-text").value = targetText;
    
    // Limpiar el input file
    event.target.value = '';
    
    // Automáticamente iniciar la práctica
    setTimeout(() => {
      startPractice();
      showError(`PDF cargado: ${paragraphs.length} párrafos encontrados. Párrafo 1/${paragraphs.length}`);
    }, 500);
    
  } catch (error) {
    console.error('Error al cargar PDF:', error);
    showError("Error al cargar el PDF. Asegúrate de que sea un archivo PDF válido.");
  }
}

// Función para avanzar al siguiente párrafo
function nextParagraph() {
  if (!isParagraphMode || currentParagraph >= paragraphs.length - 1) {
    return false;
  }
  
  currentParagraph++;
  currentIndex = 0;
  targetText = paragraphs[currentParagraph].trim();
  
  return true;
}

function startPractice() {
  const newText = document.getElementById("source-text").value;

  // Validación de campo vacío o sólo espacios
  if (!newText || newText.trim() === "") {
    showError("Por favor, ingresa un texto para practicar.");
    return;
  }

  // Si el texto cambió, reinicia progreso
  if (newText !== targetText) {
    targetText = newText;
    currentIndex = 0;
  }

  // Saltar caracteres no alfanuméricos al inicio
  skipToNextWritableChar();

  // Cambiar a pantalla de práctica
  document.getElementById("setup-screen").style.display = "none";
  document.getElementById("practice-screen").style.display = "flex";
  document.body.classList.add("practice-mode");
  document.getElementById("back-btn").style.display = "block";

  renderText();

  const editable = document.getElementById("editable");
  editable.setAttribute("contenteditable", "true");
  editable.focus();
  placeCaretAfterCorrect();
  hideError();
  
  // Configurar el listener solo una vez
  if (!editableListenerAdded) {
    setupEditableListener();
    editableListenerAdded = true;
  }
}

function setupEditableListener() {
  const editable = document.getElementById("editable");
  if (!editable) return;
  
  editable.addEventListener("keydown", function (e) {
    e.preventDefault();
    
    // Saltar caracteres no alfanuméricos al inicio
    skipToNextWritableChar();
    
    if (currentIndex >= targetText.length) {
      // Verificar si se completó el párrafo actual
      if (isParagraphMode && nextParagraph()) {
        // Avanzar al siguiente párrafo
        skipToNextWritableChar(); // Saltar caracteres no alfanuméricos del nuevo párrafo
        setTimeout(() => {
          showError(`¡Párrafo completado! Párrafo ${currentParagraph + 1}/${paragraphs.length}`);
          renderText();
        }, 100);
      } else if (isParagraphMode) {
        // Último párrafo completado
        setTimeout(() => {
          showError("¡Felicitaciones! Has completado todos los párrafos.");
        }, 100);
      }
      renderText();
      return;
    }
    
    const expectedChar = targetText[currentIndex];

    // Tecla de caracter
    if (e.key.length === 1) {
      // Solo procesar si el carácter esperado es alfanumérico o espacio
      if (isAlphanumericOrSpace(expectedChar)) {
        // Comparar caracteres normalizados (sin mayúsculas ni tildes)
        const normalizedTyped = normalizeText(e.key);
        const normalizedExpected = normalizeText(expectedChar);
        
        if (normalizedTyped === normalizedExpected) {
          currentIndex++;
          // Saltar caracteres no alfanuméricos después de escribir correctamente
          skipToNextWritableChar();
          
          // Verificar si se completó el párrafo actual después de saltar
          if (currentIndex >= targetText.length) {
            if (isParagraphMode && nextParagraph()) {
              // Avanzar al siguiente párrafo
              skipToNextWritableChar(); // Saltar caracteres no alfanuméricos del nuevo párrafo
              setTimeout(() => {
                showError(`¡Párrafo completado! Párrafo ${currentParagraph + 1}/${paragraphs.length}`);
                renderText();
              }, 100);
            } else if (isParagraphMode) {
              // Último párrafo completado
              setTimeout(() => {
                showError("¡Felicitaciones! Has completado todos los párrafos.");
              }, 100);
            }
          }
          
          renderText();
          hideError();
        } else {
          showTypingError(e.key);
        }
      }
    } else if (e.key === "Backspace" && currentIndex > 0) {
      // Retroceder hasta encontrar un carácter alfanumérico
      currentIndex--;
      while (currentIndex > 0 && !isAlphanumericOrSpace(targetText[currentIndex])) {
        currentIndex--;
      }
      renderText();
      hideError();
    }
  });
}

function goBack() {
  // Volver a la pantalla inicial (pero guardando el progreso actual)
  document.getElementById("setup-screen").style.display = "block";
  document.getElementById("practice-screen").style.display = "none";
  document.body.classList.remove("practice-mode");

  // Mantener el texto original y progreso, no se borra nada
  document.getElementById("source-text").value = targetText;
  hideError();
}

function renderText() {
  const correctPart = targetText.slice(0, currentIndex);
  const remainingPart = targetText.slice(currentIndex);
  const editable = document.getElementById("editable");
  editable.innerHTML =
    `<span class="correct">${correctPart}</span><span class="remaining">${remainingPart}</span>`;
  updateProgress();
  placeCaretAfterCorrect();
}

function updateProgress() {
  const indicator = document.getElementById("progress-indicator");
  if (!indicator || !targetText) {
    if (indicator) indicator.textContent = "";
    return;
  }
  const total = targetText.length;
  const done = currentIndex;
  const left = total - done;
  const percent = total ? Math.floor((done / total) * 100) : 0;
  
  let progressText = `${done}/${total} (${percent}%) - Restan ${left}`;
  
  if (isParagraphMode && paragraphs.length > 0) {
    progressText += ` | Párrafo ${currentParagraph + 1}/${paragraphs.length}`;
  }
  
  indicator.textContent = progressText;
}

function showError(message) {
  // Para validaciones globales (ej: campo vacío), sí mostramos cartel
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function showTypingError(typedChar) {
  // Resalta temporalmente el PRÓXIMO carácter esperado en rojo (sin insertar letras)
  const editable = document.getElementById("editable");
  if (!editable) return;
  const remainingSpan = editable.querySelector('.remaining');
  if (!remainingSpan) return;
  const original = remainingSpan.textContent || "";
  if (original.length === 0) return;

  const wrong = document.createElement('span');
  wrong.className = 'wrong';
  wrong.textContent = original.charAt(0);

  // Construir contenido temporal: [wrong][resto]
  remainingSpan.innerHTML = '';
  remainingSpan.appendChild(wrong);
  remainingSpan.appendChild(document.createTextNode(original.slice(1)));

  setTimeout(() => {
    if (remainingSpan) {
      remainingSpan.textContent = original; // restaurar
    }
  }, 500);

  hideError();
}

function hideError() {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
}

function placeCaretAfterCorrect() {
  const editable = document.getElementById("editable");
  if (!editable) return;
  
  const correctSpan = editable.querySelector(".correct");
  const range = document.createRange();
  const sel = window.getSelection();

  try {
    if (correctSpan && correctSpan.childNodes.length > 0) {
      range.setStart(correctSpan, correctSpan.childNodes.length);
    } else {
      range.setStart(editable, 0);
    }

    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {
    // Silenciar errores de posicionamiento del cursor
    console.warn("Error al posicionar cursor:", e);
  }
}