"use strict";
const $=id=>document.getElementById(id);
function req(m){return new Promise(resolve=>chrome.runtime.sendMessage(m,r=>resolve(r||{})))}
function esc(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function label(p){return p.available===true?"Availability signal: IN STOCK":p.available===false?"Reported SOLD OUT":"Availability UNKNOWN"}
async function render(){
 const d=await req({type:"GET_DASHBOARD"}),ps=d.products||[],m=d.meta||{},last=m.lastScan||{},stores=["Target","Costco","Sam's Club"];
 const lines=stores.map(s=>{const x=last[s];return '<div class="storeline"><b>'+esc(s)+'</b>: '+(x?esc(x.candidates+" candidates · "+new Date(x.at).toLocaleTimeString()+(x.baseline?" · baseline":"")):"waiting for first automatic scan")+'</div>'}).join("");
 const ins=ps.filter(p=>p.available===true).length,out=ps.filter(p=>p.available===false).length,unk=ps.length-ins-out;
 const discovery=m.lastDiscoveryRun?.at?"Last discovery cycle: "+new Date(m.lastDiscoveryRun.at).toLocaleString():"Discovery cycle pending";
 const stock=m.lastStockRun?.at?"Last Target stock check: "+new Date(m.lastStockRun.at).toLocaleTimeString():"Stock check pending";
 $("summary").innerHTML='<b>'+ps.length+' tracked products</b> · '+ins+' availability signals · '+out+' sold out · '+unk+' unknown'+lines+'<div class="statusline">'+esc(discovery)+'</div><div class="statusline">'+esc(stock)+'</div>';
 $("products").innerHTML=ps.length?ps.slice(0,100).map(p=>'<div class="product"><a href="'+esc(p.url)+'" target="_blank" rel="noreferrer">'+esc(p.name)+'</a><div class="muted">'+esc(p.store)+(p.price?' · '+esc(p.price):"")+(p.id?' · ID '+esc(p.id):"")+'</div><div class="meta"><span class="pill '+(p.available===true?"in_stock":p.available===false?"sold_out":"unknown")+'">'+esc(label(p))+'</span><span class="pill">Seen '+esc(new Date(p.lastSeen||p.firstSeen).toLocaleString())+'</span></div></div>').join(""):'<p class="muted">No products discovered yet. The background scanner will populate this list after a retailer API responds successfully.</p>';
}
$("refresh").addEventListener("click",render);
$("scanNow").addEventListener("click",async()=>{$("scanNow").disabled=true;$("scanNow").textContent="Scanning…";try{await req({type:"SCAN_NOW"})}finally{$("scanNow").disabled=false;$("scanNow").textContent="Scan now";await render()}});
render();setInterval(render,5000);