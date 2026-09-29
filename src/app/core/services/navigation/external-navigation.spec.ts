import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ExternalNavigation } from './external-navigation';

describe('ExternalNavigation', () => {
  it('delegates external navigation to the browser document', () => {
    const document = {
      location: {
        assign: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: document }],
    });

    TestBed.inject(ExternalNavigation).navigateTo('https://accounts.example.test/login');

    expect(document.location.assign).toHaveBeenCalledWith('https://accounts.example.test/login');
  });
});
