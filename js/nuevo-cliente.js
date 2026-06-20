const WEBHOOK_CREAR_CLIENT = "https://n8n.gorekia.com/webhook/crear-client";

document.addEventListener("DOMContentLoaded", function () {

  // Autorellena el nom si ve del dropdown
  const nomPreomplet = localStorage.getItem("nou_client_nom");
  if (nomPreomplet) {
    document.getElementById("nou-nom").value = nomPreomplet;
    localStorage.removeItem("nou_client_nom");
  }

  document.getElementById("btn-guardar").addEventListener("click", guardarClient);
});

async function guardarClient() {
  const nom      = document.getElementById("nou-nom").value.trim();
  const nif      = document.getElementById("nou-nif").value.trim();
  const adreca   = document.getElementById("nou-adreca").value.trim();
  const poblacio = document.getElementById("nou-poblacio").value.trim();

  if (!nom) {
    alert("El nom és obligatori.");
    return;
  }

  const btn = document.getElementById("btn-guardar");
  btn.classList.add("loading");
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Guardant...';

  try {
    await fetch(WEBHOOK_CREAR_CLIENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, nif, adreca, poblacio })
    });

    // Guardar el nom al localStorage perquè el generador el preompli
    localStorage.setItem("client_creat_nom", nom);
    window.location.href = "generador-facturas.html";

  } catch (e) {
    alert("Error guardant el client. Comprova la connexió amb n8n.");
    btn.classList.remove("loading");
    btn.innerHTML = '<i class="ti ti-user-plus"></i> Guardar client';
  }
}