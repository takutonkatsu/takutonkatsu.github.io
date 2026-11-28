import { anonKey } from "./supabase-config.js";

const endpoint = "https://hxtjrvnvviugnvqfyzgd.supabase.co/rest/v1/rpc/register_cookride_beta";
const overview = document.querySelector("#overview");
const guide = document.querySelector("#application-guide");
const signup = document.querySelector("#signup");
const registered = document.querySelector("#registered");
const start = document.querySelector("#start-application");
const guideForm = document.querySelector("#guide-form");
const guideRead = document.querySelector("#guide-read");
const continueToSignup = document.querySelector("#continue-to-signup");
const backToGuide = document.querySelector("#back-to-guide");
const form = document.querySelector("#signup-form");
const email = document.querySelector("#email");
const button = form.querySelector("button");
const status = document.querySelector("#signup-status");
let sending = false;

function updateButtons() {
  continueToSignup.disabled = !guideRead.checked;
  button.disabled = sending || !guideRead.checked || !form.checkValidity();
  backToGuide.disabled = sending;
}

function showStep(step) {
  for (const section of [overview, guide, signup, registered]) {
    section.hidden = section !== step;
  }
  if (step !== overview) overview.querySelector("video").pause();
  const focusTarget = step === overview ? start : step.querySelector("h2");
  focusTarget.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

start.hidden = false;
start.addEventListener("click", () => showStep(guide));
document.querySelector("#back-to-overview").addEventListener("click", () => {
  guideForm.reset();
  updateButtons();
  showStep(overview);
});
backToGuide.addEventListener("click", () => showStep(guide));
guideForm.addEventListener("input", updateButtons);
guideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!guide.hidden && guideRead.checked) showStep(signup);
});
form.addEventListener("input", updateButtons);
window.addEventListener("pageshow", updateButtons);
guideForm.reset();
updateButtons();

// Open the required guide even if an older link points at the consent heading.
if (["#application-guide", "#signup-heading"].includes(location.hash)) showStep(guide);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (signup.hidden || sending || !guideRead.checked || !form.reportValidity()) return;

  sending = true;
  updateButtons();
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
    showStep(registered);
    guideForm.reset();
    form.reset();
    status.textContent = "";
  } catch {
    status.textContent = "受付を確認できませんでした。通信の状態を確認して、もう一度お試しください。";
  } finally {
    window.clearTimeout(timer);
    sending = false;
    updateButtons();
  }
});
