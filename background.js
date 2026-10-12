"use strict";
const PK="pokemonScannerProducts", BK="pokemonScannerBaselines", SK="pokemonScannerLastScans";
function key(p){return String(p.store)+"|"+String(p.url||p.title).toLowerCase()}
function status(s){return["in_stock","sold_out","unknown"].includes(s)?s:"unknown"}
async function notify(title,message,id){try{await chrome.notifications.create(id,{type:"basic",iconUrl:"icon.svg",title,message:String(message||"").slice(0,240)})}catch(e){console.warn("Notification unavailable",e)}}
async function scan(message,sender){
 const store=String(message.store||"Unknown"), incoming=Array.isArray(message.products)?message.products:[];
 const data=await chrome.storage.local.get([PK,BK,SK]), products=data[PK]||{}, baselines=data[BK]||{}, scans=data[SK]||{};
 const baseline=!baselines[store], now=new Date().toISOString();let added=0,changes=0;
 for(const p of incoming){
  if(!p||!p.url||!p.title)continue;let u;try{u=new URL(p.url)}catch(e){continue}
  if(!["target.com","costco.com","samsclub.com"].includes(u.hostname.replace(/^www\\./,"")))continue;
  const k=key({store,url:u.href,title:p.title}), s=status(p.status), old=products[k];
  if(!old){products[k]={store,title:String(p.title).slice(0,240),url:u.href,price:p.price||null,status:s,firstSeen:now,lastSeen:now,statusChangedAt:null};added++;if(!baseline)await notify("New Pokémon TCG listing",store+": "+p.title,"new-"+k.replace(/[^a-z0-9]/gi,"").slice(0,90));continue}
  old.lastSeen=now;old.title=String(p.title).slice(0,240);if(p.price)old.price=p.price;
  if(s!=="unknown"&&s!==status(old.status)){old.status=s;old.statusChangedAt=now;changes++;if(!baseline)await notify(s==="in_stock"?"Pokémon TCG availability signal":"Pokémon TCG listing sold out",store+": "+p.title+" — "+(s==="in_stock"?"page suggests availability; verify on retailer site":"page says sold out"),"state-"+k.replace(/[^a-z0-9]/gi,"").slice(0,90))}
 }
 baselines[store]=true;scans[store]={at:now,pageUrl:sender?.tab?.url||message.pageUrl||"",found:incoming.length,added,changes,baseline};
 await chrome.storage.local.set({[PK]:products,[BK]:baselines,[SK]:scans});
 return{ok:true,found:incoming.length,added,changes,baseline};
}
chrome.runtime.onMessage.addListener((m,sender,respond)=>{
 if(m?.type==="PRODUCT_SCAN"){scan(m,sender).then(respond).catch(e=>respond({ok:false,error:String(e)}));return true}
 if(m?.type==="GET_DASHBOARD"){chrome.storage.local.get([PK,SK]).then(d=>respond({products:Object.values(d[PK]||{}).sort((a,b)=>String(b.lastSeen).localeCompare(String(a.lastSeen))),lastScans:d[SK]||{}})).catch(e=>respond({products:[],lastScans:{},error:String(e)}));return true}
 if(m?.type==="OPEN_SEARCHES"){const urls={"Target":"https://www.target.com/s?searchTerm=pokemon%20tcg","Costco":"https://www.costco.com/s?keyword=pokemon","Sam's Club":"https://www.samsclub.com/s/pokemon%20cards"};Promise.all((m.stores||Object.keys(urls)).filter(x=>urls[x]).map(x=>chrome.tabs.create({url:urls[x]}))).then(t=>respond({ok:true,opened:t.length})).catch(e=>respond({ok:false,error:String(e)}));return true}
});
