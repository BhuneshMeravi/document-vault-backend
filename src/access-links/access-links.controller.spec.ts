import { Test, TestingModule } from '@nestjs/testing';
import { AccessLinksController } from './access-links.controller';
import { AccessLinksService } from './access-links.service';

describe('AccessLinksController', () => {
  let controller: AccessLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessLinksController],
      providers: [AccessLinksService],
    }).compile();

    controller = module.get<AccessLinksController>(AccessLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
