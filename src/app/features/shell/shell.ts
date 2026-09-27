import { Component, inject } from '@angular/core';
import { Session } from '../../core/session/session';
import { SessionBar } from './components/session-bar/session-bar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SessionBar],
  templateUrl: './shell.html',
  host: {
    class: 'block min-h-dvh bg-background font-sans text-foreground',
  },
})
export class Shell {
  protected readonly session = inject(Session);
}
