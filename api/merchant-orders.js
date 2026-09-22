export default async function handler(req,res){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,merchantToken=process.env.DUDU_MERCHANT_TOKEN;
 if(!url||!key)return res.status(503).json({error:"Database is not configured yet"});
 if(!merchantToken)return res.status(503).json({error:"Merchant service is not configured yet"});
 if(req.headers["x-dudu-merchant-token"]!==merchantToken)return res.status(401).json({error:"Merchant authorization required"});
 try{
  const base=new URL("/rest/v1/dudu_orders",url.endsWith("/")?url:url+"/");
  if(req.method==="GET"){
   const merchant=String(req.query?.merchant||"").trim();
   if(!merchant)return res.status(400).json({error:"Missing merchant"});
   base.searchParams.set("select","order_id,delivery_date,delivery_slot,destination,note,merchant,status,assigned_robot,created_at,updated_at");
   base.searchParams.set("merchant","eq."+merchant);
   base.searchParams.set("order","created_at.asc");
   base.searchParams.set("limit","100");
   const r=await fetch(base.toString(),{headers:{apikey:key,Authorization:"Bearer "+key}});
   const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data});
   return res.status(200).json({orders:data});
  }
  if(req.method==="PATCH"){
   const b=req.body||{},id=String(b.id||"").trim(),merchant=String(b.merchant||"").trim();
   const allowed=["ORDER","PREPARING","READY"];
   if(!id||!merchant)return res.status(400).json({error:"Missing order id or merchant"});
   if(!allowed.includes(b.status))return res.status(400).json({error:"Merchant can only set ORDER, PREPARING or READY"});
   base.searchParams.set("order_id","eq."+id);
   base.searchParams.set("merchant","eq."+merchant);
   const r=await fetch(base.toString(),{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify({status:b.status,updated_at:new Date().toISOString()})});
   const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data});
   if(!data.length)return res.status(404).json({error:"Order not found for this merchant"});
   return res.status(200).json({order:data[0]});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:"Merchant service error"});}
}