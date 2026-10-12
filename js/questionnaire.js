document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#questionnaire-form");
  const submitButton = form?.querySelector('input[type="submit"]');
  const status = document.querySelector("#questionnaire-status");

  if (!form || !submitButton || !status) {
    return;
  }

  const endpoint = "https://api.slapform.com/gVwUn27OS";
  const originalButtonText = submitButton.value;
  let isSubmitting = false;

  function setStatus(message, state) {
    status.textContent = message;

    if (state) {
      status.dataset.state = state;
    } else {
      delete status.dataset.state;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.value = "Отправка…";
    setStatus("Отправляем анкету…");

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const contentType = response.headers.get("content-type") || "";
      let result = null;

      if (contentType.includes("application/json")) {
        result = await response.json();
      }

      const fatalErrors = Array.isArray(result?.errors)
        ? result.errors.filter(error => error.level === "fatal")
        : [];
      const errorDetails = fatalErrors
        .map(error => error.description || error.message || error.code)
        .filter(Boolean)
        .join("; ");

      if (!response.ok) {
        throw new Error(`Slapform ответил HTTP ${response.status}${errorDetails ? `: ${errorDetails}` : ""}.`);
      }

      if (result?.success === false || fatalErrors.length > 0) {
        throw new Error(errorDetails || "Slapform отклонил отправку анкеты.");
      }

      setStatus("Анкета отправлена. Спасибо!", "success");
    } catch (error) {
      console.error("Ошибка отправки анкеты в Slapform:", error);
      const message = error instanceof TypeError
        ? "Браузер не смог связаться с Slapform (сеть или CORS). Проверьте Console и Network в инструментах разработчика."
        : `Не удалось отправить анкету: ${error.message}`;
      setStatus(message, "error");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.value = originalButtonText;
    }
  });
});
