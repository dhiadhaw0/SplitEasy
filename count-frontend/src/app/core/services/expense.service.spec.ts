import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ExpenseService } from './expense.service';
import { environment } from '../../../environments/environment';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/groups/1/expenses`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() sends page/size and omits absent filters', () => {
    service.list(1, { page: 0, size: 20 }).subscribe();

    const req = httpMock.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('category')).toBeFalse();
    expect(req.request.params.has('participantId')).toBeFalse();
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('list() forwards category and participantId when provided', () => {
    service.list(1, { page: 1, size: 10, category: 'FOOD', participantId: 42 }).subscribe();

    const req = httpMock.expectOne(r => r.url === baseUrl);
    expect(req.request.params.get('category')).toBe('FOOD');
    expect(req.request.params.get('participantId')).toBe('42');
    req.flush({ content: [], page: 1, size: 10, totalElements: 0, totalPages: 1 });
  });

  it('create() posts to /groups/:id/expenses', () => {
    const request = {
      title: 'Restaurant', amount: 50, date: '2026-01-01', category: 'FOOD' as const,
      paidById: 1, splitType: 'EQUAL' as const, shares: [{ participantId: 1, value: null }],
      recurring: false, recurrenceInterval: null, currency: null
    };

    service.create(1, request).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('delete() calls DELETE /groups/:id/expenses/:expenseId', () => {
    service.delete(1, 9).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
