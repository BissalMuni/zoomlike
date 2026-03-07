// 화면 공유 모듈 — 화면 캡처 + PeerJS 연결 관리

/**
 * Sharer 클래스
 * - 화면 캡처 시작/중지
 * - PeerJS 피어 생성 및 연결 수락
 * - 스트림 전송
 */
class Sharer {
  constructor() {
    this.peer = null;
    this.stream = null;
    this.currentCall = null;
    this.onStatusChange = null;
    this.onPeerIdReady = null;
    this.onStreamReady = null;
    this.onError = null;
  }

  /**
   * PeerJS 피어 초기화
   * Google STUN 서버 사용
   */
  init() {
    // PeerJS 인스턴스 생성 (Google STUN 사용)
    this.peer = new Peer(null, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      if (this.onPeerIdReady) this.onPeerIdReady(id);
      if (this.onStatusChange) this.onStatusChange('ready', '공유 준비 완료');
    });

    // 뷰어가 연결 요청 시
    this.peer.on('call', (call) => {
      if (!this.stream) return;
      call.answer(this.stream);
      this.currentCall = call;
      if (this.onStatusChange) this.onStatusChange('connected', '뷰어 연결됨');

      call.on('close', () => {
        this.currentCall = null;
        if (this.onStatusChange) this.onStatusChange('ready', '뷰어 연결 해제됨');
      });
    });

    this.peer.on('error', (err) => {
      if (this.onError) this.onError(err);
      if (this.onStatusChange) this.onStatusChange('error', '오류: ' + err.type);
    });

    this.peer.on('disconnected', () => {
      if (this.onStatusChange) this.onStatusChange('disconnected', '서버 연결 끊김');
    });
  }

  /**
   * 화면 캡처 시작
   * @returns {Promise<MediaStream>}
   */
  async startCapture() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        // 시스템 오디오(스테레오) 캡처 — 마이크 아님
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2
        }
      });

      // 사용자가 브라우저 UI로 공유를 중지했을 때
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopCapture();
      });

      if (this.onStreamReady) this.onStreamReady(this.stream);
      if (this.onStatusChange) this.onStatusChange('sharing', '화면 공유 중');

      return this.stream;
    } catch (err) {
      if (this.onError) this.onError(err);
      if (this.onStatusChange) this.onStatusChange('error', '화면 캡처 실패');
      throw err;
    }
  }

  /**
   * 화면 캡처 중지
   */
  stopCapture() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    if (this.onStatusChange) this.onStatusChange('ready', '공유 중지됨');
  }

  /**
   * 피어 완전 종료
   */
  destroy() {
    this.stopCapture();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export { Sharer };
