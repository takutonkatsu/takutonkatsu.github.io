import { anonKey } from "./supabase-config.js";

const endpoint = "https://hxtjrvnvviugnvqfyzgd.supabase.co/rest/v1/rpc/register_cookride_beta";
const form = document.querySelector("#signup-form");
const email = document.querySelector("#email");
const button = form.querySelector("button");
const status = document.querySelector("#signup-status");
let sending = false;

function updateButton() {
  button.disabled = sending || !form.checkValidity();
}

form.hidden = false;
form.addEventListener("input", updateButton);
window.addEventListener("pageshow", updateButton);
updateButton();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending || !form.reportValidity()) return;

  sending = true;
  updateButton();
  status.textContent = "申し込みを送信しています…";
  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ p_email: email.value.trim(), p_agreed: true }),
      signal: timeout.signal,
    });
    if (response.status === 429) {
      status.textContent = "申し込みが集中しています。1分ほど待ってから、もう一度お試しください。";
      return;
    }
    if (response.status === 400 && (await response.json()).message === "invalid_email") {
      status.textContent = "メールアドレスをご確認ください。";
      email.focus();
      return;
    }
    if (!response.ok) throw new Error("signup failed");
    const url = await response.json();
    if (typeof url !== "string" || !/^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/.test(url)) {
      throw new Error("invalid invitation");
    }

    document.querySelector("#invitation").href = url;
    document.querySelector("#overview").hidden = true;
    document.querySelector("#signup").hidden = true;
    document.querySelector("#registered").hidden = false;
    document.querySelector("#registered-heading").focus();
    window.scrollTo(0, 0);
    form.reset();
    status.textContent = "";
  } catch {
    status.textContent = "受付を確認できませんでした。通信の状態を確認して、もう一度お試しください。";
  } finally {
    window.clearTimeout(timer);
    sending = false;
    updateButton();
  }
});
