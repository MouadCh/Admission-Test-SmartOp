import { TestBed } from '@angular/core/testing';

import { MockServerResultsServiceService } from './mock-server-results-service.service';

describe('MockServerResultsServiceService', () => {
  let service: MockServerResultsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockServerResultsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
