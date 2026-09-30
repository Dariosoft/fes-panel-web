import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionBar } from './core/components/session-bar/session-bar';
import { Session } from './core/services/session/session';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionBar],
  templateUrl: './app.html',
  host: {
    class: 'block min-h-dvh bg-background font-sans text-foreground',
  },
})
export class App {
  protected readonly session = inject(Session);
}
