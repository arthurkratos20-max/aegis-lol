/** A chroma inherits its base skin's splash. Never use chroma IDs in asset URLs. */
export interface SkinChoice {num:number;parentSkin?:number;baseSkinNum?:number;chromaId?:number}
export function baseSkinNum(choice:SkinChoice|undefined):number {
 const n=choice?.parentSkin??choice?.baseSkinNum??choice?.num??0;
 return Number.isInteger(n)&&n>=0?n:0;
}
export function splashURL(championId:string,choice?:SkinChoice):string {
 return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(championId)}_${baseSkinNum(choice)}.jpg`;
}
