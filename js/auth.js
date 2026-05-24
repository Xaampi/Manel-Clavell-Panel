// URL del webhook de n8n que valida las credenciales
const WEBHOOK_URL = "https://n8n.gorekia.com/webhook/login";

// Esperamos a que el HTML esté completamente cargado antes de ejecutar nada
document.addEventListener("DOMContentLoaded", function () {

  const btnLogin = document.getElementById("btn-login");

  btnLogin.addEventListener("click", async function () {

    // Leemos lo que el usuario ha escrito en los campos
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    // Si algún campo está vacío, avisamos y no enviamos nada
    if (!usuario || !password) {
      alert("Por favor rellena todos los campos.");
      return;
    }

    try {
      // Enviamos las credenciales al webhook de n8n
      const respuesta = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
      });

      const datos = await respuesta.json();

      if (datos.success) {
        // Guardamos el token en el navegador para usarlo en las demás páginas
        localStorage.setItem("mcj_token", datos.token);
        // Redirigimos al dashboard
        window.location.href = "dashboard.html";
      } else {
        alert("Usuario o contraseña incorrectos.");
      }

    } catch (error) {
      alert("Error de conexión. Inténtalo de nuevo.");
    }

  });

});