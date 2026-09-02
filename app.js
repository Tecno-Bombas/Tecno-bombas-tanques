const SUPABASE_URL = "https://ofejunrkrjybfvbqmzzh.supabase.co";
const SUPABASE_KEY = "sb_publishable_HU_bsdvSPB24bPM0yIxRCg_6be0Btn3";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let datos = [];
let pendientes = [];
let pendienteSeleccionado = null;
let personaAvatar = "Facu";
let avatarTemporal = null;

let estrellas = {Facu:0,Jaz:0};
let recompensas = [];
let historialRecompensas = [];

const temas = {
  blue:{
    primary:"#4f7cff",
    dark:"#315fe0",
    bg:"#f4f7ff",
    card:"#fff",
    text:"#202638",
    muted:"#7b8499",
    border:"#e7eaf2"
  },
  pink:{
    primary:"#ed6c9b",
    dark:"#d94f82",
    bg:"#fff3f8",
    card:"#fff",
    text:"#4a3340",
    muted:"#a4778c",
    border:"#f4d7e5"
  },
  purple:{
    primary:"#8b6cff",
    dark:"#684ee0",
    bg:"#f7f4ff",
    card:"#fff",
    text:"#3d3552",
    muted:"#877e9e",
    border:"#e3dcf5"
  },
  green:{
    primary:"#2ebd86",
    dark:"#179768",
    bg:"#f1fbf7",
    card:"#fff",
    text:"#29483d",
    muted:"#78968a",
    border:"#d8eee5"
  },
  orange:{
    primary:"#f59d3d",
    dark:"#df7d16",
    bg:"#fff8ef",
    card:"#fff",
    text:"#4b3c2c",
    muted:"#9b8771",
    border:"#f1dfc8"
  },
  dark:{
    primary:"#738cff",
    dark:"#536bdc",
    bg:"#111522",
    card:"#1b2131",
    text:"#f2f4fa",
    muted:"#929bb0",
    border:"#2a3245"
  },
  kawaii:{
    primary:"#ff79a8",
    dark:"#ff5792",
    bg:"#fff5fa",
    card:"#fff",
    text:"#4a3340",
    muted:"#a4778c",
    border:"#f5dbe7"
  }
};

function dinero(v){
  return "$ " + Number(v || 0).toLocaleString("es-UY",{
    maximumFractionDigits:2
  });
}

function fechaBonita(v){
  if(!v) return "";

  const d = new Date(
    v.includes("T") ? v : v+"T00:00:00"
  );

  return d.toLocaleDateString("es-UY",{
    day:"2-digit",
    month:"2-digit",
    year:"numeric"
  });
}

function mesBonito(v){
  if(!v) return "";

  const [y,m] = v.substring(0,7).split("-");

  return new Date(
    Number(y),
    Number(m)-1,
    1
  ).toLocaleDateString("es-UY",{
    month:"long",
    year:"numeric"
  });
}

