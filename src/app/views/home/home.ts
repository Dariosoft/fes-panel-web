import { Component } from '@angular/core';

@Component({
  selector: 'app-home-view',
  standalone: true,
  templateUrl: './home.html',
  host: { class: 'block min-h-0 flex-1 overflow-y-auto' },
})
export class HomeView {}
