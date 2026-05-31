const WEBHOOK_SHEETS = "https://n8n.gorekia.com/webhook/registros";

let todosLosRegistros = [];
let seleccionados = new Set();
let filtroFacturat = "totes"; // totes | pendents | facturades

document.addEventListener("DOMContentLoaded", function () {
  cargarRegistros();

  document.getElementById("filtro-cliente").addEventListener("input", filtrar);
  document.getElementById("filtro-desde").addEventListener("change", filtrar);
  document.getElementById("filtro-hasta").addEventListener("change", filtrar);
  document.getElementById("filtro-facturat").addEventListener("change", function() {
    filtroFacturat = this.value;
    filtrar();
  });
});

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

function filtrar() {
  const textoBusqueda = document.getElementById("filtro-cliente").value.toLowerCase();
  const desde = document.getElementById("filtro-desde").value;
  const hasta = document.getElementById("filtro-hasta").value;

  const filtrados = todosLosRegistros.filter((r) => {
    const coincideCliente = r["NOM CLIENT"].toLowerCase().includes(textoBusqueda);
    const fecha = r["DATA "];
    const coincideDesde = desde ? fecha >= desde : true;
    const coincideHasta = hasta ? fecha <= hasta : true;
    const facturat = r["FACTURAT"] === "SI";
    const coincideFacturat =
      filtroFacturat === "totes" ? true :
      filtroFacturat === "facturades" ? facturat :
      !facturat;
    return coincideCliente && coincideDesde && coincideHasta && coincideFacturat;
  });

  seleccionados.clear();
  actualizarContador();
  renderTabla(filtrados);
}

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
    const facturat = r["FACTURAT"] === "SI";
    const fila = document.createElement("div");
    fila.className = "table-data-row" + (seleccionados.has(i) ? " selected" : "") + (facturat ? " facturat" : "");

    fila.innerHTML = `
      <div class="cell">
        <div class="check ${seleccionados.has(i) ? "on" : ""}">${seleccionados.has(i) ? "✓" : ""}</div>
      </div>
      <div class="cell">${r["NOM CLIENT"] || "—"}</div>
      <div class="cell">${r["DATA "] || "—"}</div>
      <div class="cell">${r["HORES TOTALS"] || "—"}</div>
      <div class="cell">${r["CONCEPTE"] || "—"}</div>
      <div class="cell ${!r["MATERIAL"] || r["MATERIAL"].trim() === "" ? "dim" : ""}">${r["MATERIAL"] || "—"}</div>
      <div class="cell">${r["QUANTITAT"] || "—"}</div>
      <div class="cell">${r["PREU-UNITARI"] || "—"}</div>
      <div class="cell">${r["PREU-TOTAL"] || "—"}</div>
      <div class="cell">${facturat ? '<span class="facturat-badge">✓ Facturada</span>' : ""}</div>
    `;

    fila.addEventListener("click", function () {
      if (facturat) return;
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

function actualizarContador() {
  const n = seleccionados.size;
  const el = document.getElementById("sel-count");
  el.textContent = n > 0
    ? n + " fila" + (n > 1 ? "s" : "") + " seleccionada" + (n > 1 ? "s" : "")
    : "";
}

function irAGenerador() {
  if (seleccionados.size === 0) {
    alert("Selecciona almenys una fila per generar una factura.");
    return;
  }
  localStorage.setItem("filas_seleccionadas", JSON.stringify([...seleccionados]));
  window.location.href = "generador-facturas.html";
}