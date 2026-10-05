import type {User} from './mockAuth.ts';
/** Mock sessions are always Free, even if a caller changes client flags. */
export const canAccessPro=(user:User|null)=>!!user&&user.source!=='mock'&&(user.isPro||user.role==='admin');
