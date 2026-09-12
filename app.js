const restaurants=[
 {id:"demo1",name:"Restaurant Demo",icon:"🍔",desc:"Demo restaurant for the DUDU pilot.",tag:"DEMO MENU",
  menu:[["Classic Burger","Beef burger, salad & sauce",7.50],["Chicken Wrap","Chicken, salad & sauce",6.50],["Fries","Crispy fries",3.00]]},
 {id:"demo2",name:"Pizza Demo",icon:"🍕",desc:"Demo menu for testing the ordering flow.",tag:"DEMO MENU",
  menu:[["Margherita","Tomato, mozzarella & basil",7.00],["Prosciutto","Tomato, mozzarella & ham",8.50],["Water","Still water 50cl",1.50]]},
 {id:"demo3",name:"Café Demo",icon:"☕",desc:"Demo café for the DUDU pilot.",tag:"DEMO MENU",
  menu:[["Panino","Fresh sandwich",5.50],["Salad","Fresh mixed salad",6.00],["Coffee","Espresso",1.50]]}
];

let cart=JSON.parse(localStorage.getItem("duduCart")||"[]");
let orders=JSON.parse(localStorage.getItem("duduOrders")||"[]");
let currentRestaurant=null;

const $=s=>document.querySelector(s);
function money(n){return "€"+n.toFixed(2)}
function save(){localStorage.setItem("duduCart",JSON.stringify(cart));localStorage.setItem("duduOrders",JSON.stringify(orders));renderCartCount()}
function renderCartCount(){$("#cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0)}
function toast(t){$("#toast").textContent=t;$("#toast").classList.remove("hidden");setTimeout(()=>$("#toast").classList.add("hidden"),2200)}

function renderRestaurants(){
 $("#restaurants").innerHTML=restaurants.map(r=>`<article class="restaurant" data-id="${r.id}">
  <div class="restaurant-icon">${r.icon}</div><h3>${r.name}</h3><p>${r.desc}</p><span class="tag">${r.tag}</span>
 </article>`).join("");
 document.querySelectorAll(".restaurant").forEach(x=>x.onclick=()=>openMenu(x.dataset.id));
}
function openMenu(id){
 currentRestaurant=restaurants.find(r=>r.id===id);
 $("#menuTitle").textContent=currentRestaurant.name;
 $("#menuKicker").textContent="MENU · "+currentRestaurant.tag;
 $("#menuItems").innerHTML=currentRestaurant.menu.map((m,i)=>`<article class="menu-item">
  <div><h3>${m[0]}</h3><p>${m[1]}</p></div>
  <div><span class="price">${money(m[2])}</span><button class="add-btn" data-i="${i}">Add</button></div>
 </article>`).join("");
 $("#menuItems").querySelectorAll(".add-btn").forEach(b=>b.onclick=()=>addToCart(+b.dataset.i));
 $("#menuSection").classList.remove("hidden");$("#ordersSection").classList.add("hidden");window.scrollTo({top:0,behavior:"smooth"});
}
function addToCart(i){
 const m=currentRestaurant.menu[i];const key=currentRestaurant.id+"-"+i;
 const found=cart.find(x=>x.key===key);
 if(found) found.qty++; else cart.push({key,restaurantId:currentRestaurant.id,restaurant:currentRestaurant.name,name:m[0],price:m[2],qty:1});
 save();toast(m[0]+" added to cart");
}
function renderCart(){
 const box=$("#cartItems");
 if(!cart.length){box.innerHTML="<p>Your cart is empty.</p>";$("#cartTotal").textContent="€0.00";return}
 box.innerHTML=cart.map((x,i)=>`<div class="cart-row"><div><strong>${x.name}</strong><small>${x.restaurant} · ${money(x.price)}</small></div><div class="qty"><button onclick="changeQty(${i},-1)">−</button> ${x.qty} <button onclick="changeQty(${i},1)">+</button></div></div>`).join("");
 $("#cartTotal").textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0));
}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);save();renderCart()}
function openCart(){renderCart();$("#cartDrawer").classList.remove("hidden")}
function renderOrders(){
 const box=$("#ordersList");
 if(!orders.length){box.innerHTML="<div class='order-card'><strong>No orders yet.</strong><p>Place your first DUDU order.</p></div>";return}
 box.innerHTML=orders.map(o=>`<div class="order-card"><span class="status-pill">${o.status}</span><h3>Order ${o.id}</h3><p>${o.restaurant} · ${money(o.total)} · ${o.location}</p><small>${o.items.map(x=>x.name+" × "+x.qty).join(", ")}</small>
 <div class="steps">${["Received","Preparing","Picked up","Delivered"].map((s,i)=>`<div class="step ${i<=o.step?"done":""}" title="${s}"></div>`).join("")}</div></div>`).join("");
}
$("#cartBtn").onclick=openCart;
$("#closeCartBtn").onclick=()=>$("#cartDrawer").classList.add("hidden");
$("#ordersBtn").onclick=()=>{$("#menuSection").classList.add("hidden");$("#ordersSection").classList.remove("hidden");renderOrders();window.scrollTo({top:0,behavior:"smooth"})};
$("#closeOrdersBtn").onclick=()=>{$("#ordersSection").classList.add("hidden");window.scrollTo({top:0,behavior:"smooth"})};
$("#backBtn").onclick=()=>{$("#menuSection").classList.add("hidden");window.scrollTo({top:0,behavior:"smooth"})};
$("#checkoutForm").onsubmit=e=>{
 e.preventDefault();if(!cart.length)return;
 const f=new FormData(e.target),total=cart.reduce((a,x)=>a+x.price*x.qty,0);
 orders.unshift({id:String(Date.now()).slice(-6),name:f.get("name"),location:f.get("location"),restaurant:cart[0].restaurant,total,items:cart.map(x=>({...x})),status:"Received",step:0});
 cart=[];save();e.target.reset();$("#cartDrawer").classList.add("hidden");$("#menuSection").classList.add("hidden");$("#ordersSection").classList.remove("hidden");renderOrders();toast("Order received by DUDU");window.scrollTo({top:0,behavior:"smooth"});
};
renderRestaurants();renderCartCount();
