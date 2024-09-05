import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { NavigationItem } from '../page-side-nav/page-side-nav.component';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent implements OnInit, OnDestroy {

  loggedIn: boolean = false;
  name: string = '';
  panelName: string = '';
  navItems: NavigationItem[] = [];
  private userStatusSubscription: Subscription;
  showLogoutButton: boolean = true;

  constructor(private apiService: ApiService, private router: Router) {
    this.userStatusSubscription = this.apiService.userStatusObservable.subscribe({
      next: (res) => {
        if (res === 'loggedIn') {
          this.loggedIn = true;
          let user = this.apiService.getUserInfo()!;
          this.name = `${user.firstName} ${user.lastName}`;
        } else {
          this.loggedIn = false;
          this.name = '';
        }
      },
    });
  }

  ngOnInit(): void {
    // Subscribe to user status changes
    this.userStatusSubscription = this.apiService.userStatusObservable.subscribe(status => {
      if (status === 'loggedIn') {
        this.checkUserStatus();
      } else {
        this.redirectToLogin();
      }
    });

    // Check the current route to control the visibility of the logout button
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showLogoutButton = !['/login', '/register'].includes(event.url);
      }
    });

    // Initial check
    if (this.apiService.isLoggedIn()) {
      this.checkUserStatus();
    } else {
      this.redirectToLogin();
    }
  }

  checkUserStatus(): void {
    const userType = this.apiService.getUserType();
    if (userType === 'ADMIN') {
      this.panelName = 'Admin Panel';
      this.navItems = [
        { value: 'Due for Servicing', link: '/all-vehicles' },
        { value: 'Under Servicing', link: '/under-servicing' },
        { value: 'Serviced Vehicles', link: '/serviced-vehicles' },
        { value: 'Manage Vehicles', link: '/manage-vehicles' },
        { value: 'Manage Service Representatives', link: '/manage-s-a' },
        { value: 'Manage Work Items', link: '/manage-work-items' },
        { value: 'Reports', link: '/reports' }
      ];
      this.router.navigateByUrl('/admin-home');
    } else if (userType === 'SERVICE_ADVISOR') {
      this.panelName = 'Service Advisor Panel';
      this.navItems = [
        { value: 'Scheduled Vehicles', link: '/service-records' },
      ];
      this.router.navigateByUrl('/service-advisor-home');
    } else {
      this.redirectToLogin();
    }
  }

  logout(): void {
    this.apiService.logout();
    this.redirectToLogin();
  }

  private redirectToLogin(): void {
    this.panelName = 'Auth Panel';
    this.navItems = [];
    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    // Clean up the subscription to prevent memory leaks
    if (this.userStatusSubscription) {
      this.userStatusSubscription.unsubscribe();
    }
  }

  trackByFunction(index: number, item: NavigationItem): string {
    return item.link; // or any unique identifier of your items
  }
}
