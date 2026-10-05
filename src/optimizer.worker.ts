import {affinityCandidates} from './recommendation.ts';
import {optimize} from './optimizer.ts';
self.onmessage=(event)=>{const {id,scenario,data,automatic}=event.data;try{const result=optimize(scenario,data,{...(automatic?{candidates:affinityCandidates(scenario,data),limit:1200,timeoutMs:1500}:{}),onProgress:n=>self.postMessage({id,progress:n})});self.postMessage({id,result});}catch(e){self.postMessage({id,error:e instanceof Error?e.message:'Falha no otimizador'});}};
