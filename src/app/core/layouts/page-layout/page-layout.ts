import { Component, computed, contentChild, input, signal } from '@angular/core';
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';
import { PageHeaderContent, PageHeaderFooter } from './page-header-slots';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './page-layout.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class PageLayout {
  readonly footer = input(false);

  protected readonly headerContent = contentChild(PageHeaderContent);
  protected readonly headerFooter = contentChild(PageHeaderFooter);

  readonly collapsed = signal(false);
  readonly collapsible = computed(() => !!this.headerContent() || !!this.headerFooter());

  readonly gridTemplateRows = computed(() => {
    const rows = ['auto'];
    const expandedRow = this.collapsed() ? '0fr' : '1fr';
    if (this.headerContent()) rows.push(expandedRow);
    if (this.headerFooter()) rows.push(expandedRow);
    return rows.join(' ');
  });

  protected readonly collapseIcon = ChevronUp;
  protected readonly expandIcon = ChevronDown;

  toggleHeader(): void {
    this.collapsed.update((value) => !value);
  }
}
