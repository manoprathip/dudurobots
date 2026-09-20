const merchants=[
 {name:"Go Spesa",type:"FOOD / RETAIL",category:"food",desc:"Food, drinks & everyday essentials",price:"€2.50 delivery"},
 {name:"Food Court",type:"FOOD",category:"food",desc:"Participating restaurants at Globo",price:"€2.50 delivery"},
 {name:"Café & Snacks",type:"FOOD",category:"food",desc:"Coffee, snacks & quick bites",price:"€2.00 delivery"},
 {name:"Globo Retail",type:"RETAIL",category:"retail",desc:"Selected products from participating shops",price:"€2.50 delivery"},
 {name:"Shop to Staff",type:"RETAIL",category:"retail",desc:"Move products between stores and staff areas",price:"€2.00 delivery"},
 {name:"Click & Collect",type:"RETAIL",category:"retail",desc:"Bring a ready order to your collection point",price:"€2.00 delivery"}
];
let cart=[];
const slotSelect=document.querySelector("#delivery-slot"),dateInput=document.querySelector("#delivery-date"),slotNote=document.querySelector("#slot-note"),slotCapacity=document.querySelector("#slot-capacity");
const SLOT_CAPACITY=4;
function slotKey(){return dateInput?.value+"|"+slotSelect?.value}
function getBookings(){try{return JSON.parse(localStorage.getItem("duduSlotBookings")||"{}")}catch{return {}}}
function setBookings(v){localStorage.setItem("duduSlotBookings",JSON.stringify(v))}
let remoteCounts={};
async function refreshRemoteSlots(){
  if(!dateInput?.value)return;
  try{const r=await fetch("../api/slots?date="+encodeURIComponent(dateInput.value));if(!r.ok)throw new Error();const data=await r.json();remoteCounts=data.counts||{};updateSlotNote()}catch(e){}
}
function getSlotCount(){return remoteCounts[slotKey()] ?? (getBookings()[slotKey()]||0)}
function buildSlots(){
 if(!slotSelect||!dateInput)return;
 const now=new Date(),today=now.toISOString().slice(0,10);
 dateInput.min=today;dateInput.value=today;
 const slots=[];
 for(let h=11;h<=21;h++){for(let m=0;m<60;m+=15){
   if(h===21&&m>0)continue;
   const endH=h+(m===45?1:0),endM=(m+15)%60;
   slots.push(String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+"–"+String(endH).padStart(2,"0")+":"+String(endM).padStart(2,"0"));
 }}
 slotSelect.innerHTML=slots.map(s=>'<option value="'+s+'">'+s+'</option>').join("");
 updateSlotNote()
}
function updateSlotNote(){
 if(!slotNote||!slotSelect||!dateInput)return;
 const used=getSlotCount(),remaining=Math.max(SLOT_CAPACITY-used,0);
 slotNote.textContent="Selected delivery: "+dateInput.value+" · "+slotSelect.value+".";
 if(slotCapacity){
   slotCapacity.textContent=remaining>0?remaining+" of "+SLOT_CAPACITY+" demo capacity remaining":"This slot is full. Please choose another time.";
   slotCapacity.classList.toggle("full",remaining===0);
 }
 if(place)place.disabled=!cart.length||remaining===0;
}
slotSelect?.addEventListener("change",()=>{updateSlotNote();refreshRemoteSlots()});
dateInput?.addEventListener("change",()=>{updateSlotNote();refreshRemoteSlots()});

