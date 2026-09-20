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
   bookings[key]=used+1;setBookings(bookings);
   console.warn("DUDU backend not configured; using local demo booking.",e);
 }
 const orders=JSON.parse(localStorage.getItem("duduOrders")||"[]");orders.unshift(order);localStorage.setItem("duduOrders",JSON.stringify(orders.slice(0,100)));
 document.querySelector("#tracking").classList.remove("hidden");document.querySelector("#order-id").textContent=order.id;document.querySelector("#tracking-title").textContent="Order received";document.querySelector("#tracking-copy").textContent="Your order is confirmed for "+order.date+" · "+order.slot+".";document.querySelector("#tracking").scrollIntoView({behavior:"smooth"});updateSlotNote();
 let progress=25;const timer=setInterval(()=>{progress=Math.min(progress+25,100);document.querySelector("#progress-bar").style.width=progress+"%";const states=[["Order received","Your order is confirmed."],["Order being prepared","The store is preparing your order."],["Loaded into DUDU","Your order is secured inside DUDU."],["DUDU on the way","DUDU is travelling to your destination."],["Arrived","DUDU has arrived."]];const idx=Math.min(Math.floor(progress/25),4);document.querySelector("#tracking-title").textContent=states[idx][0];document.querySelector("#tracking-copy").textContent=states[idx][1];if(progress===100)clearInterval(timer)},3500);
};
buildSlots();renderMerchants();renderCart();refreshRemoteSlots();