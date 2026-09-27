import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-session-bar',
  standalone: true,
  templateUrl: './session-bar.html',
  styleUrl: './session-bar.css',
})
export class SessionBar {
  readonly authenticated = input(false);
  readonly name = input('');
  readonly email = input('');
  readonly notice = input<string | null>(null);

  readonly enterWithGoogle = output<void>();
  readonly logout = output<void>();
}
