import { Test, TestingModule } from '@nestjs/testing';
import { ClasesConsultaService } from './clases-consulta.service';

describe('ClasesConsultaService', () => {
  let service: ClasesConsultaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClasesConsultaService],
    }).compile();

    service = module.get<ClasesConsultaService>(ClasesConsultaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
