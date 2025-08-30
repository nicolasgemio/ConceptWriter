let targetText = "";
let currentIndex = 0; // Mantiene el progreso incluso al volver atrás

function startPractice() {
  const newText = document.getElementById("source-text").value;

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
}

function goBack() {
  // Volver a la pantalla inicial (pero guardando el progreso actual)
  document.getElementById("setup-screen").style.display = "block";
  document.getElementById("practice-screen").style.display = "none";
  document.body.classList.remove("practice-mode");

  // Mantener el texto original y progreso, no se borra nada
  document.getElementById("source-text").value = targetText;
}

function renderText() {
  const correctPart = targetText.slice(0, currentIndex);
  const remainingPart = targetText.slice(currentIndex);
  const editable = document.getElementById("editable");
  editable.innerHTML =
    `<span class="correct">${correctPart}</span><span class="remaining">${remainingPart}</span>`;
  placeCaretAfterCorrect();
}

document.getElementById("editable").addEventListener("keydown", function (e) {
  e.preventDefault();

  const expectedChar = targetText[currentIndex];

  if (e.key.length === 1) {
    if (e.key === expectedChar) {
      currentIndex++;
      renderText();
    }
  } else if (e.key === "Backspace" && currentIndex > 0) {
    currentIndex--;
    renderText();
  }
});

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
