import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../common/services/api.service';
import { ServiceRecord, WorkItem } from '../../models/model';
import { ServiceStatus } from '../../models/model';
import { Vehicle } from '../../models/model';
@Component({
  selector: 'scheduled-vehicle',
  templateUrl: './scheduled-vehicle.component.html',
  styleUrls: ['./scheduled-vehicle.component.css']
})
export class ScheduledVehicleComponent implements OnInit {

  scheduledVehicles: ServiceRecord[] = [];
  workItems: WorkItem[] = [];
  selectedServiceRecord: ServiceRecord | null = null;
  selectedWorkItem: WorkItem | null = null;
  quantity: number = 1;
  displayedColumns: string[] = ['id', 'model', 'licensePlate', 'serviceAdvisor', 'actions'];
  displayedItemColumns: string[] = ['workItemName', 'quantity', 'cost', 'actions'];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getScheduledVehicles();
    this.loadWorkItems();
  }

  findId(): number {
    const user_info: string = localStorage.getItem('userInfo') ?? '{}';
    const id = JSON.parse(user_info).id;
    return id;
  }

  getScheduledVehicles(): void {
    this.apiService.getScheduledServicesForAdvisor(this.findId()).subscribe(
      (data: ServiceRecord[]) => {
        this.scheduledVehicles = data;
      },
      error => {
        console.error('Error fetching scheduled vehicles', error);
      }
    );
  }

  loadWorkItems(): void {
    this.apiService.getWorkItems().subscribe(
      (items: WorkItem[]) => {
        this.workItems = items;
      },
      error => {
        console.error('Error fetching work items', error);
      }
    );
  }

  selectServiceRecord(record: ServiceRecord): void {
    console.log('Selected Service Record:', record);
    if (record.id) {
      this.selectedServiceRecord = record;
    } else {
      console.error('Selected Service Record does not have an ID:', record);
    }
  }

  viewServiceRecord(vehicle: { id: number }): void {
    if (vehicle.id) {
      this.apiService.getServiceRecordForAdvisor(vehicle.id).subscribe(
        (record: ServiceRecord) => {
          this.selectedServiceRecord = record;
        },
        error => {
          console.error('Error fetching service record', error);
        }
      );
    } else {
      console.error('Invalid vehicle ID');
    }
  }

  removeItem(item: any): void {
    if (this.selectedServiceRecord) {
      this.selectedServiceRecord.serviceItems = this.selectedServiceRecord.serviceItems.filter(i => i !== item);
    }
  }

  addBillOfMaterial(): void {
    if (this.selectedServiceRecord && this.selectedWorkItem && this.quantity > 0) {
      console.log('Selected Service Record:', this.selectedServiceRecord);
      console.log('Selected Work Item:', this.selectedWorkItem);
      console.log('Quantity:', this.quantity);
  
      const serviceRecordId = this.selectedServiceRecord.id;
      const workItemId = this.selectedWorkItem.id;
  
      // Create a new item to add to the serviceItems array
      const newItem = {
        workItem: this.selectedWorkItem,
        quantity: this.quantity
      };
  
      // Push the new item into the serviceItems array
      this.selectedServiceRecord.serviceItems = [
        ...(this.selectedServiceRecord.serviceItems || []),
        newItem
      ];
  
      // Call the API to add the item to the backend
      this.apiService.addServiceItem(serviceRecordId, workItemId, this.quantity).subscribe(
        () => {
          console.log('Service item added successfully.');
          // No need to refresh the record, keep the UI as is
        },
        error => {
          console.error('Error adding service item', error);
          // Rollback the UI change if needed or show an error message
          this.selectedServiceRecord.serviceItems.pop(); // Remove the last added item
        }
      );
    } else {
      console.error('Required data is missing: selectedServiceRecord, selectedWorkItem, or quantity.');
    }
  }
  
  completeServiceRecord(): void {
    if (this.selectedServiceRecord) {
        const serviceRecordId = this.selectedServiceRecord.id;
        const completedDate = new Date(); // Assuming the current date as the completion date

        // Use the enum value for status
        this.apiService.updateServiceStatus(serviceRecordId, ServiceStatus.COMPLETED, completedDate).subscribe(
            () => {
                // Successfully updated status
                // Remove the completed service record from the scheduledVehicles array
                this.scheduledVehicles = this.scheduledVehicles.filter(record => record.id !== serviceRecordId);

                this.selectedServiceRecord = null; // Clear selection or handle as needed

                // Optionally, refresh the serviced records list
                // this.getScheduledVehicles(); // Uncomment this line if needed to refresh the entire list
            },
            error => {
                console.error('Error updating service status', error);
                // Optionally: Show user-friendly error message
            }
        );
    } else {
        console.error('No service record selected for completion.');
    }
  }
}