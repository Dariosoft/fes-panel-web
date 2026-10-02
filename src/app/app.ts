import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Boxes, House, LucideAngularModule } from 'lucide-angular';
import { SessionBar } from './core/components/session-bar/session-bar';
import { Session } from './core/services/session/session';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, SessionBar],
  templateUrl: './app.html',
  host: {
    class: 'block h-dvh bg-background font-sans text-foreground',
  },
})
export class App {
  protected readonly session = inject(Session);
  protected readonly inicioIcon = House;
  protected readonly catalogIcon = Boxes;
}
