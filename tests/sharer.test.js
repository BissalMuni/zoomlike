import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sharer } from '../js/sharer.js';

// PeerJS 목 객체 생성 함수
function createMockPeer() {
  const handlers = {};
  return {
    on: vi.fn((event, handler) => { handlers[event] = handler; }),
    destroy: vi.fn(),
    _trigger: (event, ...args) => { if (handlers[event]) handlers[event](...args); },
    _handlers: handlers
  };
}

// getDisplayMedia 목
function createMockStream() {
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn()
  };
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    _track: track
  };
}

let mockPeerInstance;
beforeEach(() => {
  mockPeerInstance = createMockPeer();
  // vi.fn()은 arrow function이라 constructor 불가, function 키워드 사용
  globalThis.Peer = vi.fn(function () {
    return mockPeerInstance;
  });
});

describe('Sharer', () => {
  it('클래스가 존재해야 한다', () => {
    expect(typeof Sharer).toBe('function');
  });

  it('init() 호출 시 PeerJS 인스턴스를 생성해야 한다', () => {
    const sharer = new Sharer();
    sharer.init();
    expect(globalThis.Peer).toHaveBeenCalled();
    expect(sharer.peer).toBeDefined();
  });

  it('PeerJS open 이벤트 시 onPeerIdReady 콜백 호출', () => {
    const sharer = new Sharer();
    const callback = vi.fn();
    sharer.onPeerIdReady = callback;
    sharer.init();

    mockPeerInstance._trigger('open', 'test-peer-id');
    expect(callback).toHaveBeenCalledWith('test-peer-id');
  });

  it('PeerJS open 이벤트 시 onStatusChange 콜백 호출', () => {
    const sharer = new Sharer();
    const callback = vi.fn();
    sharer.onStatusChange = callback;
    sharer.init();

    mockPeerInstance._trigger('open', 'test-id');
    expect(callback).toHaveBeenCalledWith('ready', '공유 준비 완료');
  });

  it('startCapture() 시 getDisplayMedia 호출', async () => {
    const mockStream = createMockStream();
    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
    };

    const sharer = new Sharer();
    sharer.init();
    const stream = await sharer.startCapture();

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
    expect(stream).toBe(mockStream);
  });

  it('startCapture() 시 onStreamReady 콜백 호출', async () => {
    const mockStream = createMockStream();
    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
    };

    const sharer = new Sharer();
    const callback = vi.fn();
    sharer.onStreamReady = callback;
    sharer.init();
    await sharer.startCapture();

    expect(callback).toHaveBeenCalledWith(mockStream);
  });

  it('stopCapture() 시 트랙 중지 및 상태 변경', async () => {
    const mockStream = createMockStream();
    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
    };

    const sharer = new Sharer();
    const statusCallback = vi.fn();
    sharer.onStatusChange = statusCallback;
    sharer.init();
    await sharer.startCapture();

    sharer.stopCapture();
    expect(mockStream._track.stop).toHaveBeenCalled();
    expect(sharer.stream).toBeNull();
    expect(statusCallback).toHaveBeenCalledWith('ready', '공유 중지됨');
  });

  it('뷰어가 call 요청 시 스트림으로 answer해야 한다', async () => {
    const mockStream = createMockStream();
    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockStream)
    };

    const sharer = new Sharer();
    sharer.init();
    await sharer.startCapture();

    const mockCall = {
      answer: vi.fn(),
      on: vi.fn()
    };
    mockPeerInstance._trigger('call', mockCall);

    expect(mockCall.answer).toHaveBeenCalledWith(mockStream);
  });

  it('destroy() 시 피어 종료', () => {
    const sharer = new Sharer();
    sharer.init();
    sharer.destroy();

    expect(mockPeerInstance.destroy).toHaveBeenCalled();
    expect(sharer.peer).toBeNull();
  });

  it('PeerJS error 이벤트 시 onError 콜백 호출', () => {
    const sharer = new Sharer();
    const errorCallback = vi.fn();
    sharer.onError = errorCallback;
    sharer.init();

    const mockError = { type: 'network' };
    mockPeerInstance._trigger('error', mockError);
    expect(errorCallback).toHaveBeenCalledWith(mockError);
  });

  it('getDisplayMedia 실패 시 에러 전파', async () => {
    navigator.mediaDevices = {
      getDisplayMedia: vi.fn().mockRejectedValue(new Error('Permission denied'))
    };

    const sharer = new Sharer();
    const errorCallback = vi.fn();
    sharer.onError = errorCallback;
    sharer.init();

    await expect(sharer.startCapture()).rejects.toThrow('Permission denied');
    expect(errorCallback).toHaveBeenCalled();
  });
});
