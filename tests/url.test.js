import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildShareUrl, getPeerIdFromUrl } from '../js/url.js';

describe('buildShareUrl', () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = window.location.href;
  });

  afterEach(() => {
    // jsdom에서 location 복원
    window.history.replaceState(null, '', originalLocation);
  });

  it('피어 ID가 포함된 URL을 생성해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/');
    const url = buildShareUrl('abc123');
    expect(url).toBe('https://example.com/?peer=abc123');
  });

  it('기존 쿼리 파라미터가 있어도 peer 파라미터를 추가해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/?foo=bar');
    const url = buildShareUrl('xyz789');
    const parsed = new URL(url);
    expect(parsed.searchParams.get('peer')).toBe('xyz789');
    expect(parsed.searchParams.get('foo')).toBe('bar');
  });

  it('기존 해시를 제거해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/#old-hash');
    const url = buildShareUrl('test-id');
    expect(url).not.toContain('#old-hash');
    expect(new URL(url).searchParams.get('peer')).toBe('test-id');
  });

  it('기존 peer 파라미터를 덮어써야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/?peer=old-id');
    const url = buildShareUrl('new-id');
    expect(new URL(url).searchParams.get('peer')).toBe('new-id');
  });
});

describe('getPeerIdFromUrl', () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = window.location.href;
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalLocation);
  });

  it('URL에 peer 파라미터가 있으면 반환해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/?peer=my-peer-id');
    expect(getPeerIdFromUrl()).toBe('my-peer-id');
  });

  it('URL에 peer 파라미터가 없으면 null을 반환해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/');
    expect(getPeerIdFromUrl()).toBeNull();
  });

  it('peer 파라미터가 빈 문자열이면 null을 반환해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/?peer=');
    expect(getPeerIdFromUrl()).toBeNull();
  });

  it('다른 파라미터가 있어도 peer 값을 올바르게 추출해야 한다', () => {
    window.history.replaceState(null, '', 'https://example.com/?foo=bar&peer=target-id&baz=qux');
    expect(getPeerIdFromUrl()).toBe('target-id');
  });
});
