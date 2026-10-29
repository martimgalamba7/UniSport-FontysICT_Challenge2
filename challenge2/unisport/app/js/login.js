/* ==========================================================================
   STUDENT SIGN-IN CONTROLLER
   ========================================================================== */

import { loginStudentWithPassword } from "./auth.js";

if (window.lucide) {
  lucide.createIcons();
}

const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passInput = document.getElementById("login-password");
const btnSubmit = document.getElementById("btn-submit");
const errorBox = document.getElementById("signin-error");
const togglePass = document.getElementById("btn-toggle-pass");

if (togglePass && passInput) {
  togglePass.addEventListener("click", () => {
    passInput.type = passInput.type === "password" ? "text" : "password";
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    const email = emailInput.value.trim();
    const password = passInput.value;

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Signing in...";

    try {
      const res = await loginStudentWithPassword(email, password);
      if (res.success) {
        window.location.href = "./welcome.html";
      } else {
        errorBox.textContent = res.error || "Invalid student credentials.";
        errorBox.classList.remove("hidden");
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Sign in";
      }
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Sign in";
    }
  });
}
