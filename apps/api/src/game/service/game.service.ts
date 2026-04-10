import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class GameService {
  getGameFilePath(): string {
    const filePath = join(
      process.cwd(),
      'storage',
      'game',
      'algoritmia-game.zip',
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        'El archivo del videojuego no fue encontrado en el servidor.',
      );
    }

    return filePath;
  }
}
