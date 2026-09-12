const demoOrders=[
{id:"DUDU-1001",customer:"Mohana",location:"Shop 24",items:"Big Mac Menu × 1",total:10.65,status:"new",time:"12:05"},
{id:"DUDU-1002",customer:"Marco",location:"Shop 18",items:"McChicken Menu × 1",total:10.50,status:"preparing",time:"12:08"},
{id:"DUDU-1003",customer:"Sara",location:"Shop 31",items:"9 Chicken McNuggets Menu × 1",total:9.90,status:"ready",time:"12:12"}
];
let orders=JSON.parse(localStorage.getItem("duduRestaurantOrders")||"null")||demoOrders;
const labels={new:"Accept & prepare",preparing:"Mark ready for DUDU",ready:"Mark picked up",completed:"Delivered"};
const next={new:"preparing",preparing:"ready",ready:"completed"};
function save(){localStorage.setItem("duduRestaurantOrders",JSON.stringify(orders))}
function move(id){const o=orders.find(x=>x.id===id);if(!o)return;o.status=next[o.status]||"completed";save();render();toast(o.id+" → "+o.status.replace("_"," "))}
function card(o){return `<article class="order"><div class="order-top"><span class="order-id">${o.id}</span><span class="time">${o.time}</span></div><div class="customer">${o.customer}</div><div class="location">📍 ${o.location}</div><div class="items">🍔 ${o.items}</div><div class="total">€${o.total.toFixed(2)}</div><div class="actions">${o.status!=="completed"?`<button onclick="move('${o.id}')">${labels[o.status]}</button>`:"<button class='secondary' disabled>Delivered ✓</button>"}</div></article>`}
function render(){for(const s of ["new","preparing","ready","completed"]){const box=document.getElementById(s);const list=orders.filter(o=>o.status===s);box.innerHTML=list.length?list.map(card).join(""):`<div class="empty">No orders</div>`}
document.getElementById("newCount").textContent=orders.filter(o=>o.status==="new").length;
document.getElementById("prepCount").textContent=orders.filter(o=>o.status==="preparing").length;
document.getElementById("readyCount").textContent=orders.filter(o=>o.status==="ready").length;
document.getElementById("doneCount").textContent=orders.filter(o=>o.status==="completed").length}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.remove("hidden");setTimeout(()=>x.classList.add("hidden"),1800)}
function tick(){document.getElementById("clock").textContent=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})}
render();tick();setInterval(tick,1000)
