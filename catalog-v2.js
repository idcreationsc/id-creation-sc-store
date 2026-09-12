/* =========================================================
   ID CREATION SC — CATÁLOGO V2
   Colecciones + plantillas + mockups por color
========================================================= */

(function () {
  "use strict";

  const SB_URL = "https://vjcfhlxwkmwogbifnxlf.supabase.co";
  const SB_KEY = "sb_publishable_2_bbdS-0Zp6CJeJD1dCajQ_Sgptga9H";

  let idcCollections = [];
  let idcMockups = [];
  let currentCollection = null;

  function headers(auth = false) {
    const h = {
      apikey: SB_KEY,
      "Content-Type": "application/json"
    };

    if (auth) {
      const token = sessionStorage.getItem("idc_sb_access_token");
      if (token) h.Authorization = "Bearer " + token;
    }

    return h;
  }

  async function sbGet(path, auth = false) {
    const r = await fetch(SB_URL + "/rest/v1/" + path, {
      headers: headers(auth)
    });

    if (!r.ok) {
      throw new Error(await r.text());
    }

    return r.json();
  }

  /* ==============================
     CARGAR COLECCIONES
  ============================== */

  async function loadCollections() {
    try {
      idcCollections = await sbGet(
        "collections?select=*&active=eq.true&order=sort_order.asc,name.asc"
      );

      window.idcCollections = idcCollections;

      createCollectionsArea();
    } catch (e) {
      console.error("ID Creation SC - Colecciones:", e);
    }
  }

  /* ==============================
     CREAR ÁREA DE COLECCIONES
  ============================== */

  function createCollectionsArea() {
    const catalog =
      document.querySelector("#catalog") ||
      document.querySelector("#catalogo");

    if (!catalog) return;

    let area = document.querySelector("#idcCollectionsView");

    if (!area) {
      area = document.createElement("div");
      area.id = "idcCollectionsView";
      area.className = "collections-view hidden";

      const grid = document.createElement("div");
      grid.id = "idcCollectionsGrid";
      grid.className = "collections-grid";

      area.innerHTML = `
        <div class="collections-title">
          <span class="eyebrow">ID CREATION SC</span>
          <h2>COLECCIONES</h2>
          <p>Selecciona una colección para descubrir nuestros diseños disponibles.</p>
        </div>
      `;

      area.appendChild(grid);
      catalog.prepend(area);
    }

    renderCollections();
    connectCatalogLinks();
  }

  function renderCollections() {
    const grid = document.querySelector("#idcCollectionsGrid");
    if (!grid) return;

    if (!idcCollections.length) {
      grid.innerHTML = `
        <div class="empty">
          Próximamente encontrarás nuestras nuevas colecciones.
        </div>
      `;
      return;
    }

    grid.innerHTML = idcCollections.map(c => `
      <article class="collection-card"
               data-collection-id="${c.id}">
        ${
          c.cover_image_url
            ? `<img src="${escapeHtml(c.cover_image_url)}"
                    alt="${escapeHtml(c.name)}">`
            : `<img src="assets/logo.png"
                    alt="${escapeHtml(c.name)}">`
        }

        <div class="collection-card-info">
          <h3>${escapeHtml(c.name)}</h3>
          <p>${escapeHtml(c.description || "Ver diseños disponibles")}</p>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".collection-card").forEach(card => {
      card.addEventListener("click", () => {
        openCollection(card.dataset.collectionId);
      });
    });
  }

  /* ==============================
     ABRIR CATÁLOGO / COLECCIONES
  ============================== */

  function connectCatalogLinks() {
    document.querySelectorAll('a[href="#catalog"],a[href="#catalogo"]')
      .forEach(link => {
        if (link.dataset.idcCollectionsReady) return;

        link.dataset.idcCollectionsReady = "1";

        link.addEventListener("click", () => {
          setTimeout(showCollections, 50);
        });
      });
  }

  function showCollections() {
    currentCollection = null;

    const area = document.querySelector("#idcCollectionsView");
    const productGrid = findProductGrid();
    const sidebar = document.querySelector(".sidebar");

    if (area) area.classList.remove("hidden");
    if (productGrid) productGrid.classList.add("hidden");
    if (sidebar) sidebar.classList.add("hidden");

    const back = document.querySelector("#idcCollectionBack");
    if (back) back.remove();
  }

  function openCollection(id) {
    currentCollection = String(id);

    const area = document.querySelector("#idcCollectionsView");
    const productGrid = findProductGrid();
    const sidebar = document.querySelector(".sidebar");

    if (area) area.classList.add("hidden");
    if (productGrid) productGrid.classList.remove("hidden");
    if (sidebar) sidebar.classList.add("hidden");

    addBackButton();

    filterProductsByCollection();

    if (productGrid) {
      productGrid.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function addBackButton() {
    if (document.querySelector("#idcCollectionBack")) return;

    const productGrid = findProductGrid();
    if (!productGrid || !productGrid.parentElement) return;

    const button = document.createElement("button");
    button.id = "idcCollectionBack";
    button.className = "outline-btn collection-back";
    button.type = "button";
    button.innerHTML = "← Volver a colecciones";

    button.addEventListener("click", showCollections);

    productGrid.parentElement.insertBefore(button, productGrid);
  }

  function findProductGrid() {
    return (
      document.querySelector("#productGrid") ||
      document.querySelector(".product-grid")
    );
  }

  /* ==============================
     FILTRAR PRODUCTOS
  ============================== */

  function filterProductsByCollection() {
    if (!currentCollection) return;

    const allProducts = Array.isArray(window.products)
      ? window.products
      : [];

    const filtered = allProducts.filter(p =>
      String(
        p.collection_id ??
        p.collectionId ??
        ""
      ) === currentCollection
    );

    renderCollectionProducts(filtered);
  }

  function renderCollectionProducts(list) {
    const grid = findProductGrid();
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          Todavía no hay plantillas disponibles en esta colección.
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(p => `
      <article class="product-card"
               data-id="${escapeHtml(String(p.id))}">
        <div class="img-wrap">
          <img
            src="${escapeHtml(
              p.image ||
              p.image_url ||
              p.design_image_url ||
              "assets/logo.png"
            )}"
            alt="${escapeHtml(p.name || "Diseño ID Creation SC")}">
        </div>

        <div class="product-body">
          <span class="cat">
            ${escapeHtml(p.category || "ID Creation SC")}
          </span>

          <h3>${escapeHtml(p.name || "Diseño")}</h3>

          <div class="price-row">
            <span class="price-label">Desde</span>
            <span class="price">
              $${Number(p.price || 0).toFixed(2)}
            </span>
          </div>

          <button type="button"
                  class="idc-open-design"
                  data-id="${escapeHtml(String(p.id))}">
            Ver diseño
          </button>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll(".idc-open-design").forEach(btn => {
      btn.addEventListener("click", () => {
        openDesign(btn.dataset.id);
      });
    });
  }

  /* ==============================
     ABRIR DISEÑO
  ============================== */

  async function openDesign(productId) {
    const allProducts = Array.isArray(window.products)
      ? window.products
      : [];

    const product = allProducts.find(
      p => String(p.id) === String(productId)
    );

    if (!product) return;

    try {
      idcMockups = await sbGet(
        "product_mockups?select=*&product_id=eq." +
        encodeURIComponent(productId) +
        "&active=eq.true&order=sort_order.asc"
      );
    } catch (e) {
      console.error("ID Creation SC - Mockups:", e);
      idcMockups = [];
    }

    showMockupModal(product);
  }

  /* ==============================
     MODAL DE MOCKUP
  ============================== */

  function showMockupModal(product) {
    let modal = document.querySelector("#idcMockupModal");

    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "idcMockupModal";
    modal.className = "modal";

    const firstMockup = idcMockups[0] || null;

    const shirtImage =
      firstMockup?.mockup_image_url ||
      product.image ||
      product.image_url ||
      "assets/logo.png";

    const designImage =
      product.design_image_url || "";

    modal.innerHTML = `
      <div class="modal-card product-modal">

        <button class="close"
                id="idcCloseMockup"
                type="button">×</button>

        <div>
          <div class="idc-mockup-stage">
            <img
              id="idcShirtLayer"
              class="idc-shirt-layer"
              src="${escapeHtml(shirtImage)}"
              alt="Mockup">

            ${
              designImage
                ? `<img
                    id="idcDesignLayer"
                    class="idc-design-layer"
                    src="${escapeHtml(designImage)}"
                    alt="${escapeHtml(product.name || "Diseño")}">`
                : ""
            }
          </div>
        </div>

        <div class="product-modal-info">

          <span class="eyebrow">
            ID CREATION SC
          </span>

          <h2>
            ${escapeHtml(product.name || "Diseño")}
          </h2>

          <p class="muted">
            ${escapeHtml(
              product.description ||
              "Selecciona el color para visualizar tu diseño."
            )}
          </p>

          <div class="detail-price">
            $${Number(product.price || 0).toFixed(2)}
          </div>

          ${renderColorOptions()}

          ${renderSizes(product)}

          <label>Cantidad</label>

          <input
            id="idcMockupQty"
            type="number"
            value="1"
            min="1">

          <br><br>

          <button
            id="idcContinueProduct"
            class="gold-btn full"
            type="button">
            Continuar con este diseño
          </button>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    applyDesignPosition(product);
    connectMockupEvents(product);
  }

  function renderColorOptions() {
    if (!idcMockups.length) {
      return `
        <div class="idc-color-section">
          <strong>Color</strong>
          <p class="muted">
            Consulta los colores disponibles.
          </p>
        </div>
      `;
    }

    return `
      <div class="idc-color-section">
        <strong>Selecciona el color</strong>

        <div class="idc-color-options">
          ${idcMockups.map((m, i) => `
            <button
              type="button"
              class="idc-color-option ${i === 0 ? "selected" : ""}"
              data-mockup="${escapeHtml(m.mockup_image_url)}"
              data-color="${escapeHtml(m.color_name)}">
              ${escapeHtml(m.color_name)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderSizes(product) {
    const sizes =
      Array.isArray(product.sizes)
        ? product.sizes
        : typeof product.sizes === "string"
          ? product.sizes.split(",").map(x => x.trim()).filter(Boolean)
          : [];

    if (!sizes.length) return "";

    return `
      <label>Talla</label>

      <select id="idcMockupSize">
        ${sizes.map(size =>
          `<option value="${escapeHtml(size)}">
             ${escapeHtml(size)}
           </option>`
        ).join("")}
      </select>
    `;
  }

  function connectMockupEvents(product) {
    const modal = document.querySelector("#idcMockupModal");

    document.querySelector("#idcCloseMockup")
      ?.addEventListener("click", () => modal?.remove());

    modal?.addEventListener("click", e => {
      if (e.target === modal) modal.remove();
    });

    document.querySelectorAll(".idc-color-option")
      .forEach(button => {
        button.addEventListener("click", () => {

          document.querySelectorAll(".idc-color-option")
            .forEach(b => b.classList.remove("selected"));

          button.classList.add("selected");

          const shirt =
            document.querySelector("#idcShirtLayer");

          if (shirt) {
            shirt.src = button.dataset.mockup;
          }
        });
      });

    document.querySelector("#idcContinueProduct")
      ?.addEventListener("click", () => {
        continueToOriginalProduct(product);
      });
  }

  function applyDesignPosition(product) {
    const design = document.querySelector("#idcDesignLayer");
    if (!design) return;

    const scale = Number(product.mockup_scale || 1);
    const x = Number(product.mockup_offset_x || 0);
    const y = Number(product.mockup_offset_y || 0);

    design.style.width = (34 * scale) + "%";

    design.style.transform =
      `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  /* ==============================
     CONTINUAR AL SISTEMA ORIGINAL
  ============================== */

  function continueToOriginalProduct(product) {
    const selectedColor =
      document.querySelector(".idc-color-option.selected")
        ?.dataset.color || "";

    const selectedSize =
      document.querySelector("#idcMockupSize")
        ?.value || "";

    const quantity =
      Number(
        document.querySelector("#idcMockupQty")?.value || 1
      );

    window.idcSelectedMockup = {
      productId: product.id,
      color: selectedColor,
      size: selectedSize,
      quantity: quantity
    };

    document.querySelector("#idcMockupModal")?.remove();

    /*
      Intentamos utilizar el modal original de la tienda
      para conservar carrito, checkout, WhatsApp y pagos.
    */

    if (typeof window.openProduct === "function") {
      window.openProduct(product.id);
      return;
    }

    if (typeof window.openProductModal === "function") {
      window.openProductModal(product.id);
      return;
    }

    const originalCard =
      document.querySelector(
        `.product-card[data-id="${CSS.escape(String(product.id))}"]`
      );

    const originalButton =
      originalCard?.querySelector(
        "button:not(.idc-open-design)"
      );

    if (originalButton) {
      originalButton.click();
      return;
    }

    alert(
      "Diseño seleccionado: " +
      (product.name || "") +
      (selectedColor ? "\nColor: " + selectedColor : "") +
      (selectedSize ? "\nTalla: " + selectedSize : "")
    );
  }

  /* ==============================
     UTILIDAD
  ============================== */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ==============================
     INICIAR
  ============================== */

 function start() {
  createCollectionsArea();
  connectCatalogLinks();
  loadCollections();

  if (
    window.location.hash === "#catalogo" ||
    window.location.hash === "#catalog"
  ) {
    setTimeout(showCollections, 300);
  }

  const observer = new MutationObserver(() => {
