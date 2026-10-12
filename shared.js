(function(root){"use strict";
const INCLUDE=["pokemon tcg","pokemon trading card","pokemon trading cards","pokemon trading card game","trading card game","booster pack","booster bundle","booster box","booster display","elite trainer box","trainer box","etb","collection box","premium collection","ultra premium collection","special collection","30th anniversary","30th celebration","collector chest","mini tin","3-pack blister","checklane blister","pokemon cards"];
const EXCLUDE=["cake","cookie","cupcake","costume","coloring","activity book","storybook","plush","stuffed animal","toy figure","figurine","puzzle","backpack","clothing","shirt","t-shirt","nintendo switch","video game","dvd","movie","snack","candy","cereal","bedding","blanket","shoe","sock"];
function normalize(v){return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function isPokemonTCGProduct(title){const n=normalize(title);return n.includes("pokemon")&&!EXCLUDE.some(t=>n.includes(t))&&INCLUDE.some(t=>n.includes(normalize(t)))}
function storeForUrl(value){try{const h=new URL(value).hostname.replace(/^www\./,"");if(h==="target.com")return"Target";if(h==="costco.com")return"Costco";if(h==="samsclub.com")return"Sam's Club"}catch(e){}return"Unknown"}
root.PokemonScanner={normalize,isPokemonTCGProduct,storeForUrl};
})(globalThis);
