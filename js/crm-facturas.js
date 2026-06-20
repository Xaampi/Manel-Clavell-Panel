// ── CONFIG ────────────────────────────────────────────────────────────────────
const WEBHOOK_GET      = "https://n8n.gorekia.com/webhook/get-facturas";
const WEBHOOK_ESTAT     = "https://n8n.gorekia.com/webhook/update-estat";
const WEBHOOK_PDF       = "https://n8n.gorekia.com/webhook/regenerar-pdf";
const WEBHOOK_ELIMINAR  = "https://n8n.gorekia.com/webhook/eliminar-factura";

// ── STATE ─────────────────────────────────────────────────────────────────────
let allFactures = [];
let editingId   = null;
let deletingId  = null;

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("mcj_token") || localStorage.getItem("mcj_token") === "") {
    window.location.href = "index.html";
    return;
  }

  // Fecha topbar
  const fechaHoy = document.getElementById("fecha-hoy");
  const hoy = new Date();
  const opciones = { day: "numeric", month: "long", year: "numeric" };
  fechaHoy.textContent = hoy.toLocaleDateString("ca-ES", opciones);

  // Toggle sidebar
  const sidebar    = document.getElementById("sidebar");
  const toggleBtn  = document.getElementById("toggleBtn");
  const toggleIcon = document.getElementById("toggleIcon");

  toggleBtn.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
    toggleIcon.className = sidebar.classList.contains("collapsed")
      ? "ti ti-layout-sidebar-left-expand"
      : "ti ti-layout-sidebar-left-collapse";
  });

  // Logout
  document.getElementById("btn-logout").addEventListener("click", function () {
    localStorage.removeItem("mcj_token");
    window.location.href = "index.html";
  });

  // Modal tancar clicant fora
  document.getElementById("modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  document.getElementById("modal-eliminar-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeModalEliminar();
  });

  loadFactures();
});

// ── CARREGAR FACTURES ─────────────────────────────────────────────────────────
async function loadFactures() {
  try {
    const res  = await fetch(WEBHOOK_GET);
    const data = await res.json();
    allFactures = Array.isArray(data) ? data : (data.facturas || []);
    renderTable(allFactures);
    renderStats(allFactures);
  } catch (e) {
    document.getElementById("table-body").innerHTML =
      '<div class="table-empty">Error carregant les factures. Comprova la connexió amb n8n.</div>';
  }
}

// ── RENDER TAULA ──────────────────────────────────────────────────────────────
function renderTable(facturas) {
  const body = document.getElementById("table-body");
  if (!facturas.length) {
    body.innerHTML = '<div class="table-empty">No s\'han trobat factures.</div>';
    return;
  }
  body.innerHTML = facturas.map(f => `
    <div class="crm-row">
      <span class="num">${esc(f.num_factura)}</span>
      <span>${esc(f.nom_client)}</span>
      <span class="muted">${formatData(f.data_factura)}</span>
      <span class="import">${formatImport(f.total)}</span>
      <span class="badge-cell">${badgeHTML(f.estat)}</span>
      <span class="muted">${esc(f.notes || "—")}</span>
      <span class="right">
        <div class="actions">
          <button class="btn-icon" title="Descarregar PDF" onclick="downloadPDF(${f.id})">
            <i class="ti ti-download"></i>
          </button>
          <button class="btn-icon" title="Canviar estat" onclick="openModal(${f.id}, \`${esc(f.estat)}\`)">
            <i class="ti ti-edit"></i>
          </button>
          <button class="btn-icon btn-icon-danger" title="Eliminar factura" onclick="openModalEliminar(${f.id}, \`${esc(f.num_factura)}\`)">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </span>
    </div>
  `).join("");
}

