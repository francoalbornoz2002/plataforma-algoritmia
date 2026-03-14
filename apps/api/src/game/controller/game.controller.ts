import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { GameService } from '../service/game.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { roles as userRoles } from '@prisma/client';
import type { Response } from 'express';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @UseGuards(RolesGuard)
  @Roles(userRoles.Alumno)
  @Get('download')
  async downloadGame(@Res({ passthrough: true }) res: Response) {
    const file = await this.gameService.getGameFile();

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="algoritmia-game.zip"',
    });

    return file;
  }
}
