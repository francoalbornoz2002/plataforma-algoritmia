import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class GameService {
  async getGameFile(): Promise<StreamableFile> {
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

    try {
      const file = createReadStream(filePath);
      return new StreamableFile(file);
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo procesar el archivo del videojuego.',
      );
    }
  }
}
