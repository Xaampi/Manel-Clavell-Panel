// Fecha actual en el topbar
const fechaHoy = document.getElementById("fecha-hoy");
const hoy = new Date();
const opciones = { day: "numeric", month: "long", year: "numeric" };
fechaHoy.textContent = hoy.toLocaleDateString("es-ES", opciones);

// Toggle sidebar
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");
const toggleIcon = document.getElementById("toggleIcon");

toggleBtn.addEventListener("click", function () {
  sidebar.classList.toggle("collapsed");
  if (sidebar.classList.contains("collapsed")) {
    toggleIcon.className = "ti ti-layout-sidebar-left-expand";
  } else {
    toggleIcon.className = "ti ti-layout-sidebar-left-collapse";
  }
});

// Cerrar sesión
document.getElementById("btn-logout").addEventListener("click", function () {
  localStorage.removeItem("mcj_token");
  window.location.href = "index.html";
});