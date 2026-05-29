// ── CONFIG ────────────────────────────────────────────────────────────────────
const WEBHOOK_DASHBOARD = "https://n8n.gorekia.com/webhook/get-dashboard";

// ── FECHA TOPBAR ──────────────────────────────────────────────────────────────
const fechaHoy = document.getElementById("fecha-hoy");
const hoy = new Date();
const opciones = { day: "numeric", month: "long", year: "numeric" };
fechaHoy.textContent = hoy.toLocaleDateString("es-ES", opciones);

// ── TOGGLE SIDEBAR ────────────────────────────────────────────────────────────
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

// ── CERRAR SESIÓN ─────────────────────────────────────────────────────────────
document.getElementById("btn-logout").addEventListener("click", function () {
  localStorage.removeItem("mcj_token");
  window.location.href = "index.html";
});

// ── CARGAR DASHBOARD ──────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res  = await fetch(WEBHOOK_DASHBOARD);
    const data = await res.json();

    // Tarjetas
    document.querySelector(".cards .card:nth-child(1) .card-value").textContent = data.hores_mes + "h";
    document.querySelector(".cards .card:nth-child(2) .card-value").textContent = data.facturas_mes;
    document.querySelector(".cards .card:nth-child(3) .card-value").textContent =
      parseFloat(data.pendent_cobrar).toLocaleString("ca-ES", { minimumFractionDigits: 2 }) + " €";

    // Últimas facturas
    const tableBody = document.getElementById("ultimes-facturas");
    if (!data.ultimes_facturas || !data.ultimes_facturas.length) {
      tableBody.innerHTML = '<div class="table-empty"><p>No hay facturas registradas aún.</p></div>';
      return;
    }

    tableBody.innerHTML = data.ultimes_facturas.map(f => `
      <div class="table-row">
        <span>${f.nom_client}</span>
        <span>${formatData(f.data_factura)}</span>
        <span>${parseFloat(f.total).toLocaleString("ca-ES", { minimumFractionDigits: 2 })} €</span>
        <span>${badgeHTML(f.estat)}</span>
      </div>
    `).join("");

  } catch (e) {
    console.error("Error carregant dashboard:", e);
  }
}

function formatData(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
}

function badgeHTML(estat) {
  const map = {
    "Pendent d'enviar": ["pendiente", "Pendent d'enviar"],
    "Pendent de cobrar": ["enviada", "Pendent de cobrar"],
    "Cobrada": ["cobrada", "Cobrada"],
  };
  const [cls, label] = map[estat] || ["pendiente", estat];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

loadDashboard();