function escapeHTML(t){
  return String(t)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function limpiar(id){
  document.getElementById(id).value="";
}

function abrirModal(id){
  document.getElementById(id).classList.add("show");
}

function cerrarModal(id){
  document.getElementById(id).classList.remove("show");
}

document.querySelectorAll(".modal-bg").forEach(m=>{
  m.addEventListener("click",e=>{
    if(e.target===m){
      m.classList.remove("show");
    }
  });
});

function mostrarSeccion(s){

  document
    .querySelectorAll(".section")
    .forEach(x=>x.classList.remove("active"));

  document
    .querySelectorAll(".tab")
    .forEach(x=>x.classList.remove("active"));

  const section=document.getElementById(s);

  if(section){
    section.classList.add("active");
  }

  let tabId;

  if(s==="movimientos"){
    tabId="tabMovimientos";
  }else if(s==="pendientes"){
    tabId="tabPendientes";
  }else{
    tabId="tabRecompensas";
  }

  const tab=document.getElementById(tabId);

  if(tab){
    tab.classList.add("active");
  }

  if(s==="recompensas"){
    mostrarRecompensas();
  }

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}


/* =========================================================
   DATOS
   ========================================================= */

async function cargarDatos(){
  // Cargar movimientos
  const m = await db
    .from("gastos_pareja")
    .select("*")
    .order("fecha",{ascending:false});

  if(m.error){
    console.error("Error movimientos:",m.error);
    alert("No se pudieron cargar los movimientos.");
    return;
  }

  datos = m.data || [];

  // Cargar pendientes
  const p = await db
    .from("gastos_pendientes")
    .select("*")
    .order("fecha_creacion",{ascending:false});

  if(p.error){
    console.error("Error pendientes:",p.error);
    alert("No se pudieron cargar los pendientes.");
    return;
  }

  pendientes = p.data || [];

  // Mostrar inmediatamente los pendientes
  calcularResumen();
  mostrarMovimientos();
  mostrarPendientes();
  actualizarAvatares();

  // Las recompensas se cargan aparte.
  // Si hay algún problema con ellas, no afecta a Pendientes.
  try{
    await cargarRecompensas();
    mostrarRecompensas();
  }catch(error){
    console.error("Error recompensas:",error);
  }
}

/* =========================================================
   RESUMEN
   ========================================================= */

function calcularResumen(){

  let ingresos=0;
  let gastos=0;
  let facu=0;
  let jaz=0;
  let medias=0;

  datos.forEach(x=>{

    const m=Number(x.monto)||0;

    if(x.tipo==="ingreso"){

      ingresos+=m;

    }else{

      gastos+=m;

      if(x.persona==="Facu"){
        facu+=m;
      }

      if(x.persona==="Jaz"){
        jaz+=m;
      }

      if(x.persona==="A medias"){
        medias+=m;
        facu+=m/2;
        jaz+=m/2;
      }
    }
  });

  document.getElementById("saldo").textContent=
    dinero(ingresos-gastos);

  document.getElementById("ingresado").textContent=
    dinero(ingresos);

  document.getElementById("gastado").textContent=
    dinero(gastos);

  document.getElementById("facuTotal").textContent=
    dinero(facu);

  document.getElementById("jazTotal").textContent=
    dinero(jaz);

  document.getElementById("mediasTotal").textContent=
    dinero(medias);

  document.getElementById("totalGastos").textContent=
    datos.filter(x=>x.tipo==="gasto").length;
}


/* =========================================================
   MOVIMIENTOS
   ========================================================= */

async function agregarMovimiento(){

  const concepto=
    document.getElementById("concepto").value.trim();

  const monto=
    Number(document.getElementById("monto").value);

  const tipo=
    document.getElementById("tipo").value;

  const persona=
    tipo==="ingreso"
      ? "A medias"
      : document.getElementById("persona").value;

  if(!concepto){
    return alert("Poné un concepto.");
  }

  if(!monto || monto<=0){
    return alert("Poné un monto válido.");
  }

  const {error}=await db
    .from("gastos_pareja")
    .insert({
      tipo,
      concepto,
      monto,
      persona
    });

  if(error){
    console.error(error);
    return alert("No se pudo guardar el movimiento.");
  }

  limpiar("concepto");
  limpiar("monto");

  await cargarDatos();
}

function actualizarPersonaSegunTipo(){

  const tipo=
    document.getElementById("tipo").value;

  const persona=
    document.getElementById("persona");

  persona.disabled=tipo==="ingreso";

  if(tipo==="ingreso"){
    persona.value="A medias";
  }
}

function mostrarMovimientos(){

  const c=
    document.getElementById("listaMovimientos");

  if(!datos.length){

    c.innerHTML=
      '<div class="empty"><div class="empty-icon">💸</div>Todavía no hay movimientos.</div>';

    return;
  }

  c.innerHTML=datos.map(x=>{

    const ingreso=
      x.tipo==="ingreso";

    const nombre=
      ingreso
        ? "💰 Ingreso"
        : "💸 "+(x.persona||"");

    return `
      <div class="movement">

        <div class="movement-left">

          <div class="movement-title">
            ${escapeHTML(x.concepto)}
          </div>

          <div class="movement-meta">
            ${fechaBonita(x.fecha)} · ${escapeHTML(nombre)}
          </div>

        </div>

        <div class="movement-right">

          <div class="amount ${ingreso?"income":"expense"}">
            ${ingreso?"+":"-"}${dinero(x.monto)}
          </div>

          <button
            class="delete-btn"
            onclick="eliminarMovimiento('${x.id}')">
            🗑️
          </button>

        </div>

      </div>
    `;

  }).join("");
}

async function eliminarMovimiento(id){

  const x=
    datos.find(a=>a.id===id);

  if(!x) return;

  if(!confirm(
    "¿Querés eliminar este movimiento?\n\n"+
    x.concepto+"\n"+
    dinero(x.monto)
  )){
    return;
  }

  const {error}=await db
    .from("gastos_pareja")
    .delete()
    .eq("id",id);

  if(error){
    console.error(error);
    return alert("No se pudo eliminar.");
  }

  await cargarDatos();
}


/* =========================================================
   FONDO COMÚN
   ========================================================= */

function abrirEditarFondo(){

  const ingresos=
    datos
      .filter(x=>x.tipo==="ingreso")
      .reduce(
        (s,x)=>s+Number(x.monto||0),
        0
      );

  document.getElementById("nuevoFondo").value=
    ingresos;

  abrirModal("modalFondo");
}

async function guardarFondo(){

  const nuevo=
    Number(
      document.getElementById("nuevoFondo").value
    );

  if(Number.isNaN(nuevo)||nuevo<0){
    return alert("Poné un monto válido.");
  }

  const ingresos=
    datos.filter(x=>x.tipo==="ingreso");

  for(const x of ingresos){

    const {error}=await db
      .from("gastos_pareja")
      .delete()
      .eq("id",x.id);

    if(error){
      console.error(error);
      return alert("No se pudo editar el fondo.");
    }
  }

  if(nuevo>0){

    const {error}=await db
      .from("gastos_pareja")
      .insert({
        tipo:"ingreso",
        concepto:"Fondo común",
        monto:nuevo,
        persona:"A medias"
      });

    if(error){
      console.error(error);
      return alert("No se pudo guardar el nuevo fondo.");
    }
  }

  cerrarModal("modalFondo");

  await cargarDatos();
}


/* =========================================================
   PENDIENTES
   ========================================================= */

async function agregarPendiente(){

  const concepto=
    document.getElementById("pendConcepto")
      .value.trim();

  const monto=
    Number(
      document.getElementById("pendMonto").value
    );

  const mes=
    document.getElementById("pendMes").value;

  const venc=
    document.getElementById("pendVencimiento").value || null;

  if(!concepto){
    return alert("Poné qué tenés que pagar.");
  }

  if(!monto||monto<=0){
    return alert("Poné un monto válido.");
  }

  if(!mes){
    return alert("Elegí el mes de la deuda.");
  }

  const {error}=await db
    .from("gastos_pendientes")
    .insert({
      concepto,
      monto,
      mes_deuda:mes+"-01",
      fecha_vencimiento:venc
    });

  if(error){
    console.error(error);
    return alert("No se pudo guardar el pendiente.");
  }

  limpiar("pendConcepto");
  limpiar("pendMonto");

  document.getElementById("pendMes").value="";
  document.getElementById("pendVencimiento").value="";

  await cargarDatos();
}

function diasPendiente(p){

  const inicio=
    new Date(p.mes_deuda+"T00:00:00");

  return Math.max(
    0,
    Math.floor(
      (Date.now()-inicio.getTime())/86400000
    )
  );
}

function alertaClase(dias){

  if(dias>=90) return "high";

  if(dias>=45) return "medium";

  return "low";
}

function mostrarPendientes(){

  const lista=
    document.getElementById("listaPendientes");

  const resumen=
    document.getElementById("pendingSummary");

  const ahora=new Date();

  const atrasados=
    pendientes.filter(
      p=>p.fecha_vencimiento &&
      new Date(
        p.fecha_vencimiento+"T23:59:59"
      )<ahora
    ).length;

  const conRecordatorio=
    pendientes.filter(
      p=>obtenerRecordatorio(p.id)
    ).length;

  resumen.innerHTML=`

    <div class="badge">
      🧾 ${pendientes.length}
      pendiente${pendientes.length===1?"":"s"}
    </div>

    ${
      atrasados
      ?
      `<div class="badge">
        ⚠️ ${atrasados}
        atrasado${atrasados===1?"":"s"}
      </div>`
      :
      ""
    }

    ${
      conRecordatorio
      ?
      `<div class="badge">
        🔔 ${conRecordatorio} con recordatorio
      </div>`
      :
      ""
    }

  `;

  if(!pendientes.length){

    lista.innerHTML=
      '<div class="empty"><div class="empty-icon">🎉</div>No tenés gastos pendientes.</div>';

    return;
  }

  lista.innerHTML=pendientes.map(p=>{

    const dias=
      diasPendiente(p);

    const clase=
      alertaClase(dias);

    const vencido=
      p.fecha_vencimiento &&
      new Date(
        p.fecha_vencimiento+"T23:59:59"
      )<ahora;

    const r=
      obtenerRecordatorio(p.id);

    let alerta="";

    if(vencido){

      alerta=
        "🔴 Este pago está vencido.";

    }else if(dias>=90){

      alerta=
        "🚨 Hace bastante tiempo que está pendiente.";

    }else if(dias>=45){

      alerta=
        "⚠️ Hace varias semanas que está pendiente.";

    }else if(dias>=15){

      alerta=
        "🟡 Ya lleva algunos días pendiente.";
    }

    return `
      <div class="pending-card ${clase}">

        <div class="pending-top">

          <div class="pending-title">
            🧾 ${escapeHTML(p.concepto)}
          </div>

          <div class="pending-amount">
            ${dinero(p.monto)}
          </div>

        </div>

        <div class="pending-info">

          📅 ${escapeHTML(
            mesBonito(p.mes_deuda)
          )}

          ${
            p.fecha_vencimiento
            ?
            `<br>📆 Vence:
            ${fechaBonita(p.fecha_vencimiento)}`
            :
            ""
          }

          ${
            r
            ?
            `<br>🔔 Recordatorio:
            ${fechaBonita(r.fecha)}
            a las ${escapeHTML(r.hora)}`
            :
            ""
          }

        </div>

        ${
          alerta
          ?
          `<div class="pending-alert ${
            dias>=90||vencido?"high":""
          }">
            ${alerta}
          </div>`
          :
          ""
        }

        <div class="pending-actions">

          <button
            class="pay-btn"
            onclick="abrirPagar('${p.id}')">
            💳 Pagar
          </button>

          <button
            class="reminder-btn"
            onclick="abrirRecordatorio('${p.id}')">
            ${r?"🔔 Editar":"🔔 Recordarme"}
          </button>

          <button
            class="pending-delete"
            onclick="eliminarPendiente('${p.id}')">
            🗑️
          </button>

        </div>

      </div>
    `;

  }).join("");
}

