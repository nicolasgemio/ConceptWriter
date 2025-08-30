let targetText = "";
let currentIndex = 0; // Mantiene el progreso incluso al volver atrás

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
    `<span class=\"correct\">${correctPart}</span><span class=\"remaining\">${remainingPart}</span>`;
  placeCaretAfterCorrect();
}

document.getElementById("editable").addEventListener("keydown", function (e) {
  e.preventDefault();
  const expectedChar = targetText[currentIndex];
  const editable = document.getElementById("editable");

  // Tecla de caracter
  if (e.key.length === 1) {
    if (e.key === expectedChar) {
      currentIndex++;
      renderText();
      hideError();
    } else {
      showError("Caracter incorrecto, intenta de nuevo");
    }
  } else if (e.key === "Backspace" && currentIndex > 0) {
    currentIndex--;
    renderText();
    hideError();
  }
});

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  const editable = document.getElementById("editable");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  // Solo agregar la clase de error si la pantalla de práctica está visible
  const practiceScreen = document.getElementById("practice-screen");
  if (
    editable &&
    practiceScreen &&
    practiceScreen.style.display !== "none"
  ) {
    editable.classList.add("error");
  }
}

function hideError() {
  const errorDiv = document.getElementById("error-message");
  const editable = document.getElementById("editable");
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
  if (editable) {
    editable.classList.remove("error");
  }
}

function placeCaretAfterCorrect() {
  const editable = document.getElementById("editable");
  const correctSpan = editable.querySelector(".correct");
  const range = document.createRange();
  const sel = window.getSelection();

  if (correctSpan) {
    range.setStart(correctSpan, correctSpan.childNodes.length);
  } else {
    range.setStart(editable, 0);
  }

  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}
