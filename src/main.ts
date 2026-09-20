import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main>
      <aside><strong>Friendly</strong><span>Panel</span></aside>
      <section><p class="eyebrow">Panel de vendedores</p><h1>Tu tienda empieza acá.</h1><p>La base operativa está lista para incorporar productos, stock y precios.</p></section>
    </main>
  `,
})
export class AppComponent {}

bootstrapApplication(AppComponent).catch(console.error);
