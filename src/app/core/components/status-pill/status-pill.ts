import { Component, input } from '@angular/core';

export type StatusTone = 'accent' | 'muted' | 'destructive';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  templateUrl: './status-pill.html',
})
export class StatusPill {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('muted');
}
