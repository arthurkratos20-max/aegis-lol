import type {Entitlement} from '../services/supabase';
export const SUPER_USERS: readonly string[] = ['arthurkratos20@gmail.com'];
export function isSuperUser(email: string, confirmed: boolean): boolean {
 return confirmed && SUPER_USERS.includes(email.trim().toLowerCase());
}
export function hasPro(ent: Entitlement, now = Date.now()): boolean {
 if (ent.role === 'owner' || ent.role === 'admin') return true;
 if (ent.plan === 'pro') return !ent.plan_expires_at || Date.parse(ent.plan_expires_at) > now;
 // Compatibility with the existing billing/trial RPC before the migration.
 return ent.plan === undefined && ent.pro === true;
}
