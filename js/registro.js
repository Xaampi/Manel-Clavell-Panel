// URL del webhook de n8n que devuelve los registros del Google Sheets
const WEBHOOK_SHEETS = "https://n8n.gorekia.com/webhook/registros";

let todosLosRegistros = [];
let seleccionados = new Set();

// ── INICIO ──
document.addEventListener("DOMContentLoaded", function () {
  cargarRegistros();

  // Filtros en tiempo real
  document.getElementById("filtro-cliente").addEventListener("input", filtrar);
  document.getElementById("filtro-desde").addEventListener("change", filtrar);
  document.getElementById("filtro-hasta").addEventListener("change", filtrar);
});

// ── CARGA DE DATOS DESDE N8N → GOOGLE SHEETS ──
async function cargarRegistros() {
  try {
    const res = await fetch(WEBHOOK_SHEETS);
    const datos = await res.json();
    todosLosRegistros = datos;
    localStorage.setItem("registres_cache", JSON.stringify(datos));
    renderTabla(todosLosRegistros);
  } catch (e) {
    document.getElementById("tbody").innerHTML =
      '<div class="table-empty">Error carregant les dades. Comprova la connexió amb n8n.</div>';
  }
}

// ── FILTRADO ──
function filtrar() {
  const textoBusqueda = document.getElementById("filtro-cliente").value.toLowerCase();
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;

  const filtrados = todosLosRegistros.filter((r) => {
    const coincideCliente = r["NOM CLIENT"].toLowerCase().includes(textoBusqueda);
    const fecha = r["DATA "]; // formato YYYY-MM-DD esperado desde Sheets
    const coincideDesde = desde ? fecha >= desde : true;
    const coincideHasta = hasta ? fecha <= hasta : true;
    return coincideCliente && coincideDesde && coincideHasta;
  });

  seleccionados.clear();
  actualizarContador();
  renderTabla(filtrados);
}

// ── RENDER DE FILAS ──
function renderTabla(registros) {
  const tbody = document.getElementById("tbody");
  const footer = document.getElementById("footer-txt");

  if (registros.length === 0) {
    tbody.innerHTML = '<div class="table-empty">No s\'han trobat registres.</div>';
    footer.textContent = "0 registres";
    return;
  }

  footer.textContent = registros.length + " registres";
  tbody.innerHTML = "";

  registros.forEach((r, i) => {
    const fila = document.createElement("div");
    fila.className = "table-data-row" + (seleccionados.has(i) ? " selected" : "");

    fila.innerHTML = `
      <div class="cell">
        <div class="check ${seleccionados.has(i) ? "on" : ""}">${seleccionados.has(i) ? "✓" : ""}</div>
      </div>
      <div class="cell">${r["NOM CLIENT"] || "—"}</div>
      <div class="cell">${r["DATA "] || "—"}</div>
      <div class="cell">${r["HORES TOTALS"] || "—"}</div>
      <div class="cell">${r["CONCEPTE"] || "—"}</div>
      <div class="cell ${!r["MATERIAL"] || r["MATERIAL"].trim() === "" ? "dim" : ""}">${r["MATERIAL"] || "—"}</div>
      <div class="cell">${r["PREU-UNITAT"] || "—"}</div>
    `;

    fila.addEventListener("click", function () {
      if (seleccionados.has(i)) {
        seleccionados.delete(i);
      } else {
        seleccionados.add(i);
      }
      actualizarContador();
      renderTabla(registros);
    });

    tbody.appendChild(fila);
  });
}

// ── CONTADOR DE SELECCIONADOS ──
function actualizarContador() {
  const n = seleccionados.size;
  const el = document.getElementById("sel-count");
  el.textContent = n > 0
    ? n + " fila" + (n > 1 ? "s" : "") + " seleccionada" + (n > 1 ? "s" : "")
    : "";
}

// ── IR AL GENERADOR CON LAS FILAS SELECCIONADAS ──
function irAGenerador() {
  if (seleccionados.size === 0) {
    alert("Selecciona almenys una fila per generar una factura.");
    return;
  }
  // Guardamos los índices seleccionados en localStorage para pasarlos al generador
  localStorage.setItem("filas_seleccionadas", JSON.stringify([...seleccionados]));
  window.location.href = "generador-facturas.html";
}