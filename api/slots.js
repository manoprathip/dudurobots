export default async function handler(req,res){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) return res.status(503).json({error:"Database is not configured yet"});
  try{
    const date=req.query.date;
    if(!date) return res.status(400).json({error:"date is required"});
    const apiUrl=new URL("/rest/v1/dudu_orders",url.endsWith("/")?url:url+"/");
    apiUrl.searchParams.set("delivery_date","eq."+date);
    apiUrl.searchParams.set("select","delivery_slot");
    apiUrl.searchParams.set("status","not.eq.CANCELLED");
    const r=await fetch(apiUrl.toString(),{headers:{apikey:key,Authorization:"Bearer "+key}});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data});
    const counts={}; for(const row of data) counts[row.delivery_slot]=(counts[row.delivery_slot]||0)+1;
    return res.status(200).json({date,counts});
  }catch(e){return res.status(500).json({error:"Slot service error"});}
}