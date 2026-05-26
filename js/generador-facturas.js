const WEBHOOK_GENERAR = "https://n8n.gorekia.com/webhook/generar-factura";

document.addEventListener("DOMContentLoaded", function () {

  // Fecha de hoy en el topbar
  const hoy = new Date();
  document.getElementById("fecha-hoy").textContent =
    hoy.toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });

  // Fecha por defecto en el formulario
  document.getElementById("data-factura").value = hoy.toISOString().split("T")[0];

  // Cargar filas seleccionadas desde localStorage
  cargarLinies();

  // Botón generar
  document.getElementById("btn-generar").addEventListener("click", generarFactura);
});

// ── CARGAR FILAS SELECCIONADAS ──
function cargarLinies() {
  const indexos = JSON.parse(localStorage.getItem("filas_seleccionadas") || "[]");
  const registres = JSON.parse(localStorage.getItem("registres_cache") || "[]");
  const tbody = document.getElementById("linies-tbody");

  if (indexos.length === 0 || registres.length === 0) {
    tbody.innerHTML = '<div class="table-empty">No hi ha línies seleccionades. <a href="registro-horas.html">Torna al registre</a>.</div>';
    return;
  }

  const linies = indexos.map(i => registres[i]).filter(Boolean);
  let totalHores = 0;
  let totalImport = 0;

  linies.forEach(r => {
    const hores = parseFloat(r["HORES TOTALS"]) || 0;
    const preu = parseFloat(r["PREU-UNITAT"]) || 0;
    const total = hores * preu;
    totalHores += hores;
    totalImport += total;

    const fila = document.createElement("div");
    fila.className = "table-data-row";
    fila.innerHTML = `
      <div class="cell">${r["CONCEPTE"] || "—"}</div>
      <div class="cell right">${hores}h</div>
      <div class="cell right">${preu > 0 ? preu + " €" : "—"}</div>
      <div class="cell right">${total > 0 ? total.toFixed(2) + " €" : "—"}</div>
    `;
    tbody.appendChild(fila);
  });

  document.getElementById("resum-linies").textContent =
    linies.length + " líni" + (linies.length > 1 ? "es" : "a") + " · " + totalHores + "h";
  document.getElementById("resum-total").textContent =
    totalImport.toFixed(2).replace(".", ",") + " €";

  // Guardamos las líneas procesadas para usarlas al generar
  window.liniesFactura = linies;
  window.totalFactura = totalImport;
}

// ── GENERAR FACTURA ──
async function generarFactura() {
  const nomClient = document.getElementById("nom-client").value.trim();
  const nifClient = document.getElementById("nif-client").value.trim();
  const numFactura = document.getElementById("num-factura").value.trim();
  const dataFactura = document.getElementById("data-factura").value;
  const notes = document.getElementById("notes").value.trim();

  if (!nomClient || !nifClient || !numFactura) {
    alert("Omple el nom del client, el NIF i el número de factura.");
    return;
  }

  const btn = document.getElementById("btn-generar");
  btn.classList.add("loading");
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Generant factura...';

  try {
    const res = await fetch(WEBHOOK_GENERAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        num_factura: numFactura,
        data_factura: dataFactura,
        nom_client: nomClient,
        nif_client: nifClient,
        notes: notes,
        linies: window.liniesFactura,
        total: window.totalFactura
      })
    });

    const dades = await res.json();

    if (dades.url_pdf) {
      // Redirigir a la previsualización o descargar directamente
      window.open(dades.url_pdf, "_blank");
      // Limpiar selección
      localStorage.removeItem("filas_seleccionadas");
    } else {
      alert("La factura s'ha generat correctament.");
    }

  } catch (e) {
    alert("Error en generar la factura. Comprova la connexió amb n8n.");
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML = '<i class="ti ti-sparkles"></i> Generar factura amb IA';
  }
}