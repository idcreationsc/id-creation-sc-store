
const WHATSAPP = "15703712174";
const ADMIN_PASSWORD = "ID-2026-DEMO";
const ZELLE = "570-371-2174";
const CASHAPP = "$ibsengmercado";
// PayPal se configurará con el enlace oficial de tu cuenta antes de publicar.
const PAYPAL_USERNAME = "@IbsenGM";
const PAYPAL_LINK = "https://www.paypal.com/ncp/payment/WDUJ3JMB4DJHC";

const CATEGORY_ICONS = {
  "T-Shirts":"👕",
  "Hoodies":"🧥",
  "Tumblers":"🥤",
  "Gorras":"🧢",
  "Llaveros":"🔑",
  "Accesorios":"✨",
  "Packs":"🎁"
};

const seedProducts = [
  {id:"t1",name:"T-Shirt ID Black",category:"T-Shirts",price:25,image:"assets/logo.png",description:"T-shirt personalizada con diseño ID.",variants:["S","M","L","XL","2XL","3XL"],colors:["Negro","Blanco","Azul"]},
  {id:"t2",name:"T-Shirt Panther White",category:"T-Shirts",price:25,image:"assets/logo.png",description:"T-shirt personalizada estilo pantera.",variants:["S","M","L","XL","2XL","3XL"],colors:["Blanco","Negro"]},
  {id:"t3",name:"T-Shirt Crown Blue",category:"T-Shirts",price:25,image:"assets/logo.png",description:"T-shirt personalizada con detalles azul y dorado.",variants:["S","M","L","XL","2XL","3XL"],colors:["Negro","Azul"]},
  {id:"t4",name:"T-Shirt Urban",category:"T-Shirts",price:25,image:"assets/logo.png",description:"T-shirt estilo urbano personalizada.",variants:["S","M","L","XL","2XL","3XL"],colors:["Negro","Blanco"]},

  {id:"h1",name:"Hoodie ID Premium",category:"Hoodies",price:45,image:"assets/logo.png",description:"Hoodie premium personalizado.",variants:["S","M","L","XL","2XL","3XL"],colors:["Negro","Gris","Blanco"]},
  {id:"h2",name:"Hoodie Panther",category:"Hoodies",price:50,image:"assets/logo.png",description:"Hoodie personalizado con diseño de pantera.",variants:["S","M","L","XL","2XL","3XL"],colors:["Negro","Azul oscuro"]},

  {id:"tb1",name:"Tumbler 20 oz",category:"Tumblers",price:30,image:"assets/logo.png",description:"Tumbler de 20 oz personalizado.",variants:["20 oz"],colors:["Negro","Blanco","Acero"]},
  {id:"tb2",name:"Tumbler 30 oz",category:"Tumblers",price:35,image:"assets/logo.png",description:"Tumbler de 30 oz personalizado.",variants:["30 oz"],colors:["Negro","Blanco","Acero"]},
  {id:"tb3",name:"Tumbler 40 oz",category:"Tumblers",price:40,image:"assets/logo.png",description:"Tumbler de 40 oz personalizado.",variants:["40 oz"],colors:["Negro","Blanco","Acero"]},

  {id:"g1",name:"Gorra Snapback",category:"Gorras",price:28,image:"assets/logo.png",description:"Gorra snapback personalizada.",variants:["Ajustable"],colors:["Negro","Blanco","Azul"]},
  {id:"g2",name:"Gorra Trucker",category:"Gorras",price:30,image:"assets/logo.png",description:"Gorra trucker personalizada.",variants:["Ajustable"],colors:["Negro","Blanco"]},

  {id:"l1",name:"Llavero ID",category:"Llaveros",price:10,image:"assets/logo.png",description:"Llavero personalizado.",variants:["Estándar"],colors:["Negro","Dorado","Azul"]},
  {id:"l2",name:"Llavero Foto",category:"Llaveros",price:12,image:"assets/logo.png",description:"Llavero personalizado con foto o diseño.",variants:["Estándar"],colors:["Full color"]},

  {id:"a1",name:"Sticker Personalizado",category:"Accesorios",price:5,image:"assets/logo.png",description:"Sticker personalizado.",variants:["2 in","3 in","4 in"],colors:["Full color"]},
  {id:"a2",name:"Phone Case Personalizado",category:"Accesorios",price:20,image:"assets/logo.png",description:"Case personalizado.",variants:["Consultar modelo"],colors:["Negro","Transparente"]},

  {id:"p1",name:"Pack Básico",category:"Packs",price:60,image:"assets/logo.png",description:"Pack combinado de artículos personalizados.",variants:["Básico"],colors:["A coordinar"]},
  {id:"p2",name:"Pack Premium",category:"Packs",price:85,image:"assets/logo.png",description:"Pack premium de artículos personalizados.",variants:["Premium"],colors:["A coordinar"]}
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => `$${Number(n).toFixed(2)}`;

let products = JSON.parse(localStorage.getItem("idc_new_products") || "null") || seedProducts;
let cart = JSON.parse(localStorage.getItem("idc_new_cart") || "[]");
let activeCategory = "all";
let selectedProduct = null;
let editingId = null;
let pendingImageData = "";
let orders = JSON.parse(localStorage.getItem("idc_orders") || "[]");

function saveProducts(){localStorage.setItem("idc_new_products",JSON.stringify(products));}
function saveCart(){localStorage.setItem("idc_new_cart",JSON.stringify(cart));updateCartCount();}
function categories(){return [...new Set(products.map(p=>p.category).filter(Boolean))];}

function renderCategories(){
  const cats = categories();
  $("#categoryGrid").innerHTML = cats.map(c=>`
    <button class="category-card ${activeCategory===c?'active':''}" data-category="${esc(c)}">
      <span class="icon">${CATEGORY_ICONS[c]||"✦"}</span>
      <strong>${esc(c)}</strong>
      <small>Ver productos →</small>
    </button>`).join("");

  $("#sideCategories").innerHTML = cats.map(c=>`
    <button class="side-category ${activeCategory===c?'selected':''}" data-category-filter="${esc(c)}">${esc(c)}</button>
  `).join("");

  const allBtn = document.querySelector('[data-category-filter="all"]');
  if(allBtn) allBtn.classList.toggle("selected",activeCategory==="all");
}

function getVisibleProducts(){
  const q = $("#searchInput").value.trim().toLowerCase();
  let list = products.filter(p =>
    (activeCategory==="all" || p.category===activeCategory) &&
    (!q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q))
  );

  const sort = $("#sortSelect").value;
  if(sort==="price-asc") list.sort((a,b)=>a.price-b.price);
  if(sort==="price-desc") list.sort((a,b)=>b.price-a.price);
  if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
  return list;
}

