export const ATTRIBUTE_KEYS=['AD','AP','HP','Armadura','RM','AS','Haste','Movimento'] as const;
/** Normalize each attribute separately; never add raw HP, AD and movement units. */
export function attributePreferences(rows:{attributes?:Record<string,number>}[],subweights:Record<string,number>={}){
 const active=ATTRIBUTE_KEYS.map(key=>({key,weight:Number.isFinite(subweights[key])?Math.max(0,Math.min(100,subweights[key])):0})).filter(x=>x.weight>0);
 const total=active.reduce((n,x)=>n+x.weight,0);
 if(!total)return {active:false,scores:rows.map(()=>0)};
 const bounds=active.map(x=>{const values=rows.map(r=>r.attributes?.[x.key]??0);return {...x,min:Math.min(...values),max:Math.max(...values)};});
 return {active:true,scores:rows.map(row=>bounds.reduce((sum,x)=>sum+x.weight/total*(x.max>x.min?Math.max(0,Math.min(1,((row.attributes?.[x.key]??0)-x.min)/(x.max-x.min))):0),0))};
}
export function preferenceScore(base:number,attribute:number,active:boolean){return active?.75*base+.25*attribute:base;}
