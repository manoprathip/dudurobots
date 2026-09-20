const orders=[["#1048","Go Spesa","Food Court","ON THE WAY"],["#1047","Food Court","Main Entrance","READY"],["#1046","Globo Retail","Shop 42","PREPARING"],["#1045","Click & Collect","Staff Area","DELIVERING"]];
document.querySelector("#order-table").innerHTML=orders.map(o=>`<div class="order-row"><strong>${o[0]}</strong><strong>${o[1]}</strong><span>${o[2]}</span><b class="badge ${o[3]==="ON THE WAY"?"delivery":o[3]==="READY"?"ready":""}">${o[3]}</b></div>`).join("");
const capacityInput=document.querySelector("#slot-capacity-setting"),dateInput=document.querySelector("#schedule-date"),schedule=document.querySelector("#slot-schedule");
const defaultCapacity=Number(localStorage.getItem("duduSlotCapacity")||4);capacityInput.value=defaultCapacity;
const today=new Date().toISOString().slice(0,10);dateInput.min=today;dateInput.value=today;
function bookings(){try{return JSON.parse(localStorage.getItem("duduSlotBookings")||"{}")}catch{return {}}}
async function remoteBookings(){
 try{const r=await fetch("../api/slots?date="+encodeURIComponent(dateInput.value));if(!r.ok)throw new Error();const d=await r.json();return d.counts||{}}
 catch(e){return null}
}
async function buildSchedule(){
 const cap=Math.max(1,Math.min(20,Number(capacityInput.value)||4));localStorage.setItem("duduSlotCapacity",cap);
 const remote=await remoteBookings(); const data=remote||bookings(),slots=[];
 for(let h=11;h<=21;h++){for(let m=0;m<60;m+=15){if(h===21&&m>0)continue;const endH=h+(m===45?1:0),endM=(m+15)%60;const s=String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+"–"+String(endH).padStart(2,"0")+":"+String(endM).padStart(2,"0");const used=data[dateInput.value+"|"+s]||0;slots.push({s,used})}}
 schedule.innerHTML=slots.map(x=>{const full=x.used>=cap;return `<div class="schedule-slot ${full?"full":""}"><div><strong>${x.s}</strong><span>${full?"FULL":"OPEN"}</span></div><div class="capacity-bar"><i style="width:${Math.min(100,(x.used/cap)*100)}%"></i></div><b>${x.used} / ${cap}</b></div>`}).join("");
}
capacityInput.addEventListener("change",buildSchedule);dateInput.addEventListener("change",buildSchedule);buildSchedule();