import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountStatus, ServiceItem, ServiceRecord, ServiceStatus, User, UserType, Vehicle, WorkItem } from '../../models/model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  generateInvoice(recordId: number) {
    throw new Error('Method not implemented.');
  }
  private API_BASE_URL = 'https://localhost:7032/api';

  private userStatus = new Subject<string>();
  private userType: string | null = null;
  
  constructor(private http: HttpClient) {}

  // ===========================================================================================
  //                 LOGIN / LOGOUT OPERATIONS
  // =========================================================================================== 
  
  login(loginInfo: { email: string; password: string }): Observable<any> {
    const url = `${this.API_BASE_URL}/auth/Login`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, loginInfo, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
  
  setLoggedIn(status: boolean, userType: string, userInfo: User): void {
    localStorage.setItem('isLoggedIn', status.toString());
    localStorage.setItem('userType', userType);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    this.userStatus.next(status ? 'loggedIn' : 'loggedOff'); 
  }
  
  getUserType(): string | null {
    return this.userType || localStorage.getItem('userType');
  }
  
  getUserInfo(): User | null {
    if (!this.isLoggedIn()) return null;
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) as User : null;
  }
  
  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    this.userStatus.next('loggedOff'); 
  }  

  get userStatusObservable(): Observable<string> {
    return this.userStatus.asObservable();
  }

  register(user: any): Observable<string> {
    user.userType = UserType.SERVICE_ADVISOR; 
    return this.http.post<string>(`${this.API_BASE_URL}/auth/register`, user).pipe(
      catchError(this.handleError)
    );
  }

  // ===========================================================================================
  //                 VEHICLE STATUS OPERATIONS
  // ===========================================================================================

  getVehiclesDueForServicing(): Observable<Vehicle[]> {
    const url = `${this.API_BASE_URL}/admin/VehiclesDueForServicing`;
    return this.http.get<Vehicle[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getVehiclesUnderServicing(): Observable<ServiceRecord[]> {
    const url = `${this.API_BASE_URL}/admin/VehiclesUnderServicing`;
    return this.http.get<ServiceRecord[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getVehiclesServiced(): Observable<ServiceRecord[]> {
    const url = `${this.API_BASE_URL}/admin/VehiclesServiced`;
    return this.http.get<ServiceRecord[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  getVehicles(): Observable<Vehicle[]> {
    const url = `${this.API_BASE_URL}/admin/GetVehicles`;
    return this.http.get<Vehicle[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  scheduleService(vehicleId: number, serviceAdvisorId: number, scheduledDate: Date): Observable<any> {
    const params = new HttpParams()
      .set('vehicleId', vehicleId.toString())
      .set('serviceAdvisorId', serviceAdvisorId.toString())
      .set('scheduledDate', scheduledDate.toISOString());

    return this.http.post<any>(`${this.API_BASE_URL}/admin/ScheduleService`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  updateServiceStatus(serviceRecordId: number, status: ServiceStatus, completedDate?: Date): Observable<any> {
    const params = new HttpParams()
      .set('serviceRecordId', serviceRecordId.toString())
      .set('status', status.toString())
      .set('completedDate', completedDate ? completedDate.toISOString() : '');

    return this.http.post<any>(`${this.API_BASE_URL}/admin/UpdateServiceStatus`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // ===========================================================================================
  //                 CRUD - PRIVILEGES FOR PARTICULAR SERVICE ADVISOR
  // ===========================================================================================

  getScheduledServicesForAdvisor(serviceAdvisorId: number): Observable<ServiceRecord[]> {
    const url = `${this.API_BASE_URL}/ServiceAdvisor/ScheduledServices`;
    return this.http.get<ServiceRecord[]>(url, {
      params: { serviceAdvisorId: serviceAdvisorId.toString() }
    }).pipe(
      catchError(this.handleError)
    );
  }
  
  // Update `getServiceRecordForAdvisor` similarly
  getServiceRecordForAdvisor(id: number): Observable<ServiceRecord> {
    const url = `${this.API_BASE_URL}/ServiceAdvisor/ServiceRecord/${id}`;
    return this.http.get<ServiceRecord>(url).pipe(
      catchError(this.handleError)
    );
  }

  addServiceItem(serviceRecordId: number, workItemId: number, quantity: number): Observable<void> {
    const url = `${this.API_BASE_URL}/ServiceAdvisor/AddServiceItem`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { serviceRecordId, workItemId, quantity };
    console.log(body);
    return this.http.post<void>(url, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }  

  updateVehicleStatus(vehicleId: number, status: string): Observable<void> {
    return this.http.patch<void>(`${this.API_BASE_URL}/Vehicle/UpdateStatus/${vehicleId}`, {
      status
    }).pipe(
      catchError(this.handleError)
    );
  }   

  // ===============================================
  //                 INVOICE CREATE
  // ===============================================

  getServiceRecords(): Observable<ServiceRecord[]> {
    const url = `${this.API_BASE_URL}/admin/GetServiceRecords`;
    return this.http.get<ServiceRecord[]>(url).pipe(
      catchError(this.handleError)
    );
  } 

  createInvoice(serviceRecordId: number): Observable<any> {
    const url = `${this.API_BASE_URL}/admin/CreateInvoice`;
    return this.http.post<any>(url, null, {
      params: { serviceRecordId: serviceRecordId.toString() }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================================
  //                 CRUD - VEHICLES
  // ===============================================

  createVehicle(vehicle: Vehicle): Observable<Vehicle> {
    const url = `${this.API_BASE_URL}/admin/CreateVehicles`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Vehicle>(url, vehicle, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateVehicle(id: number, vehicle: Vehicle): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/Vehicles/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<void>(url, vehicle, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteVehicle(id: number): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/Vehicles/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================================
  //                 CRUD - SERVICE ADVISORS
  // ===============================================

  getServiceAdvisors(): Observable<User[]> {
    const url = `${this.API_BASE_URL}/admin/GetSA`;
    return this.http.get<User[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  createServiceAdvisor(advisor: User): Observable<User> {
    const url = `${this.API_BASE_URL}/admin/CreateSA`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    advisor.accountStatus = AccountStatus.UNAPPROVED; 
    advisor.userType = UserType.SERVICE_ADVISOR; 
    console.log(advisor);
    return this.http.post<User>(url, advisor, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateServiceAdvisor(id: number, advisor: User): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/UpdateSA/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    advisor.accountStatus = AccountStatus.APPROVED;
    return this.http.put<void>(url, advisor, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteServiceAdvisor(id: number): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/SA/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================================
  //                 CRUD - WORK ITEM
  // ===============================================

  getWorkItems(): Observable<WorkItem[]> {
    const url = `${this.API_BASE_URL}/admin/GetWorkItem`;
    return this.http.get<WorkItem[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  createWorkItem(workItem: WorkItem): Observable<WorkItem> {
    const url = `${this.API_BASE_URL}/admin/CreateWorkItem`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<WorkItem>(url, workItem, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateWorkItem(id: number, workItem: WorkItem): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/UpdateWorkItem/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<void>(url, workItem, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  deleteWorkItem(id: number): Observable<void> {
    const url = `${this.API_BASE_URL}/admin/DeleteWorkItem/${id}`;
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
