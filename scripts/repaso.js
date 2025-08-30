let targetText = "";
let currentIndex = 0; // Mantiene el progreso incluso al volver atrás
let editableListenerAdded = false;

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
    const expectedChar = targetText[currentIndex];

    // Tecla de caracter
    if (e.key.length === 1) {
      if (e.key === expectedChar) {
        currentIndex++;
        renderText();
        hideError();
      } else {
        showTypingError(e.key);
      }
    } else if (e.key === "Backspace" && currentIndex > 0) {
      currentIndex--;
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
  indicator.textContent = `${done}/${total} (${percent}%) - Restan ${left}`;
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