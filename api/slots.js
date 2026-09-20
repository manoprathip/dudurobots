export default async function handler(req,res){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).json({error:"Database is not configured yet"});
  try{
    const date=req.query.date;
    if(!date) return res.status(400).json({error:"date is required"});
    const r=await fetch(url+"/rest/v1/dudu_orders?delivery_date=eq."+encodeURIComponent(date)+"&select=delivery_slot&status=not.eq.CANCELLED",{headers:{apikey:key,Authorization:"Bearer "+key}});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data});
    const counts={}; for(const row of data) counts[row.delivery_slot]=(counts[row.delivery_slot]||0)+1;
    return res.status(200).json({date,counts});
  }catch(e){return res.status(500).json({error:"Slot service error"});}
}