// 🔒 Password (cambiala!)
const ADMIN_PASSWORD = "del2025bus";

// auth helpers
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

function initAuth() {
  if (!authBox || !panel) return;

  // 🔥 SEMPRE: di default mostra login
  showLogin();

  // se già loggato nella sessione corrente
  if (isLogged()) {
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
    bootAdmin().catch(console.error);
    return;
  }

  loginBtn?.addEventListener("click", async () => {
    const p = (adminPass?.value || "").trim();
    if (!p) return setMsg(adminMsg, "Inserisci la password.", false);
    if (p !== ADMIN_PASSWORD) return setMsg(adminMsg, "Password errata.", false);

    setLogged(true);
    showPanel();
    setMsg(adminMsg, "Accesso OK ✅", true);
    await bootAdmin();
  });
}

// ✅ INIT: non avviare bootAdmin se non loggato
initAuth();
