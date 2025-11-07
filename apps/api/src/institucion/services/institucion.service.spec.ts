import { Test, TestingModule } from '@nestjs/testing';
import { InstitucionService } from './institucion.service';

describe('InstitucionService', () => {
  let service: InstitucionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstitucionService],
    }).compile();

    service = module.get<InstitucionService>(InstitucionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