function abrirPagar(id){

  pendienteSeleccionado=
    pendientes.find(
      p=>p.id===id
    );

  if(!pendienteSeleccionado) return;

  document.getElementById(
    "pagarNombre"
  ).textContent=
    pendienteSeleccionado.concepto+
    " · "+
    dinero(pendienteSeleccionado.monto);

  abrirModal("modalPagar");
}

async function confirmarPago(){

  if(!pendienteSeleccionado) return;

  const p=pendienteSeleccionado;

  const persona=
    document.getElementById("pagarPersona").value;

  const {error:e1}=await db
    .from("gastos_pareja")
    .insert({
      tipo:"gasto",
      concepto:p.concepto,
      monto:p.monto,
      persona
    });

  if(e1){
    console.error(e1);
    return alert("No se pudo registrar el pago.");
  }

  const {error:e2}=await db
    .from("gastos_pendientes")
    .delete()
    .eq("id",p.id);

  if(e2){
    console.error(e2);
    return alert(
      "El pago se registró, pero no se pudo eliminar el pendiente."
    );
  }

  // ⭐ Premio por pagar el pendiente

  const premios =
    persona==="A medias"
      ? {Facu:0.5,Jaz:0.5}
      : {[persona]:1};

  for(const quien of Object.keys(premios)){

    const suma=premios[quien];

    const {data,error}=await db
      .from("estrellas_pareja")
      .select("estrellas")
      .eq("persona",quien)
      .single();

    if(error || !data){

      console.error(error);

      return alert(
        "El pago se registró, pero no se pudieron sumar las estrellas."
      );
    }

    const {error:updateError}=await db
      .from("estrellas_pareja")
      .update({
        estrellas:Number(data.estrellas||0)+suma
      })
      .eq("persona",quien);

    if(updateError){

      console.error(updateError);

      return alert(
        "El pago se registró, pero no se pudieron sumar las estrellas."
      );
    }
  }

  eliminarRecordatorio(p.id);

  pendienteSeleccionado=null;

  cerrarModal("modalPagar");

  await cargarDatos();

  if(persona==="A medias"){

    mostrarEstrellasToast(
      "⭐ +0,5 para Facu y +0,5 para Jaz"
    );

  }else{

    mostrarEstrellasToast(
      "⭐ +1 estrella para "+persona
    );
  }
}


