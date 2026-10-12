"use strict";
const $=id=>document.getElementById(id);
function req(m){return new Promise(resolve=>chrome.runtime.sendMessage(m,r=>resolve(r||{})))}
function esc(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function label(s){return s==="in_stock"?"Page suggests in stock":s==="sold_out"?"Page says sold out":"Unknown availability"}
async function render(){
 const d=await req({type:"GET_DASHBOARD"}),ps=d.products||[],ss=d.lastScans||{},stores=["Target","Costco","Sam's Club"];
 const lines=stores.map(s=>{const x=ss[s];return '<div class="storeline"><b>'+esc(s)+'</b>: '+(x?esc(x.found+' candidates · '+new Date(x.at).toLocaleTimeString()):"not scanned yet — open a store search page")+'</div>'}).join("");
 const ins=ps.filter(p=>p.status==="in_stock").length,unk=ps.filter(p=>p.status!=="in_stock"&&p.status!=="sold_out").length;
 $("summary").innerHTML='<b>'+ps.length+' tracked listings</b> · '+ins+' availability signals · '+unk+' unknown'+lines;
 $("products").innerHTML=ps.length?ps.slice(0,80).map(p=>'<div class="product"><a href="'+esc(p.url)+'" target="_blank" rel="noreferrer">'+esc(p.title)+'</a><div class="muted">'+esc(p.store)+(p.price?' · '+esc(p.price):"")+'</div><div class="meta"><span class="pill '+esc(p.status)+'">'+esc(label(p.status))+'</span><span class="pill">Seen '+esc(new Date(p.lastSeen||p.firstSeen).toLocaleString())+'</span></div></div>').join(""):'<p class="muted">No matching listings yet. Open a retailer search page or use “Open store searches”.</p>';
}
$("refresh").addEventListener("click",render);
$("openAll").addEventListener("click",async()=>{$("openAll").disabled=true;await req({type:"OPEN_SEARCHES",stores:["Target","Costco","Sam's Club"]});setTimeout(()=>{$("openAll").disabled=false;render()},1200)});
render();setInterval(render,5000);
