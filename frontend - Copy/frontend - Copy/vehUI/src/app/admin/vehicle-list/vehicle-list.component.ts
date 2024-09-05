import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../common/services/api.service';
import { Vehicle } from '../../models/model';
import { ServiceStatus } from '../../models/model';
import { User } from '../../models/model';

@Component({
  selector: 'vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit {
[x: string]: any;
  vehicles: Vehicle[] = [];
  serviceAdvisors: User[] = [];
  selectedVehicleId: number | null = null;
  selectedAdvisorId: number | null = null;
  scheduledDate: Date = new Date(); // You can set this as needed
  serviceScheduled: boolean = false;  
  displayedColumns: string[] = ['id', 'licensePlate', 'model', 'ownerId', 'actions'];
  filteredVehicles: Vehicle[] = [];
  vehicleScheduled: { [key: number]: boolean } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.loadServiceAdvisors();
  }


  loadVehicles(): void {
    this.apiService.getVehicles().subscribe(
      (data: Vehicle[]) => {
        this.vehicles = data;
        this.filteredVehicles = data;
      },
      error => console.error('Error fetching vehicles:', error)
    );
  }
  
  loadServiceAdvisors(): void {
    this.apiService.getServiceAdvisors().subscribe(
      (data: User[]) => {
        this.serviceAdvisors = data;
      },
      error => console.error('Error fetching service advisors:', error)
    );
  }

  toggleScheduleService(vehicle: Vehicle): void {
    this.selectedVehicleId = this.selectedVehicleId === vehicle.id ? null : vehicle.id;
    
  }
  isVehicleHidden(vehicleId: number): boolean {
    return this.serviceScheduled && this.selectedVehicleId === vehicleId;
  }

  onAdvisorSelect(advisorId: number): void {
    this.selectedAdvisorId = advisorId;
  }
  getVehicleCount(): number {
    return this.filteredVehicles.length;
  }

  scheduleService(): void {
    if (this.selectedVehicleId && this.selectedAdvisorId) {
      const scheduledDate = new Date();
      this.apiService.scheduleService(this.selectedVehicleId, this.selectedAdvisorId, scheduledDate).subscribe(
        (serviceRecord: any) => {
          // Update service status to UNDER_SERVICE
          this.apiService.updateServiceStatus(serviceRecord.id, ServiceStatus.UNDER_SERVICE).subscribe(
            () => {
              // Mark the vehicle as scheduled
              this.vehicleScheduled[this.selectedVehicleId!] = true;
              
              // Remove the vehicle from the filtered list
              this.filteredVehicles = this.filteredVehicles.filter(vehicle => vehicle.id !== this.selectedVehicleId);
              
              // Reset the selected vehicle ID
              this.selectedVehicleId = null;
            },
            error => {
              console.error('Error updating service status', error);
            }
          );
        },
        error => {
          console.error('Error scheduling service', error);
        }
      );
    } else {
      console.error('Vehicle ID or Service Advisor ID is missing');
    }
  }
  
}