import { environment } from './environment';
import { environment as developmentEnvironment } from './environment.development';

describe('environments', () => {
  it('resolves a development apiBaseUrl without a trailing slash', () => {
    expect(developmentEnvironment.apiBaseUrl).toBe('https://api.friendly-e-shop.duckdns.org');
    expect(developmentEnvironment.apiBaseUrl.endsWith('/')).toBe(false);
    // Under the development build used by unit tests, fileReplacements swap
    // environment.ts for environment.development.ts.
    expect(environment.apiBaseUrl).toBe(developmentEnvironment.apiBaseUrl);
  });

  it('does not embed Google client credentials', () => {
    const serialized = JSON.stringify(developmentEnvironment);
    expect(serialized).not.toMatch(/GOOGLE_CLIENT/i);
    expect(serialized).not.toMatch(/client[_-]?secret/i);
  });
});
