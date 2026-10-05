import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderContent } from './page-header-slots';
import { PageLayout } from './page-layout';

@Component({
  standalone: true,
  imports: [PageLayout, PageHeaderContent],
  template: `
    <app-page-layout>
      <p pageTitle>Titulo</p>
      <button pageActions>Accion</button>
      <div appPageHeaderContent>Filtros</div>
      <div>Cuerpo</div>
    </app-page-layout>
  `,
})
class CollapsibleHost {}

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <app-page-layout>
      <p pageTitle>Titulo</p>
      <div>Cuerpo</div>
    </app-page-layout>
  `,
})
class PlainHost {}

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <app-page-layout [footer]="true">
      <p pageTitle>Titulo</p>
      <div>Cuerpo</div>
      <div pageFooter>Pie</div>
    </app-page-layout>
  `,
})
class WithFooterHost {}

describe('PageLayout', () => {
  const create = async (host: typeof PlainHost | typeof CollapsibleHost | typeof WithFooterHost) => {
    TestBed.configureTestingModule({ imports: [host] });
    const fixture: ComponentFixture<unknown> = TestBed.createComponent(host);
    await fixture.whenStable();
    return fixture;
  };

  const toggleButton = (fixture: ComponentFixture<unknown>): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('button[aria-expanded]');

  it('projects title, actions, header content and body', async () => {
    const fixture = await create(CollapsibleHost);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Titulo');
    expect(text).toContain('Accion');
    expect(text).toContain('Filtros');
    expect(text).toContain('Cuerpo');
  });

  it('hides the footer slot when the footer input is false', async () => {
    const fixture = await create(PlainHost);

    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.classList.contains('hidden')).toBe(true);
  });

  it('shows the footer slot when the footer input is true', async () => {
    const fixture = await create(WithFooterHost);

    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.classList.contains('hidden')).toBe(false);
    expect(footer.textContent).toContain('Pie');
  });

  it('does not offer a collapse toggle without collapsible header content', async () => {
    const plain = await create(PlainHost);

    expect(toggleButton(plain)).toBeNull();
  });

  it('offers a collapse toggle when there is collapsible header content', async () => {
    const collapsible = await create(CollapsibleHost);

    expect(toggleButton(collapsible)).not.toBeNull();
  });

  it('collapses and expands the header content when toggled', async () => {
    const fixture = await create(CollapsibleHost);
    const header = fixture.nativeElement.querySelector('header > div') as HTMLElement;
    const toggle = toggleButton(fixture);

    expect(header.style.gridTemplateRows).toBe('auto 1fr');

    (toggle as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(header.style.gridTemplateRows).toBe('auto 0fr');

    (toggle as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(header.style.gridTemplateRows).toBe('auto 1fr');
  });
});
