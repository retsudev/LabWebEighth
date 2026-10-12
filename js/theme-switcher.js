document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector("#theme-toggle");
  const label = document.querySelector("#theme-name");

  if (!toggle || !label) {
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
    const theme = isRed ? "red" : "blue";
    document.documentElement.dataset.theme = theme;

    document.querySelectorAll("[data-blue-src][data-red-src]").forEach(image => {
      const source = image.dataset[`${theme}Src`];

      if (image.getAttribute("src") !== source) {
        image.setAttribute("src", source);
      }

      const alt = image.dataset[`${theme}Alt`];

      if (alt) {
        image.alt = alt;
      }
    });

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
    }
  });
});
