// Carga estable de la tienda ID Creation SC
fetch("https://raw.githubusercontent.com/idcreationsc/id-creation-sc-store/d6f7f0752ac931dfe9b4c11f7ae727e325143f49/app.js")
  .then(r => {
    if (!r.ok) throw new Error("No se pudo cargar la aplicación");
    return r.text();
  })
  .then(code => {
    (0, eval)(code);

    if (typeof products !== "undefined") window.products = products;
    if (typeof seedProducts !== "undefined") window.seedProducts = seedProducts;
    if (typeof orders !== "undefined") window.orders = orders;

    if (typeof saveProducts === "function") window.saveProducts = saveProducts;
    if (typeof renderProducts === "function") window.renderProducts = renderProducts;
    if (typeof renderAdmin === "function") window.renderAdmin = renderAdmin;
    if (typeof renderAdminOrders === "function") window.renderAdminOrders = renderAdminOrders;
    if (typeof saveOrders === "function") window.saveOrders = saveOrders;
  })
  .catch(err => console.error("ID Creation SC:", err));
