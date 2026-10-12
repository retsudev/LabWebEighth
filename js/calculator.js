document.addEventListener("DOMContentLoaded", () => {
  const PRICE_CONFIG = {
    youtubeMusic: 299,
    yandexMusic: 699,
    spotify: {
      student: 199,
      duo: 349,
      family: 499
    }
  };

  const calculator = document.querySelector(".calculator-section");

  if (!calculator) {
    return;
  }

  const products = [
    ...calculator.querySelectorAll(".calculator-product")
  ];

  const result = calculator.querySelector("#calculator-result");
  const error = calculator.querySelector("#calculator-error");
  const quantityPattern = /^\d+$/;

  function formatPrice(price) {
    return `${price.toLocaleString("ru-RU")} ₽`;
  }

  function getUnitPrice(product) {
    const priceConfigKey = product.dataset.priceConfig;

    if (priceConfigKey) {
      const configuredPrices = PRICE_CONFIG[priceConfigKey];
      const plan = product.querySelector(".calculator-plan-select");
      const basePrice = plan
        ? configuredPrices?.[plan.value]
        : configuredPrices;

      if (!Number.isFinite(basePrice) || basePrice < 0) {
        return null;
      }

      const multiplierControl = product.querySelector(
        "[data-price-multiplier]"
      );
      const multiplier = multiplierControl?.checked
        ? Number(multiplierControl.dataset.priceMultiplier)
        : 1;

      return Number.isFinite(multiplier) && multiplier > 0
        ? basePrice * multiplier
        : null;
    }

    const basePrice = Number(product.dataset.basePrice);

    return Number.isFinite(basePrice) && basePrice >= 0
      ? basePrice
      : null;
  }

  function updatePriceLabel(product) {
    const label = product.querySelector("[data-price-label]");
    const price = getUnitPrice(product);

    label.textContent = price === null
      ? "Цена не указана"
      : `${formatPrice(price)} / месяц`;
  }

  function getQuantityState(product) {
    const input = product.querySelector(
      ".calculator-product-quantity"
    );

    const value = input.value.trim();

    if (value === "") {
      return {
        valid: false,
        empty: true,
        quantity: 0
      };
    }

    if (!quantityPattern.test(value)) {
      return {
        valid: false,
        empty: false,
        quantity: 0
      };
    }

    const quantity = Number(value);

    if (!Number.isSafeInteger(quantity)) {
      return {
        valid: false,
        empty: false,
        quantity: 0
      };
    }

    return {
      valid: true,
      empty: false,
      quantity
    };
  }

  function updateQuantityControls(product) {
    const input = product.querySelector(
      ".calculator-product-quantity"
    );
    const minusButton = product.querySelector(
      '[data-action="decrease"]'
    );
    const plusButton = product.querySelector(
      '[data-action="increase"]'
    );

    const state = getQuantityState(product);

    minusButton.disabled =
      !state.valid || state.quantity <= 0;

    plusButton.disabled =
      state.valid &&
      state.quantity >= Number.MAX_SAFE_INTEGER;

    input.classList.toggle(
      "has-value",
      state.valid && state.quantity > 0
    );

    input.setAttribute(
      "aria-invalid",
      String(!state.valid && !state.empty)
    );

    return state;
  }

  function updateProductToggle(product) {
    const button = product.querySelector(
      '[data-action="toggle-product"]'
    );

    const included = product.dataset.included === "true";

    product.classList.toggle("is-included", included);

    button.setAttribute("aria-pressed", String(included));
    button.textContent = included
      ? "В расчёте"
      : "Добавить в расчёт";
  }

  function calculateTotal() {
    let total = 0;
    let hasInvalidValue = false;
    let hasEmptyValue = false;
    const missingPrices = [];

    products.forEach(product => {
      const state = getQuantityState(product);

      if (!state.valid) {
        hasInvalidValue = true;

        if (state.empty) {
          hasEmptyValue = true;
        }

        return;
      }

      if (product.dataset.included === "true") {
        const unitPrice = getUnitPrice(product);

        if (unitPrice === null) {
          missingPrices.push(
            product.querySelector(".calculator-product-name").textContent.trim()
          );
        } else {
          total += unitPrice * state.quantity;
        }
      }
    });

    const hasOverflow = !Number.isSafeInteger(total);

    if (hasInvalidValue || hasOverflow || missingPrices.length > 0) {
      result.textContent = "— ₽";

      if (hasOverflow) {
        error.textContent = "Слишком большая итоговая сумма.";
      } else if (missingPrices.length > 0) {
        error.textContent = `Не задана цена для подписки: ${missingPrices.join(", ")}.`;
      } else if (!hasEmptyValue) {
        error.textContent =
          "Количество должно быть целым неотрицательным числом.";
      } else if (
        products.some(product => {
          const state = getQuantityState(product);
          return !state.valid && !state.empty;
        })
      ) {
        error.textContent =
          "Количество должно быть целым неотрицательным числом.";
      } else {
        error.textContent = "";
      }

      return;
    }

    error.textContent = "";
    result.textContent = formatPrice(total);
  }

  function updateCalculator() {
    products.forEach(product => {
      updateQuantityControls(product);
      updatePriceLabel(product);
      updateProductToggle(product);
    });

    calculateTotal();
  }

  products.forEach(product => {
    const input = product.querySelector(
      ".calculator-product-quantity"
    );
    const plusButton = product.querySelector(
      '[data-action="increase"]'
    );
    const minusButton = product.querySelector(
      '[data-action="decrease"]'
    );
    const toggleButton = product.querySelector(
      '[data-action="toggle-product"]'
    );
    const plan = product.querySelector(".calculator-plan-select");
    const multiplierControl = product.querySelector(
      "[data-price-multiplier]"
    );

    plusButton.addEventListener("click", () => {
      const state = getQuantityState(product);
      const current = state.valid ? state.quantity : 0;

      if (current >= Number.MAX_SAFE_INTEGER) {
        return;
      }

      input.value = String(current + 1);
      updateCalculator();
    });

    minusButton.addEventListener("click", () => {
      const state = getQuantityState(product);
      const current = state.valid ? state.quantity : 0;

      input.value = String(Math.max(0, current - 1));
      updateCalculator();
    });

    input.addEventListener("input", updateCalculator);

    input.addEventListener("blur", () => {
      if (input.value.trim() === "") {
        input.value = "0";
      }

      updateCalculator();
    });

    toggleButton.addEventListener("click", () => {
      const included = product.dataset.included === "true";

      product.dataset.included = String(!included);
      updateCalculator();
    });

    if (plan) {
      plan.addEventListener("change", updateCalculator);
    }

    if (multiplierControl) {
      multiplierControl.addEventListener("change", updateCalculator);
    }

  });

  updateCalculator();

  const productDetails = [
    ...document.querySelectorAll(".calculator-product-details")
  ];

  if (productDetails.length > 0) {
    const mobileLayout = window.matchMedia(
      "(max-width: 991.98px)"
    );

    function updateProductDetails() {
      productDetails.forEach(detail => {
        detail.open = !mobileLayout.matches;
      });
    }

    updateProductDetails();
    mobileLayout.addEventListener("change", updateProductDetails);
  }
});
