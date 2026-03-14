import { Module } from '@nestjs/common';
import { GameController } from './controller/game.controller';
import { GameService } from './service/game.service';

@Module({
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
