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
  downloadGame(@Res() res: Response) {
    const filePath = this.gameService.getGameFilePath();

    res.sendFile(
      filePath,
      {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="algoritmia-game.zip"',
        },
      },
      (err) => {
        if (err && !res.headersSent) {
          res
            .status(500)
            .json({ message: 'Error interno al enviar el archivo.' });
        }
      },
    );
  }
}
