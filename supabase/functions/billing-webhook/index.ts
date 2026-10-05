import {service,json,api} from '../_shared/runtime.ts';
import {verifyStripe} from '../../../src/billing.ts';
Deno.serve(async(req:Request)=>{if(req.method!=='POST')return json({error:'Method not allowed'},405);try{const body=await req.text();if(body.length>1000000)return json({error:'Payload too large'},413);const secret=Deno.env.get('STRIPE_WEBHOOK_SECRET');if(!secret||!await verifyStripe(body,req.headers.get('stripe-signature')??'',secret))return json({error:'Invalid signature'},401);const event=JSON.parse(body),db=service();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const {data:previous}=await db.from('webhook_events').select('processed_at').eq('provider','stripe').eq('event_id',event.id).maybeSingle();if(previous?.processed_at)return json({received:true,duplicate:true});
 const o=event.data.object;const id=o.object==='subscription'?o.id:o.subscription??o.parent?.subscription_details?.subscription;if(!id)return json({received:true,ignored:true});
 // Reconcile against current provider state instead of trusting possibly out-of-order payloads.
 const sub=await api(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(id)}`,Deno.env.get('STRIPE_SECRET_KEY')!);const userId=sub.metadata?.user_id;if(!userId)return json({error:'Missing server-created user mapping'},400);
 const end=sub.current_period_end??sub.items?.data?.[0]?.current_period_end;const until=['active','trialing'].includes(sub.status)&&end?new Date(end*1000).toISOString():null;
 const {error}=await db.rpc('apply_billing_event',{p_provider:'stripe',p_event_id:event.id,p_hash:hash,p_user:userId,p_external:id,p_status:sub.status,p_until:until});if(error)throw error;return json({received:true});
 }catch{return json({error:'Webhook reconciliation failed; retry required'},500);}});
