import { Component } from '@angular/core';
import { Shell } from './features/shell/shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Shell],
  template: `<app-shell />`,
})
export class App {}
