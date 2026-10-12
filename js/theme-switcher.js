document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("#theme-toggle");
  const label = document.querySelector("#theme-name");
  const alternateTheme = document.querySelector("#alternate-theme");

  if (!toggle || !label || !alternateTheme) {
    return;
  }

  const storageKey = "lab8-theme";
  let isRed = false;

  try {
    isRed = window.localStorage.getItem(storageKey) === "red";
  } catch (error) {
    isRed = false;
  }

  function applyTheme() {
    alternateTheme.disabled = !isRed;
    toggle.setAttribute("aria-checked", String(isRed));
    label.textContent = isRed ? "Красный стиль" : "Синий стиль";
  }

  applyTheme();

  toggle.addEventListener("click", () => {
    isRed = !isRed;
    applyTheme();

    try {
      window.localStorage.setItem(storageKey, isRed ? "red" : "blue");
    } catch (error) {
      // Theme switching still works for the current page if storage is unavailable.
    }
  });
});
