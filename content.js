(function(){"use strict";
if(!globalThis.PokemonScanner)return;
const {isPokemonTCGProduct,storeForUrl,normalize}=globalThis.PokemonScanner;
const store=storeForUrl(location.href);if(store==="Unknown")return;
let lastSignature="";
function txt(n){return(n?.innerText||n?.textContent||"").replace(/\s+/g," ").trim()}
function cardFor(a){let n=a;for(let i=0;n&&i<6;i++,n=n.parentElement){const t=txt(n);if(t.length>20&&t.length<1800&&(/$\s?\d|add to cart|sold out|out of stock|unavailable/i).test(t))return n}return a.parentElement||a}
function statusFor(t){const n=normalize(t);if(/sold out|out of stock|currently unavailable|unavailable online/.test(n))return"sold_out";if(/add to cart|ship it|shipping available|in stock|available for shipping/.test(n))return"in_stock";return"unknown"}
function productPath(path){return /\/(p|product|ip)\//i.test(path)||/\.html?$/i.test(path)}
function scan(){const found=new Map();for(const a of document.querySelectorAll("a[href]")){let u;try{u=new URL(a.href)}catch(e){continue}if(!productPath(u.pathname))continue;const card=cardFor(a);const title=[a.getAttribute("aria-label"),a.getAttribute("title"),a.querySelector("img")?.alt,a.querySelector("h1,h2,h3,h4,[class*=title]")?.textContent,txt(a),card.querySelector("h1,h2,h3,h4,[class*=title]")?.textContent].map(v=>String(v||"").replace(/\s+/g," ").trim()).filter(Boolean).sort((x,y)=>y.length-x.length)[0]||"";if(!isPokemonTCGProduct(title))continue;u.hash="";const body=txt(card);const price=(body.match(/\$\s?\d{1,4}(?:,\d{3})*(?:\.\d{2})?/)||[])[0]||null;found.set(u.href,{store,title:title.slice(0,240),url:u.href,price,status:statusFor(body),observedAt:new Date().toISOString()})}
const products=[...found.values()];const sig=JSON.stringify(products.map(p=>[p.url,p.title,p.status,p.price]).sort());if(sig===lastSignature)return;lastSignature=sig;
try{chrome.runtime.sendMessage({type:"PRODUCT_SCAN",store,pageUrl:location.href,products},()=>void chrome.runtime.lastError)}catch(e){}
}
scan();let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(scan,1600)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(scan,30000);
})();
