"use strict";
const PK="pokemonScannerProducts", MK="pokemonScannerMeta", ZIP_DEFAULT="76040";
const TARGET_KEY="9f36aeafbe60771e321a7cc95a78140772ab3e96", TARGET_STORE="1368", TARGET_VISITOR_ID=crypto.randomUUID().replace(/-/g,"");
const TARGET_HEADERS={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36","Accept":"application/json, text/plain, */*","Accept-Language":"en-US,en;q=0.9","Origin":"https://www.target.com","Referer":"https://www.target.com/","redsky-client-name":"browse","redsky-client-version":"1.0.0"};
const COSTCO_HEADERS={"Content-Type":"application/json","Accept":"application/json","client_id":"USBC","client-identifier":"168287ea-1201-45f6-9b45-5bbea49f8ee7","searchresultprovider":"GRS","locale":"en-US","Origin":"https://www.costco.com","Referer":"https://www.costco.com/","User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36"};
const DISCOVERY="pokemon-scan-discovery", STOCK="pokemon-scan-stock";
const INC=["pokemon tcg","pokemon trading card","trading card game","booster pack","booster bundle","booster box","booster display","elite trainer box","trainer box","etb","collection box","premium collection","ultra premium collection","special collection","collector chest","mini tin","tin","blister","pokemon cards","trading cards","30th anniversary","30th celebration"];
const EXC=["cake","cookie","cupcake","costume","coloring","activity book","storybook","plush","stuffed animal","toy figure","figurine","puzzle","backpack","clothing","shirt","nintendo switch","video game","dvd","movie","snack","candy","cereal","bedding","blanket","shoe","sock"];
const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
const clean=v=>String(v||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
function tcg(n){const v=norm(n);return !!v&&v.includes("pokemon")&&!EXC.some(x=>v.includes(x))&&INC.some(x=>v.includes(norm(x)))}
function specific(n){return !["pokemon tcg","pokemon trading cards","pokemon trading card","pokemon cards","trading cards","trading card game"].includes(norm(n))}
function price(v){if(v==null||v==="")return null;if(typeof v==="number")return "$"+v.toFixed(2);const s=String(v).trim();return s?(s.startsWith("$")?s:(/^\d+(\.\d{1,2})?$/.test(s)?"$"+s:s)):null}
function urlFor(store,id,url){if(url&&/^https?:\/\//i.test(String(url)))return String(url).split("#")[0];if(store==="Target"&&id)return "https://www.target.com/p/-/A-"+id;if(store==="Costco"&&id)return "https://www.costco.com/.product."+id+".html";if(store==="Sam's Club"&&id)return "https://www.samsclub.com/ip/-/"+id;return url||""}
async function state(){const d=await chrome.storage.local.get([PK,MK]);return {p:d[PK]||{},m:d[MK]||{}}}
async function save(p,m){await chrome.storage.local.set({[PK]:p,[MK]:m})}
async function alertUser(title,p,detail){try{await chrome.notifications.create("ptcg-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),{type:"basic",iconUrl:"icon.svg",title:title,message:(p.store+": "+p.name+(p.price?" · "+p.price:"")+"\n"+(detail||p.url||"")).slice(0,240),priority:2})}catch(e){console.warn("Notification failed",String(e))}}
function inspectResponseShape(root){
 const arrays=[],examples=[],seen=new Set();
 function visit(v,path,depth){
  if(!v||typeof v!=="object"||seen.has(v)||depth>7)return;
  seen.add(v);
  if(Array.isArray(v)){
   if(arrays.length<24)arrays.push({path,length:v.length,firstItemKeys:v[0]&&typeof v[0]==="object"?Object.keys(v[0]).slice(0,24):[]});
   for(let i=0;i<Math.min(v.length,10);i++)visit(v[i],path+"["+i+"]",depth+1);
   return;
  }
  const keys=Object.keys(v),name=clean(v.name||v.productName||v.displayName||v.title||v.productTitle||v.product_description?.title||v.product_description?.product_title);
  const id=v.productId||v.itemId||v.itemNumber||v.productNumber||v.tcin||v.id||v.sku;
  if(name&&id&&examples.length<10)examples.push({path,name:name.slice(0,140),id:String(id),keys:keys.slice(0,20)});
  for(const [k,val] of Object.entries(v))if(val&&typeof val==="object")visit(val,path+"."+k,depth+1);
 }
 visit(root,"$",0);
 return {rootKeys:root&&typeof root==="object"?Object.keys(root).slice(0,40):[],arrays,identifiedRecords:examples};
}
async function json(url,opts,trace){
 const started=Date.now();
 if(trace){try{const u=new URL(url);trace.endpoint=u.host+u.pathname}catch{}}
 const r=await fetch(url,{cache:"no-store",...opts}),t=await r.text();
 if(trace){trace.httpStatus=r.status;trace.httpOk=r.ok;trace.durationMs=Date.now()-started;trace.responseBytes=t.length;trace.contentType=r.headers.get("content-type")||""}
 const challenge=/captcha|recaptcha|hcaptcha|verify (that )?you are (a )?human|not a robot|robot check|unusual traffic|security challenge|access denied/i.test(t.slice(0,18000));
 if((r.status===403||r.status===429||challenge)&&/target\.com|costco\.com|samsclub\.com/i.test(url)){
  let store=/target\.com/i.test(url)?"Target":/costco\.com/i.test(url)?"Costco":"Sam's Club";
  void recordCaptcha({store,url,title:"Retailer API request blocked",evidence:"HTTP "+r.status+(challenge?" with a CAPTCHA/anti-bot challenge response":"; human verification may be required"),detectedAt:new Date().toISOString()},{});
 }
 if(!r.ok)throw Error("HTTP "+r.status+" "+t.slice(0,90));
 try{const data=JSON.parse(t);if(trace)trace.responseShape=inspectResponseShape(data);return data}catch(e){if(trace)trace.parseError=String(e);throw Error("Expected JSON: "+t.slice(0,70))}
}
function key(p){return p.store+":"+String(p.id||p.url||norm(p.name))}
function targetSearchUrl(term,purchasable){const page="/s/"+String(term||"").trim().replace(/\s+/g," ");const q=new URLSearchParams({key:TARGET_KEY,keyword:term,channel:"WEB",page,visitor_id:TARGET_VISITOR_ID,pricing_store_id:TARGET_STORE,store_ids:TARGET_STORE,scheduled_delivery_store_id:TARGET_STORE,zip:ZIP_DEFAULT,default_purchasability_filter:String(purchasable),include_sponsored:"false",platform:"desktop",count:"24",offset:"0"});return "https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?"+q}
async function targetDiscovery(){
 const {p,m}=await state(),found=new Map();let successful=0,raw=0;const errors=[],sampleNames=[],requestLog=[];let sampleShape=null;
 for(const term of ["pokemon booster pack","pokemon tcg","pokemon elite trainer box","pokemon trading cards"]){
  const trace={query:term,phase:"search",at:new Date().toISOString()};const foundBefore=found.size;let queryCandidates=0;
  try{
   const d=await json(targetSearchUrl(term,false),{headers:TARGET_HEADERS},trace);successful++;
   const rows=d?.data?.search?.products||[];raw+=rows.length;trace.rawRows=rows.length;
   if(rows.length&&!sampleShape)sampleShape={rowKeys:Object.keys(rows[0]||{}),itemKeys:Object.keys(rows[0]?.item||{}),descriptionKeys:Object.keys(rows[0]?.item?.product_description||{}),apiShape:trace.responseShape};
   trace.sampleNames=[];
   for(const x of rows){
    const name=clean(x?.item?.product_description?.title||x?.item?.product_description?.product_title);
    if(name&&sampleNames.length<8&&!sampleNames.includes(name))sampleNames.push(name);
    if(name&&trace.sampleNames.length<5)trace.sampleNames.push(name);
    const id=String(x?.tcin||"");
    if(!id||!tcg(name)||!specific(name))continue;
    queryCandidates++;found.set(id,{store:"Target",id,name,url:urlFor("Target",id,x?.item?.enrichment?.buy_url),price:price(x?.price?.formatted_current_price||x?.price?.current_retail),available:null});
   }
   trace.keywordMatches=rows.filter(x=>norm(x?.item?.product_description?.title||x?.item?.product_description?.product_title).includes("pokemon")).length;
   trace.candidates=queryCandidates;trace.uniqueCandidates=found.size-foundBefore;trace.status=rows.length?(trace.candidates?"MATCHED":"FILTERED"):"EMPTY";
  }catch(e){trace.error=String(e);trace.status="ERROR";errors.push(term+": "+String(e));console.warn("Target discovery "+term+": "+String(e))}
  requestLog.push(trace);
 }
 await merge("Target",[...found.values()],p,m,successful>0);m.lastScan=m.lastScan||{};
 m.lastScan.Target={...(m.lastScan.Target||{}),at:new Date().toISOString(),candidates:found.size,rawCandidates:raw,successfulRequests:successful,failedRequests:errors.length,status:errors.length?(successful?"partial":"error"):(found.size?"ok":raw?"filtered":"empty"),errors,sampleNames,sampleShape,requestLog};
 await save(p,m);return {found:found.size,raw,successful,errors,sampleNames,sampleShape,requestLog}
}
async function targetStock(){
 const {p,m}=await state(), rows=Object.values(p).filter(x=>x.store==="Target"&&x.id);let checked=0;
 for(let i=0;i<rows.length;i+=24){const batch=rows.slice(i,i+24);try{const q=new URLSearchParams({key:TARGET_KEY,tcins:batch.map(x=>x.id).join(","),store_id:TARGET_STORE,pricing_store_id:TARGET_STORE,scheduled_delivery_store_id:TARGET_STORE,zip:ZIP_DEFAULT,channel:"WEB"});const d=await json("https://redsky.target.com/redsky_aggregations/v1/web/product_summary_with_fulfillment_v1?"+q,{headers:TARGET_HEADERS});const map=new Map((d?.data?.product_summaries||[]).filter(x=>x?.tcin!=null).map(x=>[String(x.tcin),x]));for(const x of batch){const s=map.get(String(x.id));if(!s)continue;const f=s.fulfillment||{}, ship=String(f.shipping_options?.availability_status||"").toUpperCase(), opts=Array.isArray(f.store_options)?f.store_options:[],pickup=opts.some(o=>String(o.order_pickup?.availability_status||"").toUpperCase()==="IN_STOCK"),instore=opts.some(o=>String(o.in_store_only?.availability_status||"").toUpperCase()==="IN_STOCK"),available=["IN_STOCK","PRE_ORDER_SELLABLE","LIMITED_STOCK"].includes(ship)||pickup||instore;x.shippingStatus=ship;x.pickupAvailable=pickup;x.inStoreAvailable=instore;x.lastChecked=new Date().toISOString();await availability(x,available);checked++}}catch(e){console.warn("Target stock batch: "+String(e))}}
 m.lastStockRun={at:new Date().toISOString(),tracked:rows.length,checked:checked};await save(p,m);return {tracked:rows.length,checked}
}
function costcoStatus(v){const a=Object.entries(v||{}).filter(([k])=>/availability/i.test(k)).flatMap(([,x])=>Array.isArray(x)?x:[x]).map(x=>String(x||"").toUpperCase());if(a.some(x=>/IN_STOCK|LOW_STOCK|AVAILABLE|SELLABLE/.test(x)))return true;if(a.some(x=>/OUT_OF_STOCK|UNAVAILABLE|SOLD_OUT|NOT_AVAILABLE/.test(x)))return false;return null}
async function costcoScan(){
 const {p,m}=await state(),found=new Map(),terms=["pokemon","pokemon trading cards","pokemon booster","pokemon elite trainer","pokemon collection","pokemon trading card game","pokemon 30th anniversary","pokemon 30th celebration","pokemon ultra premium collection","pokemon etb booster bundle"];let successful=0,raw=0;const errors=[],sampleNames=[],requestLog=[];let sampleShape=null;
 for(const term of terms){
  const trace={query:term,phase:"search",at:new Date().toISOString()};const foundBefore=found.size;
  try{
   const d=await json("https://gdx-api.costco.com/catalog/search/api/v1/search",{method:"POST",headers:COSTCO_HEADERS,body:JSON.stringify({visitorId:"0000000000000000000000000000000000",query:term,pageSize:96,offset:0,orderBy:null,searchMode:"page",personalizationEnabled:false,warehouseId:"129-wh",shipToPostal:ZIP_DEFAULT,shipToState:"TX",deliveryLocations:["129-wh"],filterBy:[],pageCategories:[]})},trace);
   successful++;const rows=d?.searchResult?.results||[];raw+=rows.length;trace.rawRows=rows.length;
   if(rows.length&&!sampleShape)sampleShape={rowKeys:Object.keys(rows[0]||{}),productKeys:Object.keys(rows[0]?.product||{}),apiShape:trace.responseShape};
   trace.sampleNames=[];
   for(const row of rows){
    const x=row?.product||{},name=clean(x.title||x.name);
    if(name&&sampleNames.length<8&&!sampleNames.includes(name))sampleNames.push(name);
    if(name&&trace.sampleNames.length<5)trace.sampleNames.push(name);
    const id=String(row.id||x.id||x.itemNumber||"");
    if(!id||!tcg(name)||!specific(name))continue;
    queryCandidates++;const vals=Object.entries(row.variantRollupValues||{}).filter(([k])=>/(^|,)price$|originalPrice/i.test(k)).flatMap(([,v])=>Array.isArray(v)?v:[v]).filter(v=>v!=null&&v!=="");
    found.set(id,{store:"Costco",id,name,url:urlFor("Costco",id,x.uri||x.url),price:price(vals[0]),available:costcoStatus(row.variantRollupValues)});
   }
   trace.keywordMatches=rows.filter(row=>norm(row?.product?.title||row?.product?.name).includes("pokemon")).length;trace.candidates=queryCandidates;trace.uniqueCandidates=found.size-foundBefore;trace.status=rows.length?(trace.candidates?"MATCHED":"FILTERED"):"EMPTY";
  }catch(e){trace.error=String(e);trace.status="ERROR";errors.push(term+": "+String(e));console.warn("Costco query "+term+": "+String(e))}
  requestLog.push(trace);
 }
 await merge("Costco",[...found.values()],p,m,successful>0);m.lastScan=m.lastScan||{};
 m.lastScan.Costco={...(m.lastScan.Costco||{}),at:new Date().toISOString(),candidates:found.size,rawCandidates:raw,successfulRequests:successful,failedRequests:errors.length,status:errors.length?(successful?"partial":"error"):(found.size?"ok":raw?"filtered":"empty"),errors,sampleNames,sampleShape,requestLog};
 await save(p,m);return {found:found.size,raw,successful,errors,sampleNames,sampleShape,requestLog}
}
function walk(v,fn,seen){if(!v||typeof v!=="object"||seen.has(v))return;seen.add(v);if(Array.isArray(v)){v.forEach(x=>walk(x,fn,seen));return}fn(v);Object.values(v).forEach(x=>{if(x&&typeof x==="object")walk(x,fn,seen)})}
async function samsScan(){
 const {p,m}=await state();if(!m.samsVisitorId)m.samsVisitorId=crypto.randomUUID().replace(/-/g,"");
 let successful=0,rawObjects=0;const errors=[],sampleNames=[],requestLog=[];let sampleShape=null;
 const q=new URLSearchParams({sourceType:"1",limit:"45",clubId:"",searchCategoryId:"16860219",br:"true",secondaryResults:"2",wmsponsored:"1",wmsba:"true",wmVideo:"true"});
 const found=new Map(),trace={query:"browse category 16860219",phase:"search",at:new Date().toISOString()};
 try{
  const d=await json("https://www.samsclub.com/api/node/vivaldi/browse/v2/products/search?"+q,{headers:{Accept:"application/json, text/plain, */*","Accept-Language":"en-US,en;q=0.9",Referer:"https://www.samsclub.com/browse/pokemon/16860219",visitorId:m.samsVisitorId}},trace);
  successful++;sampleShape=trace.responseShape;trace.rawObjects=0;trace.sampleNames=[];
  const productRecords=Array.isArray(d?.payload?.records)?d.payload.records:[];
  trace.productRecordCount=productRecords.length;
  trace.productRecordSamples=productRecords.slice(0,8).map(r=>{
   const scalarFields=o=>Object.fromEntries(Object.entries(o||{}).filter(([,v])=>v==null||["string","number","boolean"].includes(typeof v)).map(([k,v])=>[k,typeof v==="string"?v.slice(0,140):v]));
   return {keys:Object.keys(r||{}),productId:r?.productId??null,id:r?.id??null,descriptorsKeys:Object.keys(r?.descriptors||{}),descriptorsScalars:scalarFields(r?.descriptors),searchAndSeoKeys:Object.keys(r?.searchAndSeo||{}),searchAndSeoScalars:scalarFields(r?.searchAndSeo),skuCount:Array.isArray(r?.skus)?r.skus.length:0,firstSkuKeys:Object.keys(r?.skus?.[0]||{}),firstSkuDescriptorKeys:Object.keys(r?.skus?.[0]?.descriptors||{}),firstSkuDescriptorScalars:scalarFields(r?.skus?.[0]?.descriptors)};
  });
  walk(d,v=>{
   rawObjects++;trace.rawObjects++;
   const name=clean(v.name||v.productName||v.displayName||v.title||v.productTitle);
   if(name&&sampleNames.length<10&&!sampleNames.includes(name))sampleNames.push(name);
   if(name&&trace.sampleNames.length<10&&!trace.sampleNames.includes(name))trace.sampleNames.push(name);
   const id=String(v.productId||v.itemId||v.itemNumber||v.sku||v.productNumber||v.id||""),raw=v.itemPageUrl||v.productUrl||v.url||v.productURL||v.link;
   if(!id||!tcg(name)||!specific(name))return;
   found.set(id,{store:"Sam's Club",id,name,url:urlFor("Sam's Club",id,raw),price:price(v.price?.amount??v.price??v.currentPrice),available:null});
  },new Set());
  trace.candidates=found.size;trace.status=found.size?"MATCHED":rawObjects?"FILTERED":"EMPTY";
 }catch(e){trace.error=String(e);trace.status="ERROR";errors.push("search: "+String(e));console.warn("Sam's Club search failed: "+String(e))}
 requestLog.push(trace);
 if(found.size){
  const invTrace={query:"inventory details for matched products",phase:"inventory",at:new Date().toISOString()};
  try{
   const d=await json("https://www.samsclub.com/api/node/vivaldi/browse/v2/products",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/plain, */*"},body:JSON.stringify({productIds:[...found.keys()],type:"LARGE",clubId:""})},invTrace);
   const inv=new Map();walk(d,v=>{const id=String(v.productId||v.itemId||v.id||""),s=String(v.skus?.onlineoffer?.inventory?.status||v.onlineoffer?.inventory?.status||v.inventory?.status||"");if(id&&s)inv.set(id,s)},new Set());
   invTrace.rawObjects=inv.size;invTrace.status="OK";
   for(const [id,x] of found){const s=inv.get(id)||"";if(/IN.?STOCK|AVAILABLE|SELLABLE/i.test(s))x.available=true;else if(/OUT.?OF.?STOCK|UNAVAILABLE|SOLD.?OUT/i.test(s))x.available=false;if(s)x.inventoryStatus=s}
  }catch(e){invTrace.error=String(e);invTrace.status="ERROR";errors.push("inventory: "+String(e));console.warn("Sam's Club inventory: "+String(e))}
  requestLog.push(invTrace);
 }
 await merge("Sam's Club",[...found.values()],p,m,successful>0);m.lastScan=m.lastScan||{};
 m.lastScan["Sam's Club"]={...(m.lastScan["Sam's Club"]||{}),at:new Date().toISOString(),candidates:found.size,successfulRequests:successful,failedRequests:errors.length,status:errors.length?(successful?"partial":"error"):(found.size?"ok":rawObjects?"filtered":"empty"),errors,rawObjects,sampleNames,sampleShape,requestLog};
 await save(p,m);return {found:found.size,successful,errors,rawObjects,sampleNames,sampleShape,requestLog}
}
async function merge(store,items,p,m,scanSucceeded=true){const first=!m.baselined?.[store];m.baselined=m.baselined||{};for(const x of items){const k=key(x),old=p[k];if(!old){const now=new Date().toISOString();p[k]={...x,firstSeen:now,lastSeen:now,lastChecked:now,lastRestock:x.available===true?now:null,lastSellout:null};if(!first)await alertUser(x.available===true?"Pokémon TCG availability detected":"New Pokémon TCG listing",p[k],x.available===true?"Retailer indicates available; verify the product page.":x.url);continue}old.name=x.name||old.name;old.url=x.url||old.url;if(x.price)old.price=x.price;old.lastSeen=new Date().toISOString();if(x.available===true||x.available===false)await availability(old,x.available)}m.baselined=m.baselined||{};if(scanSucceeded)m.baselined[store]=true;m.lastScan=m.lastScan||{};m.lastScan[store]={at:new Date().toISOString(),candidates:items.length,baseline:first&&scanSucceeded,status:scanSucceeded?(items.length?"ok":"empty"):"error"}}
async function availability(p,next){if(next!==true&&next!==false)return;const prev=p.available;p.available=next;p.lastChecked=new Date().toISOString();if(prev===false&&next===true){p.lastRestock=p.lastChecked;await alertUser("Pokémon TCG RESTOCK",p,"Retailer availability changed to available. Verify immediately.")}else if(prev===true&&next===false){p.lastSellout=p.lastChecked;await alertUser("Pokémon TCG sold out",p,"Retailer availability changed to unavailable.")}else if((prev===null||prev===undefined)&&next===true&&p.firstSeen!==p.lastChecked){await alertUser("Pokémon TCG availability detected",p,"Retailer indicates available; verify immediately.")}}
async function discover(){
 const results={};console.info('[PTCG] Discovery cycle started');
 for(const [name,fn] of [["Target",targetDiscovery],["Costco",costcoScan],["Sam\u0027s Club",samsScan]]){
  const started=Date.now();try{results[name]=await fn()}catch(e){results[name]={error:String(e)};console.error('[PTCG]['+name+'] scan failed',e)}
  const {p,m}=await state();m.lastScan=m.lastScan||{};const x=m.lastScan[name]||{};
  x.method=x.method||(name==="Target"?"Target RedSky product search API":name==="Costco"?"Costco GDX catalog search API":"Sam\u0027s Club Vivaldi browse/search API");
  x.endpoint=x.endpoint||(name==="Target"?"redsky.target.com/redsky_aggregations/v1/web/plp_search_v2":name==="Costco"?"gdx-api.costco.com/catalog/search/api/v1/search":"samsclub.com/api/node/vivaldi/browse/v2/products/search");m.lastScan[name]=x;
  m.scanLog=[...(m.scanLog||[]),{store:name,phase:"discovery summary",status:x.status|| (results[name]?.error?"ERROR":"UNKNOWN"),method:x.method,endpoint:x.endpoint,rawRows:x.rawCandidates,rawObjects:x.rawObjects,candidates:x.candidates||0,at:new Date().toISOString(),error:results[name]?.error||x.errors?.join("; ")||""}].slice(-200);await save(p,m);
  console.info('[PTCG]['+name+'] scan result',results[name]);
 }
 const {p,m}=await state();m.lastDiscoveryRun={at:new Date().toISOString(),results};await save(p,m);console.info('[PTCG] Discovery cycle finished',results);return results
}
async function stock(){let result={};try{result.Target=await targetStock()}catch(e){result.Target={error:String(e)}}const {p,m}=await state();m.lastStockRun={at:new Date().toISOString(),result};await save(p,m);return result}
function schedule(){chrome.alarms.create(DISCOVERY,{delayInMinutes:0.2,periodInMinutes:5});chrome.alarms.create(STOCK,{delayInMinutes:0.5,periodInMinutes:3})}
chrome.runtime.onInstalled.addListener(schedule);chrome.runtime.onStartup.addListener(schedule);
chrome.alarms.onAlarm.addListener(a=>{if(a.name===DISCOVERY)void discover();if(a.name===STOCK)void stock()});
async function recordCaptcha(msg,sender){
 const {p,m}=await state();m.captchaChallenges=m.captchaChallenges||{};
 const key=String(msg.store)+"|"+new URL(msg.url).hostname,old=m.captchaChallenges[key],now=Date.now();
 const item={store:String(msg.store||"Retailer"),url:String(msg.url||""),title:String(msg.title||"Human verification requested"),evidence:String(msg.evidence||"Challenge detected"),firstDetectedAt:old?.firstDetectedAt||msg.detectedAt||new Date().toISOString(),lastDetectedAt:msg.detectedAt||new Date().toISOString(),lastNotifiedAt:now,active:true,tabId:sender.tab?.id??old?.tabId??null};
 m.captchaChallenges[key]=item;await save(p,m);
 if(!old||now-Number(old.lastNotifiedAt||0)>=10*60*1000){
  try{await chrome.notifications.create("ptcg-human-check-"+Date.now(),{type:"basic",iconUrl:"icon.svg",title:"Human verification may be required",message:item.store+" is showing a CAPTCHA/robot check. Open the retailer tab and complete it yourself.",priority:2})}catch(e){console.warn("Challenge notification failed",String(e))}
 }
}
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 if(msg?.type==="CAPTCHA_DETECTED"&&msg.url&&msg.store){recordCaptcha(msg,sender).then(()=>reply({ok:true})).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(msg?.type==="GET_DASHBOARD"){state().then(({p,m})=>reply({products:Object.values(p).sort((a,b)=>String(b.lastChecked||b.firstSeen).localeCompare(String(a.lastChecked||a.firstSeen))),meta:m})).catch(e=>reply({products:[],meta:{},error:String(e)}));return true}
 if(msg?.type==="GET_STORAGE_INFO"){state().then(async({p,m})=>{const bytes=await chrome.storage.local.getBytesInUse(null);reply({ok:true,productKey:PK,metaKey:MK,productCount:Object.keys(p).length,productStoreCounts:Object.fromEntries(["Target","Costco","Sam's Club"].map(s=>[s,Object.values(p).filter(x=>x.store===s).length])),metaKeys:Object.keys(m),bytes,quota:chrome.storage.local.QUOTA_BYTES||null,logCount:(m.scanLog||[]).length,baselined:m.baselined||{},lastScan:m.lastScan||{}})}).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(msg?.type==="CLEAR_SCAN_LOG"){state().then(async({p,m})=>{m.scanLog=[];await save(p,m);reply({ok:true})}).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(msg?.type==="EXPORT_STATE"){state().then(({p,m})=>reply({ok:true,export:{exportedAt:new Date().toISOString(),products:p,meta:m}})).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(msg?.type==="CLEAR_CHALLENGE"){state().then(async({p,m})=>{if(m.captchaChallenges?.[msg.key])m.captchaChallenges[msg.key].active=false;await save(p,m);reply({ok:true})}).catch(e=>reply({ok:false,error:String(e)}));return true}
 if(msg?.type==="SCAN_NOW"){(async()=>{console.info("[PTCG] Manual scan requested");const discovery=await discover();const stockResult=await stock();console.info("[PTCG] Manual scan finished");return {discovery,stock:stockResult}})().then(result=>reply({ok:true,result})).catch(e=>reply({ok:false,error:String(e)}));return true}
});
