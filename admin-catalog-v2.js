/* ID CREATION SC — ADMIN COLECCIONES V2 */

(function () {
  "use strict";

  const SB_URL = "https://vjcfhlxwkmwogbifnxlf.supabase.co";
  const SB_KEY = "sb_publishable_2_bbdS-0Zp6CJeJD1dCajQ_Sgptga9H";

  let collections = [];

  function token() {
    return (
      sessionStorage.getItem("idc_sb_access_token") ||
      sessionStorage.getItem("idc_supabase_access_token") ||
      ""
    );
  }

  function headers(prefer = "") {
    const h = {
      apikey: SB_KEY,
      "Content-Type": "application/json"
    };

    if (token()) h.Authorization = "Bearer " + token();
    if (prefer) h.Prefer = prefer;

    return h;
  }

  async function request(path, options = {}) {
    const res = await fetch(SB_URL + "/rest/v1/" + path, {
      ...options,
      headers: {
        ...headers(options.prefer || ""),
        ...(options.headers || {})
      }
    });

    const text = await res.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      throw new Error(
        data?.message ||
        data?.error_description ||
        text ||
        "Error " + res.status
      );
    }

    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function waitForAdmin() {
    const admin = document.querySelector("#adminModal");

    if (!admin) {
      setTimeout(waitForAdmin, 300);
      return;
    }

    installAdminButton();

    const observer = new MutationObserver(() => {
      installAdminButton();
    });

    observer.observe(admin, {
      childList: true,
      subtree: true
    });
  }

  function installAdminButton() {
    const admin = document.querySelector("#adminModal");
    if (!admin || document.querySelector("#idcCollectionsAdminBtn")) return;

    const adminCard =
      admin.querySelector(".admin-card") ||
      admin.querySelector(".modal-card");

    if (!adminCard) return;

    const btn = document.createElement("button");
    btn.id = "idcCollectionsAdminBtn";
    btn.type = "button";
    btn.className = "outline-btn";
    btn.textContent = "Colecciones";

    btn.style.margin = "10px 8px 10px 0";

    btn.addEventListener("click", openCollectionsAdmin);

    const ordersButton =
      Array.from(adminCard.querySelectorAll("button"))
        .find(b => /pedido/i.test(b.textContent || ""));

    if (ordersButton && ordersButton.parentElement) {
      ordersButton.parentElement.insertBefore(
        btn,
        ordersButton.nextSibling
      );
    } else {
      adminCard.insertBefore(btn, adminCard.children[1] || null);
    }
  }

  async function openCollectionsAdmin() {
    if (!token()) {
      alert("Primero inicia sesión como administrador.");
      return;
    }

    createPanel();

    try {
      await loadCollections();
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las colecciones: " + error.message);
    }
  }

  function createPanel() {
    document.querySelector("#idcCollectionsAdminModal")?.remove();

    const modal = document.createElement("div");
    modal.id = "idcCollectionsAdminModal";
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-card admin-card"
           style="max-width:1100px;width:94%;max-height:90vh;overflow:auto;">

        <button type="button"
                class="close"
                id="idcCloseCollectionsAdmin">×</button>

        <span class="eyebrow">ID CREATION SC</span>
        <h2>Administrar colecciones</h2>

        <p class="muted">
          Crea las secciones que aparecerán cuando el cliente pulse Catálogo.
        </p>

        <div style="
          display:grid;
          grid-template-columns:minmax(280px,380px) 1fr;
          gap:24px;
          margin-top:20px;
        ">

          <form id="idcCollectionForm">

            <input type="hidden" id="idcCollectionId">

            <label>Nombre de la colección</label>
            <input id="idcCollectionName"
                   required
                   placeholder="Ej: Halloween T-Shirts">

            <label>Descripción</label>
            <textarea id="idcCollectionDescription"
                      rows="4"
                      placeholder="Describe esta colección"></textarea>

            <label>URL de imagen de portada</label>
            <input id="idcCollectionCover"
                   placeholder="https://...">

            <label>Orden</label>
            <input id="idcCollectionOrder"
                   type="number"
                   value="0"
                   min="0">

            <label style="
              display:flex;
              align-items:center;
              gap:8px;
              margin:14px 0;
            ">
              <input id="idcCollectionActive"
                     type="checkbox"
                     checked>
              Colección activa
            </label>

            <button class="gold-btn full"
                    type="submit"
                    id="idcSaveCollection">
              Guardar colección
            </button>

            <button class="outline-btn full"
                    type="button"
                    id="idcCancelCollectionEdit"
                    style="margin-top:8px;display:none;">
              Cancelar edición
            </button>

          </form>

          <div>
            <h3>Colecciones creadas</h3>

            <div id="idcAdminCollectionsList">
              Cargando...
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.querySelector("#idcCloseCollectionsAdmin")
      ?.addEventListener("click", () => modal.remove());

    modal.addEventListener("click", e => {
      if (e.target === modal) modal.remove();
    });

    document.querySelector("#idcCollectionForm")
      ?.addEventListener("submit", saveCollection);

    document.querySelector("#idcCancelCollectionEdit")
      ?.addEventListener("click", resetForm);
  }

  async function loadCollections() {
    collections = await request(
      "collections?select=*&order=sort_order.asc,name.asc",
      { method: "GET" }
    );

    renderCollections();
  }

  function renderCollections() {
    const list = document.querySelector("#idcAdminCollectionsList");
    if (!list) return;

    if (!collections.length) {
      list.innerHTML = `
        <div class="empty">
          Todavía no tienes colecciones.
          Crea la primera usando el formulario.
        </div>
      `;
      return;
    }

    list.innerHTML = collections.map(c => `
      <div style="
        border:1px solid rgba(255,255,255,.15);
        border-radius:14px;
        padding:14px;
        margin-bottom:12px;
        display:grid;
        grid-template-columns:80px 1fr;
        gap:14px;
        align-items:center;
      ">

        <img
          src="${escapeHtml(c.cover_image_url || "assets/logo.png")}"
          alt=""
          style="
            width:80px;
            height:80px;
            object-fit:cover;
            border-radius:10px;
          ">

        <div>
          <strong>${escapeHtml(c.name)}</strong>

          <div class="muted" style="margin:5px 0;">
            ${escapeHtml(c.description || "Sin descripción")}
          </div>

          <small>
            ${c.active ? "ACTIVA" : "INACTIVA"}
          </small>

          <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:10px;
          ">
            <button type="button"
                    class="outline-btn idc-edit-collection"
                    data-id="${c.id}">
              Editar
            </button>

            <button type="button"
                    class="outline-btn idc-delete-collection"
                    data-id="${c.id}">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".idc-edit-collection")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          editCollection(btn.dataset.id);
        });
      });

    list.querySelectorAll(".idc-delete-collection")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          deleteCollection(btn.dataset.id);
        });
      });
  }

  async function saveCollection(event) {
    event.preventDefault();

    const id =
      document.querySelector("#idcCollectionId").value;

    const name =
      document.querySelector("#idcCollectionName").value.trim();

    if (!name) {
      alert("Escribe el nombre de la colección.");
      return;
    }

    const payload = {
      name,
      description:
        document.querySelector("#idcCollectionDescription").value.trim(),
      cover_image_url:
        document.querySelector("#idcCollectionCover").value.trim() || null,
      sort_order:
        Number(document.querySelector("#idcCollectionOrder").value || 0),
      active:
        document.querySelector("#idcCollectionActive").checked
    };

    const button =
      document.querySelector("#idcSaveCollection");

    button.disabled = true;
    button.textContent = "Guardando...";

    try {
      if (id) {
        await request(
          "collections?id=eq." + encodeURIComponent(id),
          {
            method: "PATCH",
            prefer: "return=minimal",
            body: JSON.stringify(payload)
          }
        );
      } else {
        await request(
          "collections",
          {
            method: "POST",
            prefer: "return=minimal",
            body: JSON.stringify(payload)
          }
        );
      }

      resetForm();
      await loadCollections();

      alert(
        id
          ? "Colección actualizada correctamente."
          : "Colección creada correctamente."
      );

    } catch (error) {
      console.error(error);
      alert("No se pudo guardar: " + error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Guardar colección";
    }
  }

  function editCollection(id) {
    const c = collections.find(
      item => String(item.id) === String(id)
    );

    if (!c) return;

    document.querySelector("#idcCollectionId").value = c.id;
    document.querySelector("#idcCollectionName").value = c.name || "";
    document.querySelector("#idcCollectionDescription").value =
      c.description || "";
    document.querySelector("#idcCollectionCover").value =
      c.cover_image_url || "";
    document.querySelector("#idcCollectionOrder").value =
      Number(c.sort_order || 0);
    document.querySelector("#idcCollectionActive").checked =
      c.active !== false;

    document.querySelector("#idcSaveCollection").textContent =
      "Actualizar colección";

    document.querySelector("#idcCancelCollectionEdit").style.display =
      "block";

    document.querySelector("#idcCollectionName")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
  }

  function resetForm() {
    const form = document.querySelector("#idcCollectionForm");
    if (!form) return;

    form.reset();

    document.querySelector("#idcCollectionId").value = "";
    document.querySelector("#idcCollectionOrder").value = "0";
    document.querySelector("#idcCollectionActive").checked = true;
    document.querySelector("#idcSaveCollection").textContent =
      "Guardar colección";
    document.querySelector("#idcCancelCollectionEdit").style.display =
      "none";
  }

  async function deleteCollection(id) {
    const c = collections.find(
      item => String(item.id) === String(id)
    );

    if (!c) return;

    const ok = confirm(
      '¿Eliminar la colección "' + c.name + '"?\n\n' +
      "Hazlo solamente si ya no la necesitas."
    );

    if (!ok) return;

    try {
      await request(
        "collections?id=eq." + encodeURIComponent(id),
        {
          method: "DELETE",
          prefer: "return=minimal"
        }
      );

      await loadCollections();

    } catch (error) {
      console.error(error);

      alert(
        "No se pudo eliminar la colección. " +
        "Si tiene productos asociados, primero muévelos a otra colección.\n\n" +
        error.message
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForAdmin);
  } else {
    waitForAdmin();
  }

})();
