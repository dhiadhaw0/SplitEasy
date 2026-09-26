import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GroupService } from './group.service';
import { environment } from '../../../environments/environment';
import { GroupDetail, GroupSummary } from '../models/group.model';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/groups`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMyGroups() calls GET /groups', () => {
    const mockGroups: GroupSummary[] = [
      { id: 1, name: 'Voyage', description: null, currency: 'EUR', participantCount: 3, totalSpent: 100, myBalance: 20, updatedAt: '2026-01-01T00:00:00Z' }
    ];

    service.getMyGroups().subscribe(groups => expect(groups).toEqual(mockGroups));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockGroups);
  });

  it('create() posts the group request and returns the created group', () => {
    const request = { name: 'Colocation', description: null, currency: 'EUR' as const };
    const mockResponse: GroupDetail = {
      id: 5, name: 'Colocation', description: null, currency: 'EUR', inviteCode: 'ABC1234XYZ',
      createdById: 1, participants: [], myParticipantId: 10, createdAt: '2026-01-01T00:00:00Z'
    };

    service.create(request).subscribe(group => expect(group).toEqual(mockResponse));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('previewInvite() calls GET /groups/invite/:code', () => {
    service.previewInvite('ABC1234XYZ').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/invite/ABC1234XYZ`);
    expect(req.request.method).toBe('GET');
    req.flush({ groupId: 1, groupName: 'Voyage', unlinkedParticipants: [] });
  });

  it('delete() calls DELETE /groups/:id', () => {
    service.delete(7).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
