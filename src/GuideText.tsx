import {useMemo} from 'react';
import type {Dataset} from './contracts';
import {parseGuideReferences} from './guideReferences';
export default function GuideText({text,data}:{text:string;data:Dataset}){
 const parts=useMemo(()=>parseGuideReferences(text,data),[text,data]);
 return <>{parts.map((part,i)=>part.reference?<span className="guide-reference" key={i} title={part.reference.label}>{part.reference.championIcon&&<img src={part.reference.championIcon} alt=""/>}<img src={part.reference.icon} alt=""/>{part.reference.key&&<kbd>{part.reference.key}</kbd>}<span>{part.reference.label}</span></span>:<span key={i}>{part.text}</span>)}</>;
}
