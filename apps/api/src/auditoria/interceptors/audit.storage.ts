import { AsyncLocalStorage } from 'async_hooks';

// Este 'storage' guardará el ID del usuario para esta solicitud específica
export const auditStorage = new AsyncLocalStorage<{ userId: string }>();
