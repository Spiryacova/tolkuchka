export type PublicRole = 'buyer' | 'seller' | 'admin';

export function mapRole(role: 'BUYER' | 'SELLER' | 'ADMIN'): PublicRole {
  return role.toLowerCase() as PublicRole;
}
