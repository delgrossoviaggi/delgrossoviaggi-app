/// 🔒 AUTH (admin chiuso fino a password)
const ADMIN_PASSWORD = "del2025bus";

const authBox = document.getElementById("authBox");
const panel = document.getElementById("panel");
const adminPass = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");
const adminMsg = document.getElementById("adminMsg");
const logoutBtn = document.getElementById("logoutBtn");

function setMsg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text || "";
  el.style.color = ok ? "green" : "crimson";
}

function isLogged() {
  return sessionStorage.getItem("dg_admin_ok") === "1";
}
function setLogged(v) {
  sessionStorage.setItem("dg_admin_ok", v ? "1" : "0");
}
function showPanel() {
  if (authBox) authBox.style.display = "none";
  if (panel) panel.style.display = "grid";
}
function showLogin() {
  if (authBox) authBox.style.display = "block";
  if (panel) panel.style.display = "none";
}

async function initAuth(bootAdminFn) {
  if (!authBox || !panel) return;

  // default: sempre login
  showLogin();

  if (isLogged()) {
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
    await bootAdminFn();
    return;
  }

  loginBtn?.addEventListener("click", async () => {
    const p = (adminPass?.value || "").trim();
    if (!p) return setMsg(adminMsg, "Inserisci la password.", false);
    if (p !== ADMIN_PASSWORD) return setMsg(adminMsg, "Password errata.", false);

    setLogged(true);
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
    await bootAdminFn();
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("dg_admin_ok");
    location.reload();
  });
}

// ✅ poi in fondo al file:
// initAuth(() => bootAdmin().catch(console.error));
