document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#questionnaire-form");
  const submitButton = form?.querySelector('button[type="submit"]');
  const status = document.querySelector("#questionnaire-status");

  if (!form || !submitButton || !status) {
    return;
  }

  const endpoint = "https://submit-form.com/PJ5NLPMPl";
  const originalButtonText = submitButton.textContent;
  let isSubmitting = false;

  function setStatus(message, state) {
    status.textContent = message;

    if (state) {
      status.dataset.state = state;
    } else {
      delete status.dataset.state;
    }
  }

  async function getResponseError(response) {
    const body = await response.text();

    if (!body) {
      return `Formspark ответил HTTP ${response.status}.`;
    }

    try {
      const result = JSON.parse(body);
      const details = [result.message, result.error]
        .filter(value => typeof value === "string" && value.trim())
        .join("; ");
      const errors = Array.isArray(result.errors)
        ? result.errors.map(error => typeof error === "string" ? error : error.message || error.detail)
            .filter(Boolean).join("; ")
        : result.errors && typeof result.errors === "object"
          ? Object.values(result.errors).flat().join("; ")
          : "";

      return `Formspark ответил HTTP ${response.status}${details || errors ? `: ${details || errors}` : "."}`;
    } catch (error) {
      return `Formspark ответил HTTP ${response.status}: ${body.slice(0, 300)}`;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Отправка…";
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

      if (!response.ok) {
        throw new Error(await getResponseError(response));
      }

      setStatus("Анкета отправлена. Спасибо!", "success");
    } catch (error) {
      console.error("Ошибка отправки анкеты в Formspark:", error);
      const message = error instanceof TypeError
        ? "Браузер не смог связаться с Formspark (сеть или CORS). Проверьте Console и Network в инструментах разработчика."
        : `Не удалось отправить анкету: ${error.message}`;
      setStatus(message, "error");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
