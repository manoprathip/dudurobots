export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).json({error:"Database is not configured yet"});
  try{
    const body=req.body||{};
    const required=["id","date","slot","destination","merchant"];
    for(const k of required) if(!body[k]) return res.status(400).json({error:"Missing "+k});
    const r=await fetch(url+"/rest/v1/dudu_orders",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({order_id:body.id,delivery_date:body.date,delivery_slot:body.slot,destination:body.destination,note:body.note||"",merchant:body.merchant,status:"ORDER"})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data});
    return res.status(201).json({order:data[0]});
  }catch(e){return res.status(500).json({error:"Order service error"});}
}