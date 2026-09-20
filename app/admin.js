const orders=[
 ["#1048","Go Spesa","Food Court","ON THE WAY"],
 ["#1047","Food Court","Main Entrance","READY"],
 ["#1046","Globo Retail","Shop 42","PREPARING"],
 ["#1045","Click & Collect","Staff Area","DELIVERING"]
];
document.querySelector("#order-table").innerHTML=orders.map(o=>`<div class="order-row"><strong>${o[0]}</strong><strong>${o[1]}</strong><span>${o[2]}</span><b class="badge ${o[3]==="ON THE WAY"?"delivery":o[3]==="READY"?"ready":""}">${o[3]}</b></div>`).join("");