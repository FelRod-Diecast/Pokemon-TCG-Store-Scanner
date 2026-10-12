"use strict";
(() => {
 const h=location.hostname.toLowerCase();
 const store=(h==="target.com"||h.endsWith(".target.com"))?"Target":(h==="costco.com"||h.endsWith(".costco.com"))?"Costco":(h==="samsclub.com"||h.endsWith(".samsclub.com"))?"Sam's Club":"";
 if(!store)return;
 const patterns=[/verify (that )?you are (a )?human/i,/prove (that )?you('?| a)?re not a robot/i,/verify you('?| a)?re not a robot/i,/are you a robot/i,/robot check/i,/unusual traffic/i,/complete the security check/i,/security verification required/i,/checking your browser/i,/captcha/i,/human verification/i,/confirm you are not a robot/i];
 let lastSent="";
 function inspect(){
  const frame=document.querySelector('iframe[src*="captcha" i],iframe[src*="recaptcha" i],iframe[src*="hcaptcha" i],iframe[title*="challenge" i]');
  const title=document.title||"",body=(document.body?.innerText||"").slice(0,14000),match=patterns.find(p=>p.test(title)||p.test(body));
  if(!frame&&!match)return;
  const evidence=frame?"CAPTCHA/challenge iframe detected":"Page text matched: "+match;
  const fingerprint=location.href+"|"+evidence;if(fingerprint===lastSent)return;lastSent=fingerprint;
  chrome.runtime.sendMessage({type:"CAPTCHA_DETECTED",store,url:location.href,title,evidence,detectedAt:new Date().toISOString()}).catch(()=>{});
 }
 inspect();const observer=new MutationObserver(inspect);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});setInterval(inspect,4000);
})();