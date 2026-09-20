export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({error:"Database is not configured yet"});
 try{
  const b=req.body||{};for(const k of ["id","date","slot","destination","merchant"])if(!b[k])return res.status(400).json({error:"Missing "+k});
  const r=await fetch(url+"/rest/v1/rpc/create_dudu_order",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_order_id:b.id,p_delivery_date:b.date,p_delivery_slot:b.slot,p_destination:b.destination,p_note:b.note||"",p_merchant:b.merchant})});
  const data=await r.json();if(!r.ok)return res.status(r.status).json({error:data});
  if(!data.ok)return res.status(409).json({error:"This delivery slot is full.",capacity:data.capacity,used:data.used});
  return res.status(201).json({ok:true,capacity:data.capacity,used:data.used});
 }catch(e){return res.status(500).json({error:"Order service error"});}
}