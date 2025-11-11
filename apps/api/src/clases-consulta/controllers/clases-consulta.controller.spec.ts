import { Test, TestingModule } from '@nestjs/testing';
import { ClasesConsultaController } from './clases-consulta.controller';
import { ClasesConsultaService } from '../services/clases-consulta.service';

describe('ClasesConsultaController', () => {
  let controller: ClasesConsultaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClasesConsultaController],
      providers: [ClasesConsultaService],
    }).compile();

    controller = module.get<ClasesConsultaController>(ClasesConsultaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