function renderProducts(){
  const list = getVisibleProducts();
  $("#catalogTitle").textContent = activeCategory==="all" ? "Todos los productos" : activeCategory;

  $("#productGrid").innerHTML = list.map(p=>`
    <article class="product-card">
      <div class="img-wrap">
        <img src="${attr(p.image)}" alt="${attr(p.name)}">
      </div>
      <div class="product-body">
        <div class="cat">${esc(p.category)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="price-row">
          <span class="price-label">Precio</span>
          <strong class="price">${money(p.price)}</strong>
        </div>
        <button data-view="${p.id}">Ver opciones</button>
      </div>
    </article>
  `).join("");

  $("#emptyState").classList.toggle("hidden",list.length>0);
  renderCategories();
}

function chooseCategory(category,scroll=true){
  activeCategory = category;
  renderProducts();
  if(scroll) document.getElementById("catalogo").scrollIntoView({behavior:"smooth",block:"start"});
}

function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p) return;
  selectedProduct=p;
  $("#detailImage").src=p.image;
  $("#detailCategory").textContent=p.category;
  $("#detailName").textContent=p.name;
  $("#detailDescription").textContent=p.description;
  $("#detailPrice").textContent=money(p.price);
  $("#detailVariant").innerHTML=(p.variants||[]).map(x=>`<option>${esc(x)}</option>`).join("");
  $("#detailColor").innerHTML=(p.colors||[]).map(x=>`<option>${esc(x)}</option>`).join("");
  $("#detailQty").value=1;
  show("productModal");
}

