// Carga estable de la tienda ID Creation SC
fetch("https://raw.githubusercontent.com/idcreationsc/id-creation-sc-store/d6f7f0752ac931dfe9b4c11f7ae727e325143f49/app.js")
  .then(r => {
    if (!r.ok) throw new Error("No se pudo cargar la aplicación");
    return r.text();
  })
  .then(code => (0, eval)(code))
  .catch(err => console.error("ID Creation SC:", err));
