document.addEventListener("DOMContentLoaded", () => {
  const openButton = document.querySelector("#contact-open");
  const dialog = document.querySelector("#contact-dialog");
  const closeButton = document.querySelector("#contact-close");
  const form = document.querySelector("#contact-form");
  const submitButton = document.querySelector("#contact-submit");
  const status = document.querySelector("#contact-status");

  if (!openButton || !dialog || !closeButton || !form || !submitButton || !status) {
    return;
  }

  const endpoint = "https://api.slapform.com/A68hND4Z2";
  const storageKey = "contactFormDraftV1";
  const stateKey = "contactFormOpen";
  const fields = [...form.querySelectorAll("input, textarea")];
  let isSubmitting = false;

  function showDialog() {
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function closeFromHistory() {
    if (dialog.open) {
      dialog.close();
    }
  }

  function isContactHistoryEntry() {
    return Boolean(
      history.state
      && typeof history.state === "object"
      && history.state[stateKey] === true
    );
  }

  function openDialog() {
    if (dialog.open) {
      return;
    }

    if (!isContactHistoryEntry()) {
      const previousState = history.state;
      const preservedState = previousState && typeof previousState === "object"
        ? previousState
        : {};
      history.pushState(
        { ...preservedState, [stateKey]: true },
        "",
        `${location.pathname}${location.search}#contact-form`
      );
    }

    showDialog();
  }

  function requestClose() {
    if (isContactHistoryEntry()) {
      history.back();
      return;
    }

    closeFromHistory();
  }

  function saveDraft() {
    const draft = {};

    fields.forEach(field => {
      draft[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      // The form remains usable when browser storage is unavailable.
    }
  }

  function restoreDraft() {
    try {
      const savedDraft = localStorage.getItem(storageKey);

      if (!savedDraft) {
        return;
      }

      const draft = JSON.parse(savedDraft);

      fields.forEach(field => {
        if (!Object.prototype.hasOwnProperty.call(draft, field.name)) {
          return;
        }

        if (field.type === "checkbox") {
          field.checked = draft[field.name] === true;
        } else if (typeof draft[field.name] === "string") {
          field.value = draft[field.name];
        }
      });
    } catch (error) {
      // Ignore malformed or unavailable browser storage.
    }
  }

  function setStatus(message, state) {
    status.textContent = message;

    if (state) {
      status.dataset.state = state;
    } else {
      delete status.dataset.state;
    }
  }

  restoreDraft();

  fields.forEach(field => {
    field.addEventListener("input", saveDraft);
    field.addEventListener("change", saveDraft);
  });

  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", requestClose);

  dialog.addEventListener("wheel", event => {
    event.preventDefault();
  }, { passive: false });

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    requestClose();
  });

  window.addEventListener("popstate", event => {
    if (event.state && typeof event.state === "object" && event.state[stateKey] === true) {
      showDialog();
    } else {
      closeFromHistory();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Отправка…";
    setStatus("Отправляем сообщение…");

    const data = Object.fromEntries(new FormData(form).entries());
    data.slap_replyto = data.email;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const result = await response.json();
        const hasFatalError = Array.isArray(result.errors)
          && result.errors.some(error => error.level === "fatal");

        if (result.success === false || hasFatalError) {
          throw new Error("Submission was rejected");
        }
      }

      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        // Clearing storage is best effort; the successful submission still stands.
      }

      form.reset();
      setStatus("Сообщение отправлено. Спасибо!", "success");
    } catch (error) {
      setStatus("Не удалось отправить сообщение. Проверьте подключение и попробуйте ещё раз.", "error");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "Отправить";
    }
  });
});
