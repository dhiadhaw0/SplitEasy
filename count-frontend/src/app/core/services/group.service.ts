import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GroupDetail, GroupRequest, GroupSummary, InvitePreview, JoinGroupRequest } from '../models/group.model';
import { withSilentErrors } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class GroupService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/groups`;

  getMyGroups(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(this.baseUrl);
  }

  getGroup(groupId: number): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.baseUrl}/${groupId}`);
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  create(request: GroupRequest, silent = false): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(this.baseUrl, request, silent ? withSilentErrors() : {});
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  update(groupId: number, request: GroupRequest, silent = false): Observable<GroupDetail> {
    return this.http.put<GroupDetail>(`${this.baseUrl}/${groupId}`, request, silent ? withSilentErrors() : {});
  }

  delete(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${groupId}`);
  }

  regenerateInviteCode(groupId: number): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${this.baseUrl}/${groupId}/invite-code`, {});
  }

  previewInvite(inviteCode: string): Observable<InvitePreview> {
    return this.http.get<InvitePreview>(`${this.baseUrl}/invite/${inviteCode}`);
  }

  join(request: JoinGroupRequest): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${this.baseUrl}/join`, request);
  }
}
