import { Directive } from '@angular/core';

@Directive({
  selector: '[appPageHeaderContent]',
  standalone: true,
})
export class PageHeaderContent {}

@Directive({
  selector: '[appPageHeaderFooter]',
  standalone: true,
})
export class PageHeaderFooter {}
