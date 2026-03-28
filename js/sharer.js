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
    this.calls = [];
    this.dataConns = [];
    this.onStatusChange = null;
    this.onPeerIdReady = null;
    this.onStreamReady = null;
    this.onError = null;
    this.onChatMessage = null;
    this.onViewerConnected = null;
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

    // 뷰어가 연결 요청 시 (최대 5명)
    this.peer.on('call', (call) => {
      if (!this.stream) return;
      if (this.calls.length >= 5) {
        call.close();
        return;
      }
      call.answer(this.stream);
      this.calls.push(call);
      if (this.onViewerConnected) this.onViewerConnected();
      if (this.onStatusChange) this.onStatusChange('connected', `뷰어 ${this.calls.length}명 연결됨`);

      call.on('close', () => {
        this.calls = this.calls.filter((c) => c !== call);
        const count = this.calls.length;
        if (this.onStatusChange) this.onStatusChange(
          count > 0 ? 'connected' : 'ready',
          count > 0 ? `뷰어 ${count}명 연결됨` : '뷰어 연결 해제됨'
        );
      });
    });

    // 뷰어가 데이터 채널 연결 시 (채팅용)
    this.peer.on('connection', (conn) => {
      this.dataConns.push(conn);
      conn.on('data', (data) => {
        if (this.onChatMessage) this.onChatMessage(data);
      });
      conn.on('close', () => {
        this.dataConns = this.dataConns.filter((c) => c !== conn);
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

    this.calls.forEach((call) => call.close());
    this.calls = [];

    if (this.onStatusChange) this.onStatusChange('ready', '공유 중지됨');
  }

  /**
   * 채팅 메시지 전송
   * @param {string} message
   */
  sendChat(message) {
    this.dataConns.forEach((conn) => {
      if (conn.open) conn.send(message);
    });
  }

  /**
   * 피어 완전 종료
   */
  destroy() {
    this.stopCapture();
    this.dataConns.forEach((conn) => conn.close());
    this.dataConns = [];
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export { Sharer };