function addToCart(){
  if(!selectedProduct) return;
  const qty=Math.max(1,Number($("#detailQty").value)||1);
  cart.push({
    lineId:Date.now().toString(36)+Math.random().toString(36).slice(2),
    id:selectedProduct.id,
    name:selectedProduct.name,
    price:Number(selectedProduct.price),
    variant:$("#detailVariant").value,
    color:$("#detailColor").value,
    qty
  });
  saveCart(); hide("productModal"); renderCart(); show("cartDrawer");
}

function renderCart(){
  $("#cartItems").innerHTML = cart.length ? cart.map(i=>`
    <div class="cart-item">
      <div>
        <strong>${esc(i.name)}</strong>
        <small>${esc(i.variant)} • ${esc(i.color)} • Cantidad: ${i.qty}</small>
        <small>${money(i.price*i.qty)}</small>
      </div>
      <button data-remove="${i.lineId}">Eliminar</button>
    </div>`).join("") : "<p>Tu carrito está vacío.</p>";
  $("#cartTotal").textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));
}

function updateCartCount(){
  $("#cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);
}


function orderNumber(){
  const d=new Date();
  const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `IDC-${stamp}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function saveOrders(){localStorage.setItem("idc_orders",JSON.stringify(orders));}
function updatePaymentInstructions(){
  const method=$("#paymentMethod").value;
  let text="";
  if(method==="Zelle") text=`Envía el pago por Zelle a: ${ZELLE}. Tu pedido quedará como PAGO PENDIENTE hasta que ID Creation SC confirme la recepción.`;
  if(method==="Cash App") text=`Envía el pago por Cash App a: ${CASHAPP}. Tu pedido quedará como PAGO PENDIENTE hasta que ID Creation SC confirme la recepción.`;
  if(method==="PayPal") text=`PayPal: ${PAYPAL_USERNAME}. Pulsa el botón de PayPal para abrir el enlace de pago. Verifica que el perfil mostrado sea el correcto antes de pagar. El pedido quedará como PAGO PENDIENTE hasta que ID Creation SC confirme la recepción.`;
  $("#paymentInstructions").textContent=text;
}
function renderAdminOrders(){
  $("#adminOrderCount").textContent=orders.length?`(${orders.length})`:"";
  $("#adminOrderList").innerHTML=orders.length?orders.slice().reverse().map(o=>`
    <div class="order-card">
      <div class="order-top">
        <div><strong>${esc(o.orderNo)}</strong><small>${esc(o.createdAt)}</small></div>
        <span class="payment-badge ${o.paymentStatus==="Pagado"?"paid":"pending"}">${esc(o.paymentStatus)}</span>
      </div>
      <div><b>${esc(o.customer)}</b> · ${esc(o.phone)}</div>
      <div class="order-lines">${o.items.map(i=>`${esc(i.name)} — ${esc(i.variant)} — ${esc(i.color)} × ${i.qty}`).join("<br>")}</div>
      <div><b>Total: ${money(o.total)}</b> · ${esc(o.paymentMethod)} · ${esc(o.delivery)}</div>
      <div class="order-controls">
        <label>Pago
          <select data-payment-status="${o.orderNo}">
            <option ${o.paymentStatus==="Pendiente"?"selected":""}>Pendiente</option>
            <option ${o.paymentStatus==="Pagado"?"selected":""}>Pagado</option>
          </select>
        </label>
        <label>Pedido
          <select data-order-status="${o.orderNo}">
            ${["Nuevo","En proceso","Listo para recoger","Enviado","Entregado","Cancelado"].map(s=>`<option ${o.orderStatus===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </label>
        <button class="delete" data-delete-order="${o.orderNo}">Eliminar</button>
      </div>
    </div>`).join(""):"<p>No hay pedidos guardados todavía.</p>";
}

function buildOrder(){
  const name=$("#customerName").value.trim();
  const phone=$("#customerPhone").value.trim();
  if(!name||!phone) return {error:"Escribe tu nombre y teléfono."};
  if(!cart.length) return {error:"Tu carrito está vacío."};

  const delivery=$("#deliveryMethod").value;
  let address="";
  if(delivery==="shipping"){
    const a=$("#address").value.trim(),c=$("#city").value.trim(),s=$("#state").value.trim(),z=$("#zip").value.trim();
    if(!a||!c||!s||!z) return {error:"Para envío completa dirección, ciudad, estado y ZIP Code."};
    address=`${a}, ${c}, ${s} ${z}`;
  }

  const no=orderNumber();
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const method=$("#paymentMethod").value;
  const order={
    orderNo:no,
    createdAt:new Date().toLocaleString("es-US"),
    customer:name, phone,
    email:$("#customerEmail").value.trim()||"No indicado",
    delivery:delivery==="shipping"?"Envío":"Pasa a recoger",
    address:address||"No aplica",
    paymentMethod:method,
    paymentStatus:"Pendiente",
    orderStatus:"Nuevo",
    notes:$("#orderNotes").value.trim()||"Ninguna",
    items:cart.map(i=>({...i})),
    total
  };
  const lines=order.items.map((i,n)=>`${n+1}. ${i.name} | ${i.variant} | ${i.color} | Cant: ${i.qty} | ${money(i.price*i.qty)}`).join("\n");
  const paymentLine=method==="Zelle"
    ? `Zelle: ${ZELLE}`
    : method==="Cash App"
      ? `Cash App: ${CASHAPP}`
      : `PayPal: ${PAYPAL_USERNAME} | ${PAYPAL_LINK}`;
  const text=`NUEVO PEDIDO - ID CREATION SC
ORDEN: ${no}
ESTADO DE PAGO: PENDIENTE

Cliente: ${name}
Teléfono: ${phone}
Entrega: ${order.delivery}
${delivery==="shipping"?`Dirección: ${address}`:""}
Método de pago: ${method}
${paymentLine}

ARTÍCULOS:
${lines}

TOTAL: ${money(total)}
Notas: ${order.notes}

IMPORTANTE: El pedido queda como PAGO PENDIENTE hasta que ID Creation SC confirme que recibió el dinero.`;
  return {order,text};
}

function sendOrder(){
  const r=buildOrder();
  $("#checkoutMessage").textContent=r.error||"Pedido creado. Abriendo WhatsApp...";
  if(r.error)return;
  orders.push(r.order);
  saveOrders();
  renderAdminOrders();
  cart=[];
  saveCart();
  renderCart();
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(r.text)}`,"_blank");
  if(r.order.paymentMethod==="PayPal"){
    setTimeout(()=>window.open(PAYPAL_LINK, "_blank"),350);
  }
}

function sendFeedback(){
  const msg=$("#feedbackText").value.trim();
  if(!msg){$("#feedbackMessage").textContent="Escribe tu mensaje.";return;}
  const text=`MENSAJE PRIVADO - ID CREATION SC
Tipo: ${$("#feedbackType").value}
Nombre: ${$("#feedbackName").value.trim()||"Anónimo"}
Mensaje: ${msg}`;
  $("#feedbackMessage").textContent="Abriendo WhatsApp...";
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,"_blank");
}

function renderAdmin(){
  $("#adminProductList").innerHTML=products.map(p=>`
    <div class="admin-row">
      <div><strong>${esc(p.name)}</strong><small>${esc(p.category)}</small></div>
      <div>${money(p.price)}</div>
      <div>${(p.variants||[]).length} opciones</div>
      <div>
        <button data-edit="${p.id}">Editar</button>
        <button class="delete" data-delete="${p.id}">Eliminar</button>
      </div>
    </div>`).join("");
}

function openEditor(id=null, presetCategory=""){
  editingId=id;
  pendingImageData="";
  const p=id?products.find(x=>x.id===id):null;
  $("#editTitle").textContent=p?"Editar producto":"Nuevo producto";
  $("#editName").value=p?.name||"";
  {
    const value=p?.category||presetCategory||"";
    const select=$("#editCategory");
    if(value && ![...select.options].some(o=>o.value===value)){
      const opt=document.createElement("option");
      opt.value=value; opt.textContent=value;
      select.appendChild(opt);
    }
    select.value=value;
  }
  $("#editPrice").value=p?.price||"";
  $("#editImage").value=p?.image||"assets/logo.png";
  $("#editVariants").value=(p?.variants||[]).join(", ");
  $("#editColors").value=(p?.colors||[]).join(", ");
  $("#editDescription").value=p?.description||"";
  $("#editImageFile").value="";
  const previewSrc=p?.image||"";
  $("#editImagePreviewWrap").classList.toggle("hidden",!previewSrc);
  if(previewSrc) $("#editImagePreview").src=previewSrc;
  show("editProductModal");
}

function saveEditedProduct(){
  const name=$("#editName").value.trim();
  const category=$("#editCategory").value.trim();
  const price=Number($("#editPrice").value);
  if(!name||!category||!price) return;

  const data={
    id:editingId||("p"+Date.now()),name,category,price,
    image:pendingImageData || $("#editImage").value.trim() || "assets/logo.png",
    variants:$("#editVariants").value.split(",").map(x=>x.trim()).filter(Boolean),
    colors:$("#editColors").value.split(",").map(x=>x.trim()).filter(Boolean),
    description:$("#editDescription").value.trim()
  };

  products=editingId?products.map(p=>p.id===editingId?data:p):[...products,data];
  saveProducts(); renderProducts(); renderAdmin(); hide("editProductModal");
}

function deleteProduct(id){
  if(!confirm("¿Eliminar este producto?")) return;
  products=products.filter(p=>p.id!==id); saveProducts(); renderProducts(); renderAdmin();
}

function show(id){document.getElementById(id).classList.remove("hidden");}
function hide(id){document.getElementById(id).classList.add("hidden");}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function attr(s=""){return esc(s);}

document.addEventListener("click",e=>{
  const cat=e.target.closest("[data-category]");
  if(cat){chooseCategory(cat.dataset.category);return;}

  const side=e.target.closest("[data-category-filter]");
  if(side){chooseCategory(side.dataset.categoryFilter);return;}

  const view=e.target.closest("[data-view]");
  if(view){openProduct(view.dataset.view);return;}

  const rem=e.target.closest("[data-remove]");
  if(rem){cart=cart.filter(x=>x.lineId!==rem.dataset.remove);saveCart();renderCart();return;}

  const close=e.target.closest("[data-close]");
  if(close){hide(close.dataset.close);return;}

  const edit=e.target.closest("[data-edit]");
  if(edit){openEditor(edit.dataset.edit);return;}

  const del=e.target.closest("[data-delete]");
  if(del){deleteProduct(del.dataset.delete);return;}

  const delOrder=e.target.closest("[data-delete-order]");
  if(delOrder){
    if(confirm("¿Eliminar este pedido?")){
      orders=orders.filter(o=>o.orderNo!==delOrder.dataset.deleteOrder);
      saveOrders(); renderAdminOrders();
    }
    return;
  }
});

$("#addToCartBtn").addEventListener("click",addToCart);
$("#cartBtn").addEventListener("click",()=>{renderCart();show("cartDrawer")});
$("#checkoutBtn").addEventListener("click",()=>{if(!cart.length)return;hide("cartDrawer");show("checkoutModal")});
$("#deliveryMethod").addEventListener("change",()=>$("#shippingFields").classList.toggle("hidden",$("#deliveryMethod").value!=="shipping"));
$("#sendOrderBtn").addEventListener("click",sendOrder);
$("#feedbackBtn").addEventListener("click",()=>show("feedbackModal"));
$("#customOrderBtn").addEventListener("click",()=>show("customModal"));
$("#sendCustomBtn").addEventListener("click",()=>{
  const product=$("#customProduct").value;
  const size=$("#customSize").value.trim() || "Por definir";
  const color=$("#customColor").value.trim() || "Por definir";
  const qty=Math.max(1,Number($("#customQty").value)||1);
  const details=$("#customDetails").value.trim() || "Sin detalles adicionales";
  const text=`HOLA ID CREATION SC 👋

QUIERO PERSONALIZAR UN ARTÍCULO

Artículo: ${product}
Tamaño / opción: ${size}
Color: ${color}
Cantidad: ${qty}
Detalles: ${details}

Ahora voy a adjuntar la imagen o archivo del diseño que deseo.`;
  $("#customMessage").textContent="Abriendo WhatsApp. Recuerda adjuntar tu diseño antes de enviar el mensaje.";
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,"_blank");
});
$("#searchBtn").addEventListener("click",()=>{document.getElementById("catalogo").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("#searchInput").focus(),300)});
$("#searchInput").addEventListener("input",renderProducts);
$("#sortSelect").addEventListener("change",renderProducts);

$("#adminBtn").addEventListener("click",()=>{
  $("#adminLogin").classList.remove("hidden");
  $("#adminPanel").classList.add("hidden");
  $("#adminPassword").value="";
  $("#adminLoginMessage").textContent="";
  show("adminModal");
});
$("#adminLoginBtn").addEventListener("click",()=>{
  if($("#adminPassword").value===ADMIN_PASSWORD){
    $("#adminLogin").classList.add("hidden");
    $("#adminPanel").classList.remove("hidden");
    renderAdmin();
  }else{
    $("#adminLoginMessage").textContent="Clave incorrecta.";
  }
});
$("#addProductAdmin").addEventListener("click",()=>openEditor());
$("#addDesignAdmin").addEventListener("click",()=>{
  openEditor();
  $("#editTitle").textContent="Agregar nuevo diseño";
});
$("#editImageFile").addEventListener("change",e=>{
  const file=e.target.files && e.target.files[0];
  if(!file) return;
  if(file.size > 2.5*1024*1024){
    alert("La imagen es muy grande para esta prueba local. Usa una imagen menor de 2.5 MB.");
    e.target.value="";
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    pendingImageData=reader.result;
    $("#editImagePreview").src=pendingImageData;
    $("#editImagePreviewWrap").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});
$("#saveProductBtn").addEventListener("click",saveEditedProduct);

renderProducts();
updateCartCount();


$("#paymentMethod").addEventListener("change",updatePaymentInstructions);
$("#showProductsTab").addEventListener("click",()=>{
  $("#adminProductsSection").classList.remove("hidden");
  $("#adminOrdersSection").classList.add("hidden");
  $("#showProductsTab").classList.add("active");
  $("#showOrdersTab").classList.remove("active");
});
$("#showOrdersTab").addEventListener("click",()=>{
  $("#adminProductsSection").classList.add("hidden");
  $("#adminOrdersSection").classList.remove("hidden");
  $("#showOrdersTab").classList.add("active");
  $("#showProductsTab").classList.remove("active");
  renderAdminOrders();
});
document.addEventListener("change",e=>{
  if(e.target.matches("[data-payment-status]")){
    const o=orders.find(x=>x.orderNo===e.target.dataset.paymentStatus);
    if(o){o.paymentStatus=e.target.value;saveOrders();renderAdminOrders();}
  }
  if(e.target.matches("[data-order-status]")){
    const o=orders.find(x=>x.orderNo===e.target.dataset.orderStatus);
    if(o){o.orderStatus=e.target.value;saveOrders();renderAdminOrders();}
  }
});
updatePaymentInstructions();
renderAdminOrders();
