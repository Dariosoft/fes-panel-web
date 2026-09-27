import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-session-bar',
  standalone: true,
  template: `
    <div class="session-bar">
      @if (authenticated()) {
        <div class="session-bar__profile">
          <p class="session-bar__name">{{ name() }}</p>
          <p class="session-bar__email">{{ email() }}</p>
        </div>
        <button type="button" class="session-bar__action" (click)="logout.emit()">
          Salir
        </button>
      } @else {
        <button type="button" class="session-bar__action" (click)="enterWithGoogle.emit()">
          Entrar con Google
        </button>
      }

      @if (notice()) {
        <p class="session-bar__notice" role="alert">{{ notice() }}</p>
      }
    </div>
  `,
  styles: `
    .session-bar {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-family: system-ui, sans-serif;
    }

    .session-bar__profile {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .session-bar__name,
    .session-bar__email {
      margin: 0;
      word-break: break-word;
    }

    .session-bar__name {
      color: #f3ead8;
      font-size: 0.95rem;
    }

    .session-bar__email {
      color: #bcc5bf;
      font-size: 0.85rem;
    }

    .session-bar__action {
      min-height: 44px;
      min-width: 44px;
      padding: 0.65rem 1rem;
      border: 1px solid #4d5a53;
      background: transparent;
      color: #c9e2b5;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .session-bar__action:focus-visible {
      outline: 2px solid #c9e2b5;
      outline-offset: 2px;
    }

    .session-bar__notice {
      margin: 0;
      color: #f3ead8;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  `,
})
export class SessionBar {
  readonly authenticated = input(false);
  readonly name = input('');
  readonly email = input('');
  readonly notice = input<string | null>(null);

  readonly enterWithGoogle = output<void>();
  readonly logout = output<void>();
}