async function eliminarPendiente(id){

  const p=
    pendientes.find(x=>x.id===id);

  if(!p) return;

  if(!confirm(
    "¿Querés eliminar este pendiente?\n\n"+
    p.concepto+"\n"+
    dinero(p.monto)
  )){
    return;
  }

  const {error}=await db
    .from("gastos_pendientes")
    .delete()
    .eq("id",id);

  if(error){
    console.error(error);
    return alert("No se pudo eliminar.");
  }

  eliminarRecordatorio(id);

  await cargarDatos();
}


/* =========================================================
   RECORDATORIOS
   Se guardan solamente en este teléfono.
   ========================================================= */

function obtenerRecordatorios(){

  try{

    return JSON.parse(
      localStorage.getItem(
        "facujaz_recordatorios"
      ) || "{}"
    );

  }catch{

    return {};
  }
}

function guardarTodosRecordatorios(o){

  localStorage.setItem(
    "facujaz_recordatorios",
    JSON.stringify(o)
  );
}

function obtenerRecordatorio(id){

  return obtenerRecordatorios()[id] || null;
}

function eliminarRecordatorio(id){

  const o=obtenerRecordatorios();

  delete o[id];

  guardarTodosRecordatorios(o);
}


function abrirRecordatorio(id){

  pendienteSeleccionado=
    pendientes.find(
      p=>p.id===id
    );

  if(!pendienteSeleccionado) return;

  const r=
    obtenerRecordatorio(id);

  document.getElementById(
    "recordatorioNombre"
  ).textContent=
    "🧾 "+
    pendienteSeleccionado.concepto+
    " · "+
    dinero(pendienteSeleccionado.monto);

  if(r){

    document.getElementById(
      "recordatorioFecha"
    ).value=r.fecha;

    document.getElementById(
      "recordatorioHora"
    ).value=r.hora;

  }else{

    const d=new Date();

    d.setDate(
      d.getDate()+1
    );

    document.getElementById(
      "recordatorioFecha"
    ).value=
      d.toISOString().split("T")[0];

    document.getElementById(
      "recordatorioHora"
    ).value="09:00";
  }

  abrirModal("modalRecordatorio");
}


function guardarRecordatorio(){

  if(!pendienteSeleccionado) return;

  const fecha=
    document.getElementById(
      "recordatorioFecha"
    ).value;

  const hora=
    document.getElementById(
      "recordatorioHora"
    ).value;

  if(!fecha||!hora){

    return alert(
      "Elegí fecha y hora."
    );
  }

  const o=
    obtenerRecordatorios();

  o[pendienteSeleccionado.id]={
    fecha,
    hora
  };

  guardarTodosRecordatorios(o);

  cerrarModal(
    "modalRecordatorio"
  );

  mostrarPendientes();
}


/* =========================================================
   AVISO AL ABRIR
   ========================================================= */

function mostrarAvisosAlAbrir(){

  const todos=
    obtenerRecordatorios();

  const lista=
    pendientes
      .filter(p=>todos[p.id])
      .map(p=>({
        p,
        r:todos[p.id]
      }));

  if(!lista.length) return;

  const c=
    document.getElementById(
      "toastContainer"
    );

  if(!c) return;

  const toast=
    document.createElement("div");

  toast.className="toast";

  const items=
    lista
      .slice(0,5)
      .map(x=>`

        <div class="toast-item">

          <strong>
            💸 ${escapeHTML(x.p.concepto)}
            · ${dinero(x.p.monto)}
          </strong>

          <span>
            🔔 ${fechaBonita(x.r.fecha)}
            a las ${escapeHTML(x.r.hora)}
          </span>

        </div>

      `)
      .join("");

  toast.innerHTML=`

    <div class="toast-head">

      <div class="toast-icon">
        🔔
      </div>

      <div class="toast-title">
        Tenés pagos para recordar 💕
      </div>

      <button
        class="toast-close"
        onclick="cerrarAviso(this)">
        ×
      </button>

    </div>

    <div class="toast-items">
      ${items}
    </div>

  `;

  c.appendChild(toast);

  setTimeout(()=>{

    if(toast.parentNode){

      toast.classList.add("hide");

      setTimeout(
        ()=>toast.remove(),
        400
      );
    }

  },3500);
}


