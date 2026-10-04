import { Component } from '@angular/core';
import { PageLayout } from '../../core/layouts/page-layout/page-layout';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [PageLayout],
  templateUrl: './home.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class HomeView {}
