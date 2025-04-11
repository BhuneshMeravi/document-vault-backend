import { Test, TestingModule } from '@nestjs/testing';
import { AccessLinksService } from './access-links.service';

describe('AccessLinksService', () => {
  let service: AccessLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessLinksService],
    }).compile();

    service = module.get<AccessLinksService>(AccessLinksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
