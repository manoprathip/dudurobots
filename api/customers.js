export default async function handler(req,res){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return res.status(503).json({error:"Database is not configured yet"});
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const b=req.body||{};
  const customer_id=String(b.customer_id||"").trim();
  const name=String(b.name||"").trim().slice(0,100);
  const phone=String(b.phone||"").trim().slice(0,40);
  const shop=String(b.shop||"").trim().slice(0,100);
  const photo_url=String(b.photo_url||"");
  const provider=String(b.provider||"pilot_profile").slice(0,40);
  if(!customer_id||!name||!phone||!shop)return res.status(400).json({error:"Name, phone and shop are required"});
  if(photo_url.length>450000)return res.status(400).json({error:"Profile photo is too large"});
  const apiUrl=new URL("/rest/v1/dudu_customers",url.endsWith("/")?url:"/");
  apiUrl.searchParams.set("on_conflict","customer_id");
  const r=await fetch(apiUrl.toString(),{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify({customer_id,name,phone,shop,photo_url,provider,updated_at:new Date().toISOString()})});
  const data=await r.json();
  if(!r.ok)return res.status(r.status).json({error:data});
  return res.status(200).json({customer:data[0]});
 }catch(e){return res.status(500).json({error:"Customer profile service error"});}
}