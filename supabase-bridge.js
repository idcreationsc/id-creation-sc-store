// ID Creation SC — conexión segura con Supabase
// La clave publishable es pública por diseño. Nunca coloque aquí una secret/service_role key.
const IDC_SUPABASE_URL = "https://vjcfhlxwkmwogbifnxlf.supabase.co";
const IDC_SUPABASE_KEY = "sb_publishable_2_bbdS-0Zp6CJeJD1dCajQ_Sgptga9H";

let idcAccessToken = sessionStorage.getItem("idc_supabase_access_token") || "";
let idcAdminEmail = localStorage.getItem("idc_admin_email") || "";
let idcLastSyncedOrder = "";

function idcHeaders(auth=false, prefer=""){
  const h={"apikey":IDC_SUPABASE_KEY,"Content-Type":"application/json"};
  if(auth && idcAccessToken) h.Authorization=`Bearer ${idcAccessToken}`;
  if(prefer) h.Prefer=prefer;
  return h;
}
async function idcRequest(path,options={},auth=false){
  const res=await fetch(`${IDC_SUPABASE_URL}${path}`,{...options,headers:{...idcHeaders(auth,options.prefer||""),...(options.headers||{})}});
  const text=await res.text(); let data=null;
  if(text){try{data=JSON.parse(text)}catch{data=text}}
  if(!res.ok) throw new Error(data?.message||data?.msg||data?.error_description||`Error ${res.status}`);
  return data;
}
function idcMapProduct(row){return {id:String(row.id),name:row.name||"Producto",category:row.category||"Accesorios",price:Number(row.price||0),image:row.image_url||"assets/logo.png",image_url:row.image_url||"",description:row.description||"",variants:Array.isArray(row.sizes)?row.sizes:[],sizes:Array.isArray(row.sizes)?row.sizes:[],colors:Array.isArray(row.colors)?row.colors:[],collection_id:row.collection_id||null,design_image_url:row.design_image_url||"",use_mockup:row.use_mockup===true,mockup_scale:Number(row.mockup_scale||1),mockup_offset_x:Number(row.mockup_offset_x||0),mockup_offset_y:Number(row.mockup_offset_y||0)};}
function idcProductPayload(p){return {name:p.name,category:p.category,price:Number(p.price||0),image_url:p.image||"assets/logo.png",sizes:Array.isArray(p.variants)?p.variants:[],colors:Array.isArray(p.colors)?p.colors:[],description:p.description||"",active:true};}