const grid=document.querySelector("#merchant-grid"),items=document.querySelector("#cart-items"),total=document.querySelector("#cart-total"),count=document.querySelector("#cart-count"),place=document.querySelector("#place-order");
function renderMerchants(filter="all"){grid.innerHTML=merchants.filter(m=>filter==="all"||m.category===filter).map(m=>`<article class="merchant"><div><span class="merchant-type">${m.type}</span><h3>${m.name}</h3><p>${m.desc}</p></div><button data-add="${m.name}">Start an order <b>→</b><br><small>${m.price}</small></button></article>`).join("");grid.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(b.dataset.add))}
function add(name){cart.push({name,price:name==="Café & Snacks"?4.5:name==="Go Spesa"?12:8});renderCart();document.querySelector("#checkout").scrollIntoView({behavior:"smooth",block:"start"})}
function renderCart(){count.textContent=cart.length+" item"+(cart.length===1?"":"s");if(!cart.length){items.innerHTML='<p class="empty">Choose a restaurant or shop above.</p>';total.textContent="€0.00";place.disabled=true;return}items.innerHTML=cart.map((x,i)=>`<div class="cart-line"><span>${x.name}</span><strong>€${x.price.toFixed(2)} <button data-remove="${i}">×</button></strong></div>`).join("");total.textContent="€"+(cart.reduce((s,x)=>s+x.price,0)+2.5).toFixed(2);updateSlotNote();items.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);renderCart()})}
document.querySelectorAll(".category").forEach(b=>b.onclick=()=>{document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderMerchants(b.dataset.category)});
place.onclick=async()=>{
 const key=slotKey(),bookings=getBookings(),used=remoteCounts[key]??(bookings[key]||0);
 if(used>=SLOT_CAPACITY){updateSlotNote();return}
 const order={id:"DUDU-"+Math.floor(1000+Math.random()*8999),date:dateInput.value,slot:slotSelect.value,destination:document.querySelector("#destination").value,note:document.querySelector("#note").value,merchant:cart.map(x=>x.name).join(", "),createdAt:new Date().toISOString(),status:"ORDER"};
 try{
   const response=await fetch("../api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(order)});
   if(response.status===409){alert("This delivery slot is full. Please choose another slot.");await refreshRemoteSlots();return}
   if(!response.ok)throw new Error("API unavailable");
   const data=await response.json();remoteCounts[key]=data.used;
 }catch(e){
   alert("We could not confirm your order right now. Please try again.");
   console.error("DUDU order service unavailable.",e);
   return;
 }
 const orders=JSON.parse(localStorage.getItem("duduOrders")||"[]");orders.unshift(order);localStorage.setItem("duduOrders",JSON.stringify(orders.slice(0,100)));
 showTracking(order);
 document.querySelector("#tracking").scrollIntoView({behavior:"smooth"});
 updateSlotNote();
 startTracking(order.id);
};
const trackingCopy={
 ORDER:["Order received","Your order is confirmed and waiting for the store.","Order received"],
 PREPARING:["Order being prepared","The store is preparing your order.","Preparing"],
 READY:["Order ready","Your order is ready to be loaded into DUDU.","Ready"],
 LOADED:["Loaded into DUDU","Your order is secured inside DUDU.","Loaded"],
 "ON THE WAY":["DUDU on the way","DUDU is travelling to your destination.","On the way"],
 DELIVERING:["DUDU on the way","DUDU is travelling to your destination.","On the way"],
 ARRIVED:["Arrived","DUDU has arrived at your destination.","Delivered"],
 CANCELLED:["Order cancelled","This delivery has been cancelled.","Cancelled"]
};
let trackingTimer=null;
function showTracking(order){
 document.querySelector("#tracking").classList.remove("hidden");
 document.querySelector("#order-id").textContent=order.id;
 const state=trackingCopy[order.status]||trackingCopy.ORDER;
 document.querySelector("#tracking-title").textContent=state[0];
 document.querySelector("#tracking-copy").textContent=state[1];
 const orderEl=document.querySelector("#tracking-robot");
 if(orderEl)orderEl.textContent=order.assigned_robot?order.assigned_robot+" · "+state[2]:state[2];
 const steps=["ORDER","PREPARING","READY","LOADED","ON THE WAY","ARRIVED"];
 const statusIndex=order.status==="DELIVERING"?4:steps.indexOf(order.status);
 const idx=Math.max(statusIndex,0);
 document.querySelector("#progress-bar").style.width=((idx/(steps.length-1))*100)+"%";
 document.querySelectorAll("[data-track-step]").forEach((el,i)=>{
   el.classList.toggle("done",i<idx);
   el.classList.toggle("active-step",i===idx);
 });
}
async function refreshTracking(orderId){
 try{
   const r=await fetch("../api/orders?id="+encodeURIComponent(orderId),{cache:"no-store"});
   if(!r.ok)throw new Error("Tracking unavailable");
   const data=await r.json();
   if(data.order){
     showTracking(data.order);
     const orders=JSON.parse(localStorage.getItem("duduOrders")||"[]");
     const next=orders.map(o=>o.id===data.order.order_id?{...o,...data.order}:o);
     localStorage.setItem("duduOrders",JSON.stringify(next));
     if(data.order.status==="ARRIVED"||data.order.status==="CANCELLED"){
       if(trackingTimer){clearInterval(trackingTimer);trackingTimer=null}
     }
   }
 }catch(e){console.warn("DUDU tracking refresh failed.",e)}
}
function startTracking(orderId){
 if(trackingTimer)clearInterval(trackingTimer);
 refreshTracking(orderId);
 trackingTimer=setInterval(()=>refreshTracking(orderId),5000);
}
function restoreLatestTracking(){
 try{
   const orders=JSON.parse(localStorage.getItem("duduOrders")||"[]");
   if(orders[0]?.id){showTracking(orders[0]);startTracking(orders[0].id)}
 }catch(e){}
}
buildSlots();renderMerchants();renderCart();refreshRemoteSlots();
restoreLatestTracking();
