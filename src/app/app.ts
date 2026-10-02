import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Boxes, House, LucideAngularModule, PanelLeftClose, PanelLeftOpen } from 'lucide-angular';
import { SessionBar } from './core/components/session-bar/session-bar';
import { Session } from './core/services/session/session';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, SessionBar],
  templateUrl: './app.html',
  host: {
    class: 'block h-dvh bg-background font-sans text-foreground',
  },
})
export class App {
  protected readonly session = inject(Session);
  protected readonly collapsed = signal(false);
  protected readonly inicioIcon = House;
  protected readonly catalogIcon = Boxes;
  protected readonly collapseIcon = PanelLeftClose;
  protected readonly expandIcon = PanelLeftOpen;

  protected toggleSidebar(): void {
    this.collapsed.update((value) => !value);
  }
}
