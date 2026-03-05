import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Viewer } from '../js/viewer.js';

// PeerJS 목 객체
function createMockPeer() {
  const handlers = {};
  return {
    on: vi.fn((event, handler) => { handlers[event] = handler; }),
    call: vi.fn(),
    destroy: vi.fn(),
    _trigger: (event, ...args) => { if (handlers[event]) handlers[event](...args); },
    _handlers: handlers
  };
}

let mockPeerInstance;
beforeEach(() => {
  mockPeerInstance = createMockPeer();
  globalThis.Peer = vi.fn(function () {
    return mockPeerInstance;
  });
});

describe('Viewer', () => {
  it('클래스가 존재해야 한다', () => {
    expect(typeof Viewer).toBe('function');
  });

  it('init() 호출 시 PeerJS 인스턴스를 생성해야 한다', async () => {
    const viewer = new Viewer();
    const initPromise = viewer.init();
    expect(globalThis.Peer).toHaveBeenCalled();
    expect(viewer.peer).toBeDefined();

    mockPeerInstance._trigger('open');
    await initPromise;
  });

  it('init() 시 onStatusChange 콜백 호출', async () => {
    const viewer = new Viewer();
    const callback = vi.fn();
    viewer.onStatusChange = callback;

    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    expect(callback).toHaveBeenCalledWith('ready', '연결 준비 완료');
  });

  it('connect() 시 peer.call() 호출', async () => {
    const mockCallHandlers = {};
    const mockCall = {
      on: vi.fn((event, handler) => { mockCallHandlers[event] = handler; })
    };
    mockPeerInstance.call.mockReturnValue(mockCall);

    const viewer = new Viewer();
    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    viewer.connect('test-sharer-id');
    expect(mockPeerInstance.call).toHaveBeenCalled();
    expect(mockPeerInstance.call.mock.calls[0][0]).toBe('test-sharer-id');
  });

  it('스트림 수신 시 onStreamReceived 콜백 호출', async () => {
    const mockCallHandlers = {};
    const mockCall = {
      on: vi.fn((event, handler) => { mockCallHandlers[event] = handler; })
    };
    mockPeerInstance.call.mockReturnValue(mockCall);

    const viewer = new Viewer();
    const streamCallback = vi.fn();
    viewer.onStreamReceived = streamCallback;

    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    viewer.connect('test-id');

    const mockStream = { id: 'remote-stream' };
    mockCallHandlers['stream'](mockStream);

    expect(streamCallback).toHaveBeenCalledWith(mockStream);
  });

  it('connect() 시 onStatusChange "connecting" 호출', async () => {
    const mockCall = {
      on: vi.fn()
    };
    mockPeerInstance.call.mockReturnValue(mockCall);

    const viewer = new Viewer();
    const statusCallback = vi.fn();
    viewer.onStatusChange = statusCallback;

    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    viewer.connect('test-id');
    expect(statusCallback).toHaveBeenCalledWith('connecting', '연결 중...');
  });

  it('disconnect() 시 call 종료', async () => {
    const mockCall = {
      on: vi.fn(),
      close: vi.fn()
    };
    mockPeerInstance.call.mockReturnValue(mockCall);

    const viewer = new Viewer();
    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    viewer.connect('test-id');
    viewer.disconnect();

    expect(mockCall.close).toHaveBeenCalled();
    expect(viewer.currentCall).toBeNull();
  });

  it('destroy() 시 피어 종료', async () => {
    const viewer = new Viewer();
    const initPromise = viewer.init();
    mockPeerInstance._trigger('open');
    await initPromise;

    viewer.destroy();

    expect(mockPeerInstance.destroy).toHaveBeenCalled();
    expect(viewer.peer).toBeNull();
  });

  it('피어 없이 connect() 호출 시 에러 콜백', () => {
    const viewer = new Viewer();
    const errorCallback = vi.fn();
    viewer.onError = errorCallback;

    viewer.connect('test-id');
    expect(errorCallback).toHaveBeenCalled();
  });

  it('PeerJS error 이벤트 시 init() reject', async () => {
    const viewer = new Viewer();
    const initPromise = viewer.init();

    const mockError = { type: 'network' };
    mockPeerInstance._trigger('error', mockError);

    await expect(initPromise).rejects.toBe(mockError);
  });
});
