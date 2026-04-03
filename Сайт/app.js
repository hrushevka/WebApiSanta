const API_BASE = "https://localhost:7161";
const REGISTER_ENDPOINT = `${API_BASE}/api/santa/register`;
const SAVE_WISH_ENDPOINT = `${API_BASE}/api/santa/wish`;
const STORAGE_KEY = "secret-santa-user";

const registerForm = document.getElementById("registerForm");
const wishForm = document.getElementById("wishForm");
const nameInput = document.getElementById("nameInput");
const wishInput = document.getElementById("wishInput");
const registerButton = document.getElementById("registerButton");
const wishButton = document.getElementById("wishButton");
const statusBox = document.getElementById("statusBox");
const resultSection = document.getElementById("resultSection");
const resultText = document.getElementById("resultText");
const wishSection = document.getElementById("wishSection");
const waitingHint = document.getElementById("waitingHint");

let currentUser = "";
let currentGiftFor = "";

init();

function init() {
  restoreSession();
  registerForm.addEventListener("submit", handleRegister);
  wishForm.addEventListener("submit", handleWishSubmit);
}

function restoreSession() {
  const savedRaw = localStorage.getItem(STORAGE_KEY);
  if (!savedRaw) return;

  try {
    const saved = JSON.parse(savedRaw);
    if (saved?.userName) {
      currentUser = saved.userName;
      currentGiftFor = saved.giftFor || "";
      nameInput.value = saved.userName;

      showRegisterResult(saved.userName, saved.giftFor || "");
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  if (!name) {
    showStatus("Введите имя перед отправкой.", "error");
    nameInput.focus();
    return;
  }

  toggleButton(registerButton, true, "Отправляем...");
  hideStatus();

  try {
    const data = await requestJson(REGISTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    currentUser = data.userName || name;
    currentGiftFor = typeof data.giftFor === "string" ? data.giftFor.trim() : "";
    persistSession();
    showRegisterResult(currentUser, currentGiftFor);

    if (currentGiftFor) {
      showStatus("Участник зарегистрирован. Теперь можно оставить пожелание.", "success");
    } else {
      showStatus("Ты зарегистрирован. Пока ждём ещё участников для распределения.", "success");
    }
  } catch (error) {
    showStatus(error.message || "Не удалось зарегистрироваться.", "error");
  } finally {
    toggleButton(registerButton, false, "Участвовать / Получить подарок");
  }
}

async function handleWishSubmit(event) {
  event.preventDefault();

  const wish = wishInput.value.trim();
  if (!currentUser) {
    showStatus("Сначала зарегистрируйся, потом отправляй пожелание.", "error");
    return;
  }

  if (!wish) {
    showStatus("Пожелание не может быть пустым.", "error");
    wishInput.focus();
    return;
  }

  toggleButton(wishButton, true, "Сохраняем...");
  hideStatus();

  try {
    await requestJson(SAVE_WISH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: currentUser, wish })
    });

    showStatus("Пожелание сохранено.", "success");
  } catch (error) {
    showStatus(error.message || "Не удалось сохранить пожелание.", "error");
  } finally {
    toggleButton(wishButton, false, "Отправить пожелание");
  }
}

function showRegisterResult(userName, giftFor) {
  resultSection.classList.remove("result--hidden");
  wishSection.classList.remove("panel--hidden");

  if (giftFor) {
    resultText.textContent = `Привет, ${userName}! Твой тайный друг — ${giftFor}. Не забудь оставить пожелание!`;
    waitingHint.classList.add("info--hidden");
  } else {
    resultText.textContent = `Привет, ${userName}! Ты уже в игре, но распределение ещё не завершено.`;
    waitingHint.classList.remove("info--hidden");
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const rawText = await response.text();
  let data;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.title ||
      rawText ||
      `Ошибка ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function toggleButton(button, isLoading, loadingText) {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.originalText;
}

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `alert alert--${type}`;
}

function hideStatus() {
  statusBox.textContent = "";
  statusBox.className = "alert alert--hidden";
}

function persistSession() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      userName: currentUser,
      giftFor: currentGiftFor
    })
  );
}
