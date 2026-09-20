const capacityInput=document.querySelector("#slot-capacity-setting"),dateInput=document.querySelector("#schedule-date"),schedule=document.querySelector("#slot-schedule");
const orderTable=document.querySelector("#order-table"),refreshOrdersButton=document.querySelector("#refresh-orders"),robotList=document.querySelector("#robot-list");
const defaultCapacity=Number(localStorage.getItem("duduSlotCapacity")||4);capacityInput.value=defaultCapacity;
const today=new Date().toISOString().slice(0,10);dateInput.min=today;dateInput.value=today;

function bookings(){try{return JSON.parse(localStorage.getItem("duduSlotBookings")||"{}")}catch{return {}}}
async function remoteBookings(){
 try{const r=await fetch("../api/slots?date="+encodeURIComponent(dateInput.value));if(!r.ok)throw new Error();const d=await r.json();return d.counts||{}}
 catch(e){return null}
}
async function buildSchedule(){
 const cap=Math.max(1,Math.min(20,Number(capacityInput.value)||4));localStorage.setItem("duduSlotCapacity",cap);
 const remote=await remoteBookings(),data=remote||bookings(),slots=[];
 for(let h=11;h<=21;h++)for(let m=0;m<60;m+=15){
   if(h===21&&m>0)continue;
   const endH=h+(m===45?1:0),endM=(m+15)%60;
   const s=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+"–"+String(endH).padStart(2,"0")+":"+String(endM).padStart(2,"0");
   const used=data[s]||data[dateInput.value+"|"+s]||0;slots.push({s,used});
 }
 schedule.innerHTML=slots.map(x=>{const full=x.used>=cap;return `<div class="schedule-slot ${full?"full":""}"><div><strong>${x.s}</strong><span>${full?"FULL":"OPEN"}</span></div><div class="capacity-bar"><i style="width:${Math.min(100,(x.used/cap)*100)}%"></i></div><b>${x.used} / ${cap}</b></div>`}).join("");
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function statusClass(s){return s==="ON THE WAY"||s==="DELIVERING"?"delivery":s==="READY"?"ready":s==="ARRIVED"?"arrived":""}
function statusOptions(current){return ["ORDER","PREPARING","READY","LOADED","ON THE WAY","DELIVERING","ARRIVED","CANCELLED"].map(s=>`<option ${s===current?"selected":""}>${s}</option>`).join("")}
function robotClass(status){return status==="CHARGING"?"amber":status==="OFFLINE"?"muted":"green"}
function robotLabel(robot){
 const status=robot.status==="DELIVERING"?"Delivering":robot.status==="CHARGING"?"Charging":robot.status==="OFFLINE"?"Offline":"Available";
 return robot.order_id?status+" · "+robot.order_id:status+" · "+(robot.mode||"Ready");
}
async function loadRobots(){
 if(!robotList)return;
 try{
  const r=await fetch("../api/robots?ts="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error();
  const data=await r.json(),robots=data.robots||[];
  robotList.innerHTML=robots.map(robot=>`<div class="robot"><div class="robot-icon">D</div><div><strong>${esc(robot.robot_id)}</strong><span>${esc(robotLabel(robot))} · ${Number(robot.battery)}%</span></div><b class="${robotClass(robot.status)}">●</b></div>`).join("")||'<div class="order-empty">No robots configured.</div>';
 }catch(e){
  robotList.innerHTML='<div class="order-error">Fleet service unavailable. Run the fleet SQL setup first.</div>';
 }
}
async function loadOrders(){
 orderTable.innerHTML='<div class="order-loading">Loading live orders…</div>';
 try{
  const r=await fetch("../api/orders?limit=50");if(!r.ok)throw new Error("orders");
  const data=await r.json(),orders=data.orders||[];
  document.querySelector("#active-orders").textContent=orders.filter(o=>!["ARRIVED","CANCELLED"].includes(o.status)).length;
  if(!orders.length){orderTable.innerHTML='<div class="order-empty">No live orders yet. Create one from the customer app.</div>';return}
  orderTable.innerHTML=orders.map(o=>`<div class="live-order">
   <div class="live-order-main">
    <div class="order-top"><strong>${esc(o.order_id)}</strong><span>${esc(o.delivery_date)} · ${esc(o.delivery_slot)}</span></div>
    <div class="order-details"><b>${esc(o.merchant)}</b><span>${esc(o.destination)}</span>${o.note?`<span>Note: ${esc(o.note)}</span>`:""}</div>
   </div>
   <div class="order-controls">
    <select data-status="${esc(o.order_id)}" aria-label="Order status">${statusOptions(o.status)}</select>
    <select data-robot="${esc(o.order_id)}" aria-label="Assigned robot"><option value="">Unassigned</option><option ${o.assigned_robot==="DUDU-01"?"selected":""}>DUDU-01</option><option ${o.assigned_robot==="DUDU-02"?"selected":""}>DUDU-02</option><option ${o.assigned_robot==="DUDU-03"?"selected":""}>DUDU-03</option></select>
   </div>
  </div>`).join("");
  orderTable.querySelectorAll("[data-status]").forEach(el=>el.addEventListener("change",()=>updateOrder(el.dataset.status,el.value,undefined)));
  orderTable.querySelectorAll("[data-robot]").forEach(el=>el.addEventListener("change",()=>updateOrder(el.dataset.robot,undefined,el.value)));
 }catch(e){orderTable.innerHTML='<div class="order-error">Live order service is unavailable. Check the API deployment.</div>'}
}
async function updateOrder(id,status,robot){
 let token=sessionStorage.getItem("duduAdminToken");
 if(!token){token=prompt("Enter the DUDU Operations access token:");if(!token)return;sessionStorage.setItem("duduAdminToken",token)}
 const body={id};if(status!==undefined)body.status=status;if(robot!==undefined)body.assigned_robot=robot;
 const r=await fetch("../api/orders",{method:"PATCH",headers:{"Content-Type":"application/json","x-dudu-admin-token":token},body:JSON.stringify(body)});
 if(r.status===401){sessionStorage.removeItem("duduAdminToken");alert("Operations token is invalid.");return}
 if(!r.ok){alert("Could not update this order.");return}
 await loadOrders();
}
capacityInput.addEventListener("change",buildSchedule);dateInput.addEventListener("change",buildSchedule);refreshOrdersButton?.addEventListener("click",()=>{loadOrders();loadRobots()});
buildSchedule();loadOrders();loadRobots();setInterval(loadRobots,10000);