function cerrarAviso(btn){

  const t=
    btn.closest(".toast");

  if(!t) return;

  t.classList.add("hide");

  setTimeout(
    ()=>t.remove(),
    400
  );
}


/* =========================================================
   TEMAS
   ========================================================= */

function abrirTemas(){

  const t=
    localStorage.getItem(
      "facujaz_tema"
    ) || "kawaii";

  document.getElementById(
    "selectorTema"
  ).value=t;

  abrirModal("modalTemas");
}


function cambiarTema(tema){

  const c=
    temas[tema] || temas.kawaii;

  const root=
    document.documentElement;

  root.style.setProperty(
    "--primary",
    c.primary
  );

  root.style.setProperty(
    "--primary-dark",
    c.dark
  );

  root.style.setProperty(
    "--bg",
    c.bg
  );

  root.style.setProperty(
    "--card",
    c.card
  );

  root.style.setProperty(
    "--text",
    c.text
  );

  root.style.setProperty(
    "--muted",
    c.muted
  );

  root.style.setProperty(
    "--border",
    c.border
  );

  document.body.classList.toggle(
    "dark",
    tema==="dark"
  );

  document.body.classList.toggle(
    "kawaii",
    tema==="kawaii"
  );

  localStorage.setItem(
    "facujaz_tema",
    tema
  );
}


/* =========================================================
   AVATARES
   ========================================================= */

function avatarKey(persona){

  return "facujaz_avatar_"+
    persona.toLowerCase();
}


function obtenerAvatar(persona){

  return localStorage.getItem(
    avatarKey(persona)
  );
}


function avatarDefault(persona){

  return persona==="Facu"
    ? "👨"
    : "👩";
}


function ponerAvatarElemento(
  img,
  persona
){

  const valor=
    obtenerAvatar(persona);

  if(valor && valor.startsWith("data:image")){

    img.src=valor;

    img.classList.remove(
      "avatar-placeholder",
      "mini-placeholder"
    );

    img.style.objectFit="cover";

  }else{

    img.removeAttribute("src");

    img.classList.add(
      persona==="Facu" || persona==="Jaz"
        ? "mini-placeholder"
        : "avatar-placeholder"
    );

    img.alt=
      avatarDefault(persona);

    img.style.objectFit="contain";

    img.style.background=
      "#fff0f6";

    img.dataset.emoji=
      avatarDefault(persona);

    img.onload=null;
    img.onerror=null;
  }
}


function actualizarAvatares(){

  const ha=
    document.getElementById(
      "headerAvatar"
    );

  const fa=
    document.getElementById(
      "facuAvatar"
    );

  const ja=
    document.getElementById(
      "jazAvatar"
    );

  ponerAvatarElemento(
    ha,
    "Facu"
  );

  ponerAvatarElemento(
    fa,
    "Facu"
  );

  ponerAvatarElemento(
    ja,
    "Jaz"
  );

  [ha,fa,ja].forEach(img=>{

    if(!img) return;

    if(!obtenerAvatar(
      img.id==="jazAvatar"
        ? "Jaz"
        : "Facu"
    )){

      img.src=
        "data:image/svg+xml;charset=UTF-8,"+
        encodeURIComponent(`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100">

            <rect
              width="100"
              height="100"
              rx="25"
              fill="#fff0f6"/>

            <text
              x="50"
              y="65"
              text-anchor="middle"
              font-size="48">
              ${
                img.id==="jazAvatar"
                  ? "👩"
                  : "👨"
              }
            </text>

          </svg>
        `);
    }
  });
}


function abrirAvatar(persona){

  personaAvatar=persona;

  avatarTemporal=
    obtenerAvatar(persona) || null;

  document.getElementById(
    "avatarPerson"
  ).textContent=
    "Avatar de "+persona;

  actualizarPreviewAvatar();

  abrirModal("modalAvatar");
}


