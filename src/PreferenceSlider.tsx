'use client';
import {useRef,type InputHTMLAttributes} from 'react';
/** Every integer change updates parent state immediately; there is no release-only calculation. */
export default function PreferenceSlider({onValue,onCommit,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'onChange'|'type'|'onCommit'>&{onValue:(value:number)=>void;onCommit:()=>void}){
 const last=useRef<number|null>(null);
 const change=(value:number)=>{if(last.current===value)return;last.current=value;onValue(value);};
 return <input {...props} type="range" step={props.step??1} onChange={e=>change(Number(e.currentTarget.value))} onPointerUp={onCommit} onBlur={onCommit}/>;
}
