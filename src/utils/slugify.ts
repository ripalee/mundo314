/**
 * Convierte un texto (ej. "LaLiga EA Sports", "España") en un slug limpio para URL:
 * "laliga-ea-sports", "espana", "primera-division-uruguaya"
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remueve tildes y diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza caracteres no alfanuméricos por guión
    .replace(/^-+|-+$/g, '');        // Remueve guiones al inicio o final
};