function actualizarPreviewAvatar(){

  const p=
    document.getElementById(
      "avatarPreview"
    );

  if(avatarTemporal){

    p.src=avatarTemporal;

    p.style.objectFit="cover";

  }else{

    p.src=
      "data:image/svg+xml;charset=UTF-8,"+
      encodeURIComponent(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100">

          <rect
            width="100"
            height="100"
            rx="28"
            fill="#fff0f6"/>

          <text
            x="50"
            y="67"
            text-anchor="middle"
            font-size="48">
            ${avatarDefault(personaAvatar)}
          </text>

        </svg>
      `);

    p.style.objectFit="contain";
  }
}


function usarAvatarEmoji(){

  avatarTemporal=null;

  actualizarPreviewAvatar();
}


function procesarAvatar(event){

  const file=
    event.target.files &&
    event.target.files[0];

  if(!file) return;

  if(!file.type.startsWith("image/")){

    return alert(
      "Elegí una imagen."
    );
  }

  if(file.size>10*1024*1024){

    return alert(
      "La foto es demasiado grande. Elegí una de menos de 10 MB."
    );
  }

  const reader=
    new FileReader();

  reader.onload=e=>{

    const img=
      new Image();

    img.onload=()=>{

      const max=600;

      const escala=
        Math.min(
          1,
          max/
          Math.max(
            img.width,
            img.height
          )
        );

      const canvas=
        document.createElement(
          "canvas"
        );

      canvas.width=
        Math.max(
          1,
          Math.round(
            img.width*escala
          )
        );

      canvas.height=
        Math.max(
          1,
          Math.round(
            img.height*escala
          )
        );

      const ctx=
        canvas.getContext("2d");

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      avatarTemporal=
        canvas.toDataURL(
          "image/jpeg",
          0.78
        );

      actualizarPreviewAvatar();
    };

    img.src=e.target.result;
  };

  reader.readAsDataURL(file);

  event.target.value="";
}


function guardarAvatar(){

  if(avatarTemporal){

    try{

      localStorage.setItem(
        avatarKey(personaAvatar),
        avatarTemporal
      );

    }catch(e){

      return alert(
        "No hay espacio suficiente para guardar esa foto en este teléfono."
      );
    }

  }else{

    localStorage.removeItem(
      avatarKey(personaAvatar)
    );
  }

  cerrarModal("modalAvatar");

  actualizarAvatares();
  
}
/* =========================================================
   ⭐ RECOMPENSAS
   ========================================================= */

async function cargarRecompensas(){

  const e=await db
    .from("estrellas_pareja")
    .select("persona,estrellas");

  if(e.error){
    console.error(e.error);
    return;
  }

  estrellas={
    Facu:0,
    Jaz:0
  };

  (e.data||[]).forEach(x=>{

    if(
      x.persona==="Facu" ||
      x.persona==="Jaz"
    ){

      estrellas[x.persona]=
        Number(x.estrellas||0);
    }
  });


  const r=await db
    .from("recompensas")
    .select("*")
    .order(
      "fecha_creacion",
      {ascending:true}
    );

  if(r.error){
    console.error(r.error);
    return;
  }

  recompensas=
    r.data||[];


  const h=await db
    .from("historial_recompensas")
    .select("*")
    .order(
      "fecha",
      {ascending:false}
    )
    .limit(20);

  if(h.error){
    console.error(h.error);
    return;
  }

  historialRecompensas=
    h.data||[];


  // Recompensas iniciales

  if(!recompensas.length){

    const ejemplos=[

      {
        nombre:"Que me hagan un mate",
        descripcion:
          "Un matecito preparado por la otra persona ☕",
        costo:1
      },

      {
        nombre:"Elegir qué comemos",
        descripcion:
          "Hoy yo decido la comida 🍕",
        costo:2
      },

      {
        nombre:"Elegir la película",
        descripcion:
          "Yo elijo qué vemos 🎬",
        costo:2
      },

      {
        nombre:"No lavar los platos",
        descripcion:
          "Esta vez los lava la otra persona 🧹",
        costo:3
      },

      {
        nombre:"Cita elegida por mí",
        descripcion:
          "Una salida elegida por quien canjea ❤️",
        costo:5
      }

    ];

    const ins=
      await db
        .from("recompensas")
        .insert(ejemplos)
        .select("*");

    if(!ins.error){

      recompensas=
        ins.data||[];
    }
  }
}


/* =========================================================
   CREAR PESTAÑA Y PANTALLA DE RECOMPENSAS
   ========================================================= */

function asegurarUIRecompensas(){

  if(
    document.getElementById(
      "tabRecompensas"
    )
  ){
    return;
  }

  const tabs=
    document.querySelector(".tabs");

  if(!tabs) return;


  // Botón ⭐ Recompensas

  const tab=
    document.createElement("button");

  tab.id="tabRecompensas";

  tab.className="tab";

  tab.textContent=
    "⭐ Recompensas";

  tab.onclick=()=>{
    mostrarSeccion(
      "recompensas"
    );
  };

  tabs.appendChild(tab);


  // Tres columnas

  tabs.style.gridTemplateColumns=
    "repeat(3,1fr)";


  // Sección

  const sec=
    document.createElement(
      "section"
    );

  sec.id="recompensas";

  sec.className="section";


  sec.innerHTML=`

    <div class="reward-hero">

      <div class="reward-hero-title">
        ⭐ Banco de estrellitas
      </div>

      <div class="reward-hero-sub">
        Pagá pendientes, juntá estrellas
        y canjealas por favores 💕
      </div>


      <div class="stars-people">

        <div class="star-person">

          <div class="star-avatar">
            👨
          </div>

          <div>
            <b>Facu</b>

            <strong id="estrellasFacu">
              0 ⭐
            </strong>
          </div>

        </div>


        <div class="star-person">

          <div class="star-avatar">
            👩
          </div>

          <div>
            <b>Jaz</b>

            <strong id="estrellasJaz">
              0 ⭐
            </strong>
          </div>

        </div>

      </div>

    </div>


    <div class="form-card">

      <div class="form-title">
        🎁 Crear un nuevo favor
      </div>


      <div class="field">

        <input
          id="rewardNombre"
          placeholder="Ej: Que me hagan un café">

      </div>


      <div class="field">

        <input
          id="rewardDescripcion"
          placeholder="Descripción (opcional)">

      </div>


      <div class="field">

        <input
          id="rewardCosto"
          type="number"
          min="1"
          step="1"
          placeholder="¿Cuántas ⭐ cuesta?">

      </div>


      <button
        class="primary-btn"
        onclick="agregarRecompensa()">

        ➕ Agregar recompensa

      </button>

    </div>


    <div class="section-heading">

      <span>🎁</span>

      <h2>
        Favores disponibles
      </h2>

    </div>


    <div id="listaRecompensas"></div>


    <div class="section-heading">

      <span>📜</span>

      <h2>
        Canjes recientes
      </h2>

    </div>


    <div id="historialRecompensas"></div>

  `;


  // Insertamos antes de los modales

  const modalTemas=
    document.getElementById(
      "modalTemas"
    );

  if(modalTemas){

    modalTemas.parentNode.insertBefore(
      sec,
      modalTemas
    );

  }else{

    const app=
      document.querySelector(".app");

    if(app){
      app.appendChild(sec);
    }
  }


  // Estilos propios

  const style=
    document.createElement("style");

  style.id=
    "recompensasStyle";

  style.textContent=`

    .reward-hero{
      background:
        linear-gradient(
          135deg,
          var(--primary),
          var(--primary-dark)
        );
      color:#fff;
      border-radius:28px;
      padding:20px;
      box-shadow:
        0 16px 35px
        rgba(255,87,146,.2);
      margin-bottom:18px;
    }

    .reward-hero-title{
      font-size:23px;
      font-weight:950;
    }

    .reward-hero-sub{
      font-size:13px;
      opacity:.92;
      margin-top:4px;
    }

    .stars-people{
      display:grid;
      grid-template-columns:
        1fr 1fr;
      gap:10px;
      margin-top:16px;
    }

    .star-person{
      display:flex;
      align-items:center;
      gap:10px;
      background:
        rgba(255,255,255,.18);
      padding:11px;
      border-radius:18px;
    }

    .star-person b{
      display:block;
      font-size:12px;
      opacity:.9;
    }

    .star-person strong{
      display:block;
      font-size:19px;
      margin-top:2px;
    }

    .star-avatar{
      width:43px;
      height:43px;
      border-radius:15px;
      background:
        rgba(255,255,255,.85);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:23px;
    }

    .reward-card{
      background:var(--card);
      border:1px solid var(--border);
      border-radius:22px;
      padding:16px;
      margin-bottom:10px;
      box-shadow:var(--shadow);
    }

    .reward-top{
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:flex-start;
    }

    .reward-name{
      font-weight:900;
      font-size:17px;
    }

    .reward-cost{
      white-space:nowrap;
      font-weight:950;
      color:var(--primary);
      background:var(--bg);
      padding:8px 10px;
      border-radius:13px;
    }

    .reward-desc{
      color:var(--muted);
      font-size:12px;
      margin-top:5px;
      line-height:1.45;
    }

    .reward-actions{
      display:grid;
      grid-template-columns:
        1fr 1fr 40px;
      gap:7px;
      margin-top:13px;
    }

    .reward-use,
    .reward-delete{
      padding:11px 5px;
      border-radius:13px;
      font-weight:850;
    }

    .reward-use{
      background:var(--primary);
      color:#fff;
    }

    .reward-delete{
      background:#fff0f1;
      color:var(--red);
    }

    .history-item{
      display:flex;
      justify-content:space-between;
      gap:10px;
      background:var(--card);
      border:1px solid var(--border);
      border-radius:18px;
      padding:13px;
      margin-bottom:8px;
    }

    .history-main{
      min-width:0;
    }

    .history-name{
      font-weight:850;
    }

    .history-meta{
      color:var(--muted);
      font-size:11px;
      margin-top:4px;
    }

    .history-cost{
      font-weight:900;
      color:var(--red);
      white-space:nowrap;
    }

    .stars-empty{
      text-align:center;
      padding:25px;
      color:var(--muted);
    }

    @media(max-width:520px){

      .tabs .tab{
        font-size:12px;
        padding-left:5px;
        padding-right:5px;
      }

      .reward-actions{
        grid-template-columns:
          1fr 1fr 40px;
      }

    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   MOSTRAR RECOMPENSAS
   ========================================================= */

function mostrarRecompensas(){

  asegurarUIRecompensas();


  const ef=
    document.getElementById(
      "estrellasFacu"
    );

  const ej=
    document.getElementById(
      "estrellasJaz"
    );


  if(ef){

    ef.textContent=
      estrellas.Facu.toLocaleString(
        "es-UY",
        {
          maximumFractionDigits:1
        }
      )+" ⭐";
  }


  if(ej){

    ej.textContent=
      estrellas.Jaz.toLocaleString(
        "es-UY",
        {
          maximumFractionDigits:1
        }
      )+" ⭐";
  }


  const lista=
    document.getElementById(
      "listaRecompensas"
    );

  if(!lista) return;


  if(!recompensas.length){

    lista.innerHTML=
      '<div class="stars-empty">'+
      'Todavía no hay recompensas. 💕'+
      '</div>';

    return;
  }


  lista.innerHTML=
    recompensas.map(r=>`

      <div class="reward-card">

        <div class="reward-top">

          <div>

            <div class="reward-name">

              🎁
              ${escapeHTML(r.nombre)}

            </div>

            ${
              r.descripcion
              ?
              `
              <div class="reward-desc">
                ${escapeHTML(r.descripcion)}
              </div>
              `
              :
              ""
            }

          </div>


          <div class="reward-cost">

            ⭐ ${Number(r.costo)}

          </div>

        </div>


        <div class="reward-actions">

          <button
            class="reward-use"
            onclick="
              canjearRecompensa(
                '${r.id}',
                'Facu'
              )
            ">

            Usar Facu

          </button>


          <button
            class="reward-use"
            onclick="
              canjearRecompensa(
                '${r.id}',
                'Jaz'
              )
            ">

            Usar Jaz

          </button>


          <button
            class="reward-delete"
            onclick="
              eliminarRecompensa(
                '${r.id}'
              )
            ">

            🗑️

          </button>

        </div>

      </div>

    `).join("");


  const hist=
    document.getElementById(
      "historialRecompensas"
    );


  if(hist){

    hist.innerHTML=
      historialRecompensas.length

      ?

      historialRecompensas
        .slice(0,20)
        .map(h=>`

          <div class="history-item">

            <div class="history-main">

              <div class="history-name">

                ${escapeHTML(h.persona)}
                canjeó
                ${escapeHTML(
                  h.recompensa_nombre
                )}
                🎉

              </div>

              <div class="history-meta">

                ${fechaBonita(h.fecha)}

              </div>

            </div>


            <div class="history-cost">

              -⭐
              ${Number(
                h.estrellas_gastadas
              )}

            </div>

          </div>

        `).join("")

      :

      `
      <div class="stars-empty">
        Todavía no hay canjes. ⭐
      </div>
      `;
  }
}


/* =========================================================
   AGREGAR RECOMPENSA
   ========================================================= */

async function agregarRecompensa(){

  const nombre=
    document.getElementById(
      "rewardNombre"
    ).value.trim();

  const descripcion=
    document.getElementById(
      "rewardDescripcion"
    ).value.trim();

  const costo=
    Number(
      document.getElementById(
        "rewardCosto"
      ).value
    );


  if(!nombre){

    return alert(
      "Poné el nombre del favor."
    );
  }


  if(!costo || costo<1){

    return alert(
      "Poné un costo de estrellas válido."
    );
  }


  const {error}=
    await db
      .from("recompensas")
      .insert({
        nombre,
        descripcion:
          descripcion || null,
        costo
      });


  if(error){

    console.error(error);

    return alert(
      "No se pudo crear la recompensa."
    );
  }


  document.getElementById(
    "rewardNombre"
  ).value="";

  document.getElementById(
    "rewardDescripcion"
  ).value="";

  document.getElementById(
    "rewardCosto"
  ).value="";


  await cargarRecompensas();

  mostrarRecompensas();
}
async function eliminarRecompensa(id){
  const r=recompensas.find(x=>x.id===id);
  if(!r) return;

  if(!confirm("¿Querés eliminar la recompensa?\n\n"+r.nombre)) return;

  const {error}=await db.from("recompensas").delete().eq("id",id);

  if(error){
    console.error(error);
    return alert("No se pudo eliminar.");
  }

  await cargarRecompensas();
  mostrarRecompensas();
}


async function canjearRecompensa(id,persona){
  const r=recompensas.find(x=>x.id===id);
  if(!r) return;

  const saldo=Number(estrellas[persona]||0);
  const costo=Number(r.costo||0);

  if(saldo<costo){
    return alert(
      "A "+persona+" le faltan "+
      (costo-saldo).toLocaleString("es-UY",{
        maximumFractionDigits:1
      })+
      " ⭐ para canjear esto."
    );
  }

  if(!confirm(
    "¿Querés gastar "+costo+
    " ⭐ de "+persona+
    " para canjear:\n\n🎁 "+r.nombre+"?"
  )) return;

  const nuevoSaldo=saldo-costo;

  const {error:e1}=await db
    .from("estrellas_pareja")
    .update({estrellas:nuevoSaldo})
    .eq("persona",persona);

  if(e1){
    console.error(e1);
    return alert("No se pudieron descontar las estrellas.");
  }

  const {error:e2}=await db
    .from("historial_recompensas")
    .insert({
      recompensa_id:r.id,
      recompensa_nombre:r.nombre,
      persona:persona,
      estrellas_gastadas:costo
    });

  if(e2){
    console.error(e2);

    await db
      .from("estrellas_pareja")
      .update({estrellas:saldo})
      .eq("persona",persona);

    return alert(
      "No se pudo guardar el canje. "+
      "No se descontaron las estrellas."
    );
  }

  estrellas[persona]=nuevoSaldo;

  await cargarRecompensas();
  mostrarRecompensas();

  mostrarEstrellasToast(
    "🎉 "+persona+
    " canjeó "+r.nombre+
    " por ⭐ "+costo
  );
}


function mostrarEstrellasToast(texto){
  const c=document.getElementById("toastContainer");

  if(!c) return;

  const toast=document.createElement("div");

  toast.className="toast star-toast";

  toast.innerHTML=`
    <div class="toast-head">
      <div class="toast-icon">⭐</div>
      <div class="toast-title">
        ${escapeHTML(texto)}
      </div>
    </div>
  `;

  c.appendChild(toast);

  setTimeout(()=>{
    if(toast.parentNode){
      toast.classList.add("hide");

      setTimeout(()=>{
        toast.remove();
      },400);
    }
  },2800);
}


/* Iniciar la UI de recompensas antes de cargar los datos. */
asegurarUIRecompensas();