async function idcLoadPublicProducts(){
  try{
    const rows=await idcRequest("/rest/v1/products?select=*&active=eq.true&order=id.asc");
    if(Array.isArray(rows)&&rows.length){products=rows.map(idcMapProduct);saveProducts();renderProducts();}
  }catch(err){console.warn("Supabase productos:",err.message)}
}
async function idcLogin(email,password){
  const res=await fetch(`${IDC_SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"apikey":IDC_SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error_description||data.msg||"No se pudo iniciar sesión.");
  idcAccessToken=data.access_token||"";
  if(!idcAccessToken) throw new Error("Supabase no devolvió una sesión válida.");
  sessionStorage.setItem("idc_supabase_access_token",idcAccessToken);localStorage.setItem("idc_admin_email",email);idcAdminEmail=email;return data;
}
async function idcLoadAdminProducts(){
  const rows=await idcRequest("/rest/v1/products?select=*&order=id.asc",{},true);
  if(Array.isArray(rows)&&rows.length){products=rows.map(idcMapProduct);saveProducts();renderProducts();renderAdmin();return;}
  // Si la tabla está vacía, sembrar el catálogo original de la tienda.
  const source=(Array.isArray(products)&&products.length)?products:((typeof seedProducts!=="undefined"&&Array.isArray(seedProducts))?seedProducts:[]);
  if(!source.length) throw new Error("No se encontró el catálogo inicial para copiar.");
  const created=await idcRequest("/rest/v1/products",{method:"POST",body:JSON.stringify(source.map(idcProductPayload)),prefer:"return=representation"},true);
  products=(created||[]).map(idcMapProduct);
  if(!products.length){const reread=await idcRequest("/rest/v1/products?select=*&order=id.asc",{},true);products=(reread||[]).map(idcMapProduct);}
  saveProducts();renderProducts();renderAdmin();
}
async function idcSyncProducts(){
  if(!idcAccessToken)return;
  try{
    // Guardar/actualizar cada producto sin borrar accidentalmente el resto del catálogo.
    for(const p of products){
      const payload=idcProductPayload(p);
      if(/^\d+$/.test(String(p.id))) await idcRequest(`/rest/v1/products?id=eq.${encodeURIComponent(p.id)}`,{method:"PATCH",body:JSON.stringify(payload),prefer:"return=minimal"},true);
      else await idcRequest("/rest/v1/products",{method:"POST",body:JSON.stringify(payload),prefer:"return=minimal"},true);
    }
    await idcLoadAdminProducts();
  }catch(err){console.error("Sincronización productos:",err);const msg=document.querySelector("#adminLoginMessage");if(msg)msg.textContent=`No se pudo guardar en Supabase: ${err.message}`;}
}
function idcMapOrder(row){return {orderNo:row.order_number,createdAt:row.created_at?new Date(row.created_at).toLocaleString("es-US"):"",customer:row.customer_name||"",phone:row.phone||"",email:row.email||"No indicado",delivery:row.delivery_method||"",address:row.address||"No aplica",paymentMethod:row.payment_method||"",paymentStatus:row.payment_status||"Pendiente",orderStatus:row.order_status||"Nuevo",notes:row.notes||"Ninguna",items:(row.order_items||[]).map(i=>({id:i.product_id?String(i.product_id):"",name:i.product_name,variant:i.variant||"",color:i.color||"",qty:Number(i.quantity||1),price:Number(i.unit_price||0)})),total:Number(row.total||0)};}
async function idcLoadAdminOrders(){if(!idcAccessToken)return;try{const rows=await idcRequest("/rest/v1/orders?select=*,order_items(*)&order=created_at.desc",{},true);orders=Array.isArray(rows)?rows.map(idcMapOrder):[];saveOrders();renderAdminOrders();}catch(err){console.error("Carga de pedidos:",err)}}
async function idcPersistOrder(order){
  if(!order||!order.orderNo||idcLastSyncedOrder===order.orderNo)return;idcLastSyncedOrder=order.orderNo;
  try{
    const customerRows=await idcRequest("/rest/v1/customers",{method:"POST",body:JSON.stringify({name:order.customer,phone:order.phone,email:order.email==="No indicado"?null:order.email}),prefer:"return=representation"});
    const customerId=Array.isArray(customerRows)&&customerRows[0]?customerRows[0].id:null;const isShipping=order.delivery==="Envío";
    const orderRows=await idcRequest("/rest/v1/orders",{method:"POST",body:JSON.stringify({order_number:order.orderNo,customer_id:customerId,customer_name:order.customer,phone:order.phone,email:order.email==="No indicado"?null:order.email,delivery_method:order.delivery,address:isShipping?(document.querySelector("#address")?.value.trim()||order.address):null,city:isShipping?(document.querySelector("#city")?.value.trim()||null):null,state:isShipping?(document.querySelector("#state")?.value.trim()||null):null,zip_code:isShipping?(document.querySelector("#zip")?.value.trim()||null):null,payment_method:order.paymentMethod,payment_status:order.paymentStatus||"Pendiente",order_status:order.orderStatus||"Nuevo",subtotal:Number(order.total||0),shipping:0,total:Number(order.total||0),notes:order.notes==="Ninguna"?null:order.notes}),prefer:"return=representation"});
    const orderId=Array.isArray(orderRows)&&orderRows[0]?orderRows[0].id:null;
    if(orderId&&Array.isArray(order.items)&&order.items.length){const items=order.items.map(i=>({order_id:orderId,product_id:/^\d+$/.test(String(i.id))?Number(i.id):null,product_name:i.name,variant:i.variant||null,color:i.color||null,quantity:Number(i.qty||1),unit_price:Number(i.price||0),total:Number(i.price||0)*Number(i.qty||1)}));await idcRequest("/rest/v1/order_items",{method:"POST",body:JSON.stringify(items),prefer:"return=minimal"});}
  }catch(err){console.error("Guardado de pedido en Supabase:",err)}
}
async function idcPatchOrder(orderNo,changes){if(!idcAccessToken||!orderNo)return;try{await idcRequest(`/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNo)}`,{method:"PATCH",body:JSON.stringify(changes),prefer:"return=minimal"},true)}catch(err){console.error("Actualización pedido:",err)}}
function idcPrepareAdminLogin(){
  const login=document.querySelector("#adminLogin"),password=document.querySelector("#adminPassword"),oldBtn=document.querySelector("#adminLoginBtn");if(!login||!password||!oldBtn)return;
  const eyebrow=login.querySelector(".eyebrow"),muted=login.querySelector(".muted");if(eyebrow)eyebrow.textContent="ADMINISTRACIÓN SEGURA";if(muted)muted.textContent="Inicia sesión con el usuario administrador de Supabase.";
  let email=document.querySelector("#adminEmail");if(!email){email=document.createElement("input");email.id="adminEmail";email.type="email";email.placeholder="Email de administrador";email.autocomplete="username";email.value=idcAdminEmail;password.parentNode.insertBefore(email,password);}password.placeholder="Contraseña de administrador";password.autocomplete="current-password";
  const btn=oldBtn.cloneNode(true);oldBtn.replaceWith(btn);btn.addEventListener("click",async()=>{const message=document.querySelector("#adminLoginMessage"),mail=email.value.trim(),pass=password.value;if(!mail||!pass){message.textContent="Escribe el email y la contraseña del administrador.";return;}btn.disabled=true;message.textContent="Verificando acceso...";try{await idcLogin(mail,pass);document.querySelector("#adminLogin").classList.add("hidden");document.querySelector("#adminPanel").classList.remove("hidden");message.textContent="";await idcLoadAdminProducts();await idcLoadAdminOrders();renderAdmin();renderAdminOrders();}catch(err){message.textContent=`No se pudo entrar: ${err.message}`;document.querySelector("#adminLogin").classList.remove("hidden");document.querySelector("#adminPanel").classList.add("hidden");}finally{btn.disabled=false;}});
}
function idcAttachSyncListeners(){
  const saveBtn=document.querySelector("#saveProductBtn");if(saveBtn)saveBtn.addEventListener("click",()=>setTimeout(idcSyncProducts,80));
  const orderBtn=document.querySelector("#sendOrderBtn");if(orderBtn)orderBtn.addEventListener("click",()=>{const latest=Array.isArray(orders)&&orders.length?orders[orders.length-1]:null;if(latest)setTimeout(()=>idcPersistOrder(latest),80);});
  document.addEventListener("click",e=>{const delOrder=e.target.closest?.("[data-delete-order]");if(delOrder&&idcAccessToken){e.preventDefault();e.stopImmediatePropagation();alert("Los pedidos guardados en la base de datos no se eliminan desde la tienda. Si no procede, cámbialo a Cancelado.");}},true);
  document.addEventListener("change",e=>{if(e.target.matches?.("[data-payment-status]"))idcPatchOrder(e.target.dataset.paymentStatus,{payment_status:e.target.value});if(e.target.matches?.("[data-order-status]"))idcPatchOrder(e.target.dataset.orderStatus,{order_status:e.target.value});});
}
idcPrepareAdminLogin();idcAttachSyncListeners();idcLoadPublicProducts();
