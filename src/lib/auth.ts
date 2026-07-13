import 'server-only';
import { getSession, SessionPayload } from './session';
import { redirect } from 'next/navigation';

export { getSession };

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireRole(
  role: 'customer' | 'seller' | 'admin'
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== role) redirect('/login');
  return session;
}

export async function requireAnyRole(
  roles: ('customer' | 'seller' | 'admin')[]
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) redirect('/login');
  return session;
}
