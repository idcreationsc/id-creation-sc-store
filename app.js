// Carga estable de la tienda ID Creation SC
fetch("https://raw.githubusercontent.com/idcreationsc/id-creation-sc-store/d6f7f0752ac931dfe9b4c11f7ae727e325143f49/app.js")
  .then(r => {
    if (!r.ok) throw new Error("No se pudo cargar la aplicación");
    return r.text();
  })
  .then(code => {
    const exports = `
      Object.defineProperty(window, "products", {
        configurable: true,
        get: () => products,
        set: value => { products = value; }
      });

      Object.defineProperty(window, "orders", {
        configurable: true,
        get: () => orders,
        set: value => { orders = value; }
      });

      Object.defineProperty(window, "seedProducts", {
        configurable: true,
        get: () => seedProducts
      });

      window.saveProducts = saveProducts;
      window.renderProducts = renderProducts;
      window.renderAdmin = renderAdmin;
      window.renderAdminOrders = renderAdminOrders;
      window.saveOrders = saveOrders;
    `;

    (0, eval)(code + exports);
  })
  .catch(err => console.error("ID Creation SC:", err));
