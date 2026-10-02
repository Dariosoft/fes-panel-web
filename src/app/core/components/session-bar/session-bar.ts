import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LogIn, LogOut, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-session-bar',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './session-bar.html',
})
export class SessionBar {
  readonly authenticated = input(false);
  readonly name = input('');
  readonly email = input('');
  readonly notice = input<string | null>(null);
  readonly collapsed = input(false);

  readonly enterWithGoogle = output<void>();
  readonly logout = output<void>();

  readonly loginIcon = LogIn;
  readonly logoutIcon = LogOut;
}
