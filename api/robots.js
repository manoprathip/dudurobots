export default async function handler(req,res){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,adminToken=process.env.DUDU_ADMIN_TOKEN;
 if(!url||!key)return res.status(503).json({error:"Database is not configured yet"});
 try{
  const apiUrl=new URL("/rest/v1/dudu_robots",url.endsWith("/")?url:url+"/");
  if(req.method==="GET"){
   apiUrl.searchParams.set("select","robot_id,name,status,battery,mode,order_id,last_seen,updated_at");
   apiUrl.searchParams.set("order","robot_id.asc");
   const r=await fetch(apiUrl.toString(),{headers:{apikey:key,Authorization:"Bearer "+key}});
   const data=await r.json(); if(!r.ok)return res.status(r.status).json({error:data});
   return res.status(200).json({robots:data});
  }
  if(req.method==="PATCH"){
   if(!adminToken||req.headers["x-dudu-admin-token"]!==adminToken)return res.status(401).json({error:"Operations authorization required"});
   const b=req.body||{},id=String(b.robot_id||"").trim();
   const allowed=["AVAILABLE","DELIVERING","CHARGING","OFFLINE","PAUSED"];
   if(!id)return res.status(400).json({error:"Missing robot id"});
   if(b.status&&!allowed.includes(b.status))return res.status(400).json({error:"Invalid robot status"});
   const patch={updated_at:new Date().toISOString(),last_seen:new Date().toISOString()};
   if("status" in b)patch.status=b.status;
   if("battery" in b)patch.battery=Math.max(0,Math.min(100,Number(b.battery)));
   if("mode" in b)patch.mode=String(b.mode||"");
   if("order_id" in b)patch.order_id=b.order_id||null;
   apiUrl.searchParams.set("robot_id","eq."+id);
   const r=await fetch(apiUrl.toString(),{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(patch)});
   const data=await r.json(); if(!r.ok)return res.status(r.status).json({error:data});
   if(!data.length)return res.status(404).json({error:"Robot not found"});
   return res.status(200).json({robot:data[0]});
  }
  return res.status(405).json({error:"Method not allowed"});
 }catch(e){return res.status(500).json({error:"Fleet service error"});}
}