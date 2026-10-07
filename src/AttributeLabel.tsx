import {Heart,Swords,Sparkles,Shield,ShieldCheck,Timer,Zap,Target,Footprints,Droplets,Crosshair,Flame,Plus,Coins,Hourglass,type LucideIcon} from 'lucide-react';
import {SHARD_ICONS} from './shardIcons';
import type {Stats} from './contracts';
const icons:Partial<Record<keyof Stats,LucideIcon>>={hp:Heart,ad:Swords,ap:Sparkles,armor:Shield,mr:ShieldCheck,haste:Timer,basicHaste:Timer,ultimateHaste:Timer,as:Zap,baseAS:Zap,ratio:Zap,bonusAS:Zap,crit:Target,critMultiplier:Target,move:Footprints,lifesteal:Droplets,mana:Droplets,hpRegen:Plus,manaRegen:Droplets,range:Crosshair,armorPen:Crosshair,armorPenPercent:Crosshair,magicPen:Flame,magicPenPercent:Flame};
export function AttributeIcon({attribute,size=16}:{attribute:keyof Stats|'damage'|'defense'|'gold'|'window';size?:number}) {
 const Icon=attribute==='damage'?Swords:attribute==='defense'?Shield:attribute==='gold'?Coins:attribute==='window'?Hourglass:icons[attribute]??Sparkles;
 return <Icon size={size} aria-hidden="true" className={`attribute-icon attribute-${attribute}`}/>;
}
export default function AttributeLabel({attribute,children}:{attribute:keyof Stats|'damage'|'defense'|'gold'|'window';children:React.ReactNode}){return <span className="attribute-label"><AttributeIcon attribute={attribute}/><span>{children}</span></span>;}
export function ShardIcon({shard,size=20}:{shard:string;size?:number}){const src=SHARD_ICONS[shard];return src?<img className="official-shard-icon" src={src} width={size} height={size} alt="" aria-hidden="true"/>:<AttributeIcon attribute="damage" size={size}/>;}
