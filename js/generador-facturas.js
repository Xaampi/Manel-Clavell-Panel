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
const PRECIO_HORA = 22.5;

function cargarLinies() {
  const indexos = JSON.parse(localStorage.getItem("filas_seleccionadas") || "[]");
  const registres = JSON.parse(localStorage.getItem("registres_cache") || "[]");
  const tbody = document.getElementById("linies-tbody");

  if (indexos.length === 0 || registres.length === 0) {
    tbody.innerHTML = '<div class="table-empty">No hi ha línies seleccionades. <a href="registro-horas.html">Torna al registre</a>.</div>';
    return;
  }

  const linies = indexos.map(i => registres[i]).filter(Boolean);

  // Autorellenar el nombre del cliente con el de la primera fila seleccionada
  const nomClient = linies[0]["NOM CLIENT"] || "";
  document.getElementById("nom-client").value = nomClient;

  let totalGeneral = 0;
  let totalHoresGeneral = 0;

  linies.forEach(r => {
    const hores = parseFloat(r["HORES TOTALS"]) || 0;
    const totalMaObra = hores * PRECIO_HORA;
    const totalMaterial = parseFloat(r["PREU-TOTAL"]) || 0;
    totalHoresGeneral += hores;
    totalGeneral += totalMaObra + totalMaterial;

    // Línea 1 — mà d'obra
    const filaMaObra = document.createElement("div");
    filaMaObra.className = "table-data-row";
    filaMaObra.innerHTML = `
      <div class="cell">${r["CONCEPTE"] || "—"}</div>
      <div class="cell right">${hores}h</div>
      <div class="cell right">22,5 €</div>
      <div class="cell right">${totalMaObra.toFixed(2)} €</div>
    `;
    tbody.appendChild(filaMaObra);

    // Línea 2 — material (solo si existe)
    const material = r["MATERIAL"] ? r["MATERIAL"].trim() : "";
    const quantitat = r["QUANTITAT"] ? r["QUANTITAT"].toString().trim() : "";
    const preuUnitari = parseFloat(r["PREU-UNITARI"]) || 0;

    if (material && material !== "" && totalMaterial > 0) {
      const filaMaterial = document.createElement("div");
      filaMaterial.className = "table-data-row material-row";
      filaMaterial.innerHTML = `
        <div class="cell dim">Material: ${material}</div>
        <div class="cell right dim">${quantitat}</div>
        <div class="cell right dim">${preuUnitari > 0 ? preuUnitari + " €" : "—"}</div>
        <div class="cell right dim">${totalMaterial.toFixed(2)} €</div>
      `;
      tbody.appendChild(filaMaterial);
    }
  });

  document.getElementById("resum-linies").textContent =
    linies.length + " líni" + (linies.length > 1 ? "es" : "a") + " · " + totalHoresGeneral + "h";
  document.getElementById("resum-total").textContent =
    totalGeneral.toFixed(2).replace(".", ",") + " €";

  window.liniesFactura = linies;
  window.totalFactura = totalGeneral;
}

// ── GENERAR FACTURA ──
async function generarFactura() {
  console.log("Generant factura...");
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

    if (!res.ok) throw new Error("Error del servidor");

    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Factura_${numFactura}_${nomClient}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);

    localStorage.removeItem("filas_seleccionades");

  } catch (e) {
    alert("Error en generar la factura. Comprova la connexió amb n8n.");
  } finally {
    btn.classList.remove("loading");
    btn.innerHTML = '<i class="ti ti-sparkles"></i> Generar factura amb IA';
  }
}