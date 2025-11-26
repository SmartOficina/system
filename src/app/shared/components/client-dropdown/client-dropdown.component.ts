import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ClientsService } from '@features/garage-system/components/clients/clients.service';
import { ClientModalComponent } from '../../modals/client-modal/client-modal.component';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-client-dropdown',
  imports: [CommonModule, FormsModule],
  templateUrl: './client-dropdown.component.html',
  styleUrls: ['./client-dropdown.component.scss']
})
export class ClientDropdownComponent implements OnInit, OnDestroy {
  @Input() required: boolean = true;
  @Input() label: string = 'Cliente';
  @Input() placeholder: string = 'Digite o nome do cliente...';
  @Input() selectedClientId: string = '';
  @Input() selectedClientName: string = '';
  @Input() disabled: boolean = false;

  @Output() clientSelected = new EventEmitter<any>();

  searchTerm: string = '';
  filteredClients: any[] = [];
  showDropdown: boolean = false;
  matchingClient: any = null;
  isLoading: boolean = false;
  activeClientModalRef: any = null;
  isClientModalOpen: boolean = false;
  noResultsFound: boolean = false;
  hasBeenTouched: boolean = false;

  private searchSubject: Subject<string> = new Subject<string>();
  private subscription: Subscription = new Subscription();
  private colors = [
    '#4f46e5',
    '#7c3aed',
    '#c026d3',
    '#db2777',
    '#e11d48',
    '#dc2626',
    '#ea580c',
    '#d97706',
    '#65a30d',
    '#16a34a',
    '#0d9488',
    '#0891b2',
    '#0284c7',
    '#2563eb'
  ];

  constructor(
    private clientsService: ClientsService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    if (this.selectedClientName) {
      this.searchTerm = this.selectedClientName;
      this.checkForMatchingClient();
    }

    this.subscription.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(term => {
        this.performSearch(term);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSearchChange(event: any): void {
    if (this.disabled) return;

    this.hasBeenTouched = true;
    this.searchTerm = event;
    this.selectedClientId = '';
    this.matchingClient = null;
    this.showDropdown = true;
    this.searchSubject.next(this.searchTerm);
  }

  performSearch(term: string): void {
    if (!term || term.trim().length < 2) {
      this.filteredClients = [];
      this.showDropdown = false;
      this.noResultsFound = false;
      return;
    }

    this.isLoading = true;
    this.clientsService.listClients(term, 10, 1).subscribe(
      (response: HttpResponse<any>) => {
        this.filteredClients = response.body?.result || [];
        this.showDropdown = true;
        this.noResultsFound = this.filteredClients.length === 0;
        this.checkForMatchingClient();
        this.isLoading = false;
      },
      (error) => {
        this.filteredClients = [];
        this.showDropdown = false;
        this.isLoading = false;
      }
    );
  }

  selectClient(client: any): void {
    if (this.disabled) return;

    this.selectedClientId = client._id;
    this.searchTerm = client.fullName;
    this.matchingClient = client;
    this.showDropdown = false;
    this.clientSelected.emit({
      clientId: client._id,
      client: client
    });
  }

  checkForMatchingClient(): void {
    const exactMatch = this.filteredClients.find(
      client => client.fullName.toLowerCase() === this.searchTerm.toLowerCase()
    );

    if (exactMatch) {
      this.matchingClient = exactMatch;
      this.selectedClientId = exactMatch._id;
      if (this.hasBeenTouched && !this.disabled) {
        this.clientSelected.emit({
          clientId: exactMatch._id,
          client: exactMatch
        });
      }
    } else {
      this.matchingClient = null;
    }
  }

  openAddClientModal(): void {
    if (this.disabled) return;

    this.activeClientModalRef = this.modalService.open(ClientModalComponent, {
      data: {
        client: null
      },
      onClose: () => {
        this.activeClientModalRef = null;
      }
    });

    this.activeClientModalRef.instance.clientSaved.subscribe(() => {
      this.performSearch(this.searchTerm);
      this.modalService.close(this.activeClientModalRef);
      this.activeClientModalRef = null;
    });
  }

  onFocus(): void {
    if (this.disabled) return;

    if (this.searchTerm && this.searchTerm.length >= 2) {
      this.showDropdown = true;
    }
    this.hasBeenTouched = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  isValid(): boolean {
    return !this.required || !!this.selectedClientId;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getClientColor(name: string): string {
    if (!name) return this.colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % this.colors.length);
    return this.colors[index];
  }
}