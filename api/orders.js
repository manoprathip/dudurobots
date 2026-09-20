export default async function handler(req,res){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({error:"Database is not configured yet"});
 const adminToken=process.env.DUDU_ADMIN_TOKEN;
 try{
  if(req.method==="GET"){
   const limit=Math.min(Math.max(Number(req.query?.limit||50),1),100);
   const apiUrl=new URL("/rest/v1/dudu_orders",url.endsWith("/")?url:url+"/");
   apiUrl.searchParams.set("select","id,order_id,delivery_date,delivery_slot,destination,note,merchant,status,assigned_robot,created_at,updated_at");
   apiUrl.searchParams.set("order","created_at.desc");
   apiUrl.searchParams.set("limit",String(limit));
   const r=await fetch(apiUrl.toString(),{
    headers:{apikey:key,Authorization:"Bearer "+key}
   });
   const data=await r.json(); if(!r.ok)return res.status(r.status).json({error:data});
   return res.status(200).json({orders:data});
  }
  if(req.method==="POST"){
   const b=req.body||{};
   for(const k of ["id","date","slot","destination","merchant"])if(!b[k])return res.status(400).json({error:"Missing "+k});
   const rpcUrl=new URL("/rest/v1/rpc/create_dudu_order",url.endsWith("/")?url:url+"/");
   const r=await fetch(rpcUrl.toString(),{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_order_id:b.id,p_delivery_date:b.date,p_delivery_slot:b.slot,p_destination:b.destination,p_note:b.note||"",p_merchant:b.merchant})});
   const data=await r.json(); if(!r.ok)return res.status(r.status).json({error:data});
   if(!data.ok)return res.status(409).json({error:"This delivery slot is full.",capacity:data.capacity,used:data.used});
   return res.status(201).json({ok:true,capacity:data.capacity,used:data.used});
  }
  if(req.method==="PATCH"){
   if(!adminToken || req.headers["x-dudu-admin-token"]!==adminToken)return res.status(401).json({error:"Operations authorization required"});
   const b=req.body||{},id=String(b.id||"").trim(),allowed=["ORDER","PREPARING","READY","LOADED","ON THE WAY","DELIVERING","ARRIVED","CANCELLED"];
   if(!id)return res.status(400).json({error:"Missing order id"});
   if(b.status && !allowed.includes(b.status))return res.status(400).json({error:"Invalid status"});
   const patch={updated_at:new Date().toISOString()};
   if(b.status)patch.status=b.status;
   if("assigned_robot" in b)patch.assigned_robot=b.assigned_robot||null;
   const patchUrl=new URL("/rest/v1/dudu_orders",url.endsWith("/")?url:url+"/");
   patchUrl.searchParams.set("order_id","eq."+id);
   const r=await fetch(patchUrl.toString(),{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(patch)});
   const data=await r.json(); if(!r.ok)return res.status(r.status).json({error:data});
   if(!data.length)return res.status(404).json({error:"Order not found"});
   return res.status(200).json({order:data[0]});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:"Order service error"});}
}