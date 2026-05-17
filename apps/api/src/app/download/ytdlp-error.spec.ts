import { classifyYtdlpError, ClassifiedYtdlpError } from './ytdlp-error';

describe('classifyYtdlpError', () => {
  it.each([
    ['Private video. Sign in if you have rights', 'private', 400],
    ['Video is age-restricted', 'private', 400],
    ['This video is not available in your country', 'geo-blocked', 400],
    ['Video unavailable', 'not-found', 400],
    ['HTTP Error 404: Not Found', 'not-found', 400],
    ['Removed by the uploader', 'not-found', 400],
    ['Unsupported URL: foo://bar', 'unsupported', 400],
    ['HTTP Error 503: Service Unavailable', 'network', 502],
    ['Connection timed out', 'network', 502],
    ['getaddrinfo ENOTFOUND example.com', 'network', 502],
    ['Some weird thing happened', 'unknown', 400],
  ])('classifies "%s" → kind=%s status=%s', (raw: string, expectedKind: string, expectedStatus: number) => {
    const result: ClassifiedYtdlpError = classifyYtdlpError(new Error(raw));
    expect(result.kind).toBe(expectedKind);
    expect(result.httpStatus).toBe(expectedStatus);
    expect(result.errorDetail).toContain(raw);
  });

  it('handles non-Error inputs', () => {
    const result: ClassifiedYtdlpError = classifyYtdlpError('plain string');
    expect(result.kind).toBe('unknown');
    expect(result.errorDetail).toBe('plain string');
  });

  it('truncates very long stderr tails', () => {
    const huge: string = 'x'.repeat(2000);
    const result: ClassifiedYtdlpError = classifyYtdlpError(new Error(huge));
    expect(result.errorDetail.length).toBeLessThanOrEqual(601);
    expect(result.errorDetail.startsWith('…')).toBe(true);
  });
});
