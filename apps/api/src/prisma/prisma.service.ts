import { Injectable } from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    // AÑADE ESTO
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
}
