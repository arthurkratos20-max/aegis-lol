'use client';
import {type InputHTMLAttributes} from 'react';
/** Every integer change updates parent state immediately; there is no release-only calculation. */
export default function PreferenceSlider({onValue,onCommit,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'onChange'|'type'|'onCommit'>&{onValue:(value:number)=>void;onCommit:()=>void}){
 return <input {...props} type="range" step={props.step??1} onChange={e=>onValue(Number(e.currentTarget.value))} onPointerUp={onCommit} onBlur={onCommit}/>;
}