// ── RENDER STATS ──────────────────────────────────────────────────────────────
function renderStats(facturas) {
  const pending = facturas.filter(f => f.estat === "Pendent d'enviar");
  const sent    = facturas.filter(f => f.estat === "Pendent de cobrar");
  const paid    = facturas.filter(f => f.estat === "Cobrada");

  document.getElementById("stat-pending").textContent        = pending.length;
  document.getElementById("stat-sent").textContent           = sent.length;
  document.getElementById("stat-paid").textContent           = paid.length;
  document.getElementById("stat-pending-import").textContent = formatImport(sumImport(pending));
  document.getElementById("stat-sent-import").textContent    = formatImport(sumImport(sent));
  document.getElementById("stat-paid-import").textContent    = formatImport(sumImport(paid));
}

function sumImport(arr) {
  return arr.reduce((acc, f) => acc + parseFloat(f.total || 0), 0);
}

// ── FILTRES ───────────────────────────────────────────────────────────────────
function applyFilters() {
  const from  = document.getElementById("filter-from").value;
  const to    = document.getElementById("filter-to").value;
  const estat = document.getElementById("filter-estat").value;

  let filtered = allFactures;
  if (from)  filtered = filtered.filter(f => f.data_factura >= from);
  if (to)    filtered = filtered.filter(f => f.data_factura <= to);
  if (estat) filtered = filtered.filter(f => f.estat === estat);

  renderTable(filtered);
  renderStats(filtered);
}

function clearFilters() {
  document.getElementById("filter-from").value  = "";
  document.getElementById("filter-to").value    = "";
  document.getElementById("filter-estat").value = "";
  renderTable(allFactures);
  renderStats(allFactures);
}

// ── MODAL ESTAT ───────────────────────────────────────────────────────────────
function openModal(id, estatActual) {
  editingId = id;
  document.getElementById("modal-select").value = estatActual;
  document.getElementById("modal-overlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  editingId = null;
}

async function confirmEstat() {
  const nouEstat = document.getElementById("modal-select").value;
  const id = editingId;
  closeModal();
  try {
    await fetch(WEBHOOK_ESTAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estat: nouEstat })
    });
    const idx = allFactures.findIndex(f => f.id === id);
    if (idx !== -1) allFactures[idx].estat = nouEstat;
    applyFilters();
    showToast("Estat actualitzat correctament");
  } catch (e) {
    showToast("Error actualitzant l'estat");
  }
}

// ── MODAL ELIMINAR ────────────────────────────────────────────────────────────
function openModalEliminar(id, numFactura) {
  deletingId = id;
  document.getElementById("eliminar-num-factura").textContent = numFactura;
  document.getElementById("modal-eliminar-overlay").classList.add("open");
}

function closeModalEliminar() {
  document.getElementById("modal-eliminar-overlay").classList.remove("open");
  deletingId = null;
}

async function confirmEliminar() {
  const id = deletingId;
  closeModalEliminar();
  try {
    await fetch(WEBHOOK_ELIMINAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    allFactures = allFactures.filter(f => f.id !== id);
    applyFilters();
    showToast("Factura eliminada correctament");
  } catch (e) {
    showToast("Error eliminant la factura");
  }
}

// ── DOWNLOAD PDF ────────────
async function downloadPDF(id) {
  showToast("Generant PDF...");
  try {
    const factura = allFactures.find(f => f.id === id);
    const filename = `${factura.num_factura}_${factura.nom_client}.pdf`;

    const res = await fetch(WEBHOOK_PDF, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("PDF descarregat");
  } catch (e) {
    showToast("Error generant el PDF");
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function badgeHTML(estat) {
  const map = {
    "Pendent d'enviar": ["pendiente", "Pendent d'enviar"],
    "Pendent de cobrar": ["enviada",  "Pendent de cobrar"],
    "Cobrada":           ["cobrada",  "Cobrada"],
  };
  const [cls, label] = map[estat] || ["pendiente", estat];
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

function formatData(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return d;
  return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
}

function formatImport(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return n.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function esc(str) {
  return String(str || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}