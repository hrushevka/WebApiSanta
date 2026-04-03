const API_BASE = "https://localhost:7161";
const LOOKUP_WISH_ENDPOINT = `${API_BASE}/api/santa/wish`;
const STORAGE_KEY = "secret-santa-user";

const lookupForm = document.getElementById("lookupForm");
const friendNameInput = document.getElementById("friendNameInput");
const lookupButton = document.getElementById("lookupButton");
const lookupStatus = document.getElementById("lookupStatus");
const wishResultSection = document.getElementById("wishResultSection");
const wishResultText = document.getElementById("wishResultText");

init();

function init() {
  restoreFriendName();
  lookupForm.addEventListener("submit", handleLookup);
}

function restoreFriendName() {
  const savedRaw = localStorage.getItem(STORAGE_KEY);
  if (!savedRaw) return;

  try {
    const saved = JSON.parse(savedRaw);
    if (saved?.giftFor) {
      friendNameInput.value = saved.giftFor;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function handleLookup(event) {
  event.preventDefault();

  const friendName = friendNameInput.value.trim();
  if (!friendName) {
    showStatus("Введи имя друга.", "error");
    friendNameInput.focus();
    return;
  }

  toggleButton(lookupButton, true, "Загружаем...");
  hideStatus();
  hideWishResult();

  try {
    const data = await requestJson(`${LOOKUP_WISH_ENDPOINT}/${encodeURIComponent(friendName)}`, {
      method: "GET"
    });

    const name = data.name || friendName;
    const wish = typeof data.wish === "string" ? data.wish.trim() : "";

    wishResultSection.classList.remove("result--hidden");
    wishResultText.textContent = wish
      ? `${name} хочет: ${wish}`
      : `${name} пока не оставил пожелание.`;

    showStatus("Пожелание успешно получено.", "success");
  } catch (error) {
    showStatus(error.message || "Не удалось получить пожелание.", "error");
  } finally {
    toggleButton(lookupButton, false, "Получить пожелание");
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
  lookupStatus.textContent = message;
  lookupStatus.className = `alert alert--${type}`;
}

function hideStatus() {
  lookupStatus.textContent = "";
  lookupStatus.className = "alert alert--hidden";
}

function hideWishResult() {
  wishResultSection.classList.add("result--hidden");
  wishResultText.textContent = "";
}
