// 화면 수신 모듈 — PeerJS로 스트림 수신 + 화면 표시

/**
 * Viewer 클래스
 * - PeerJS 피어 생성
 * - 공유자에 연결 요청
 * - 수신된 스트림을 video 요소에 표시
 */
class Viewer {
  constructor() {
    this.peer = null;
    this.currentCall = null;
    this.dataConn = null;
    this.onStatusChange = null;
    this.onStreamReceived = null;
    this.onError = null;
    this.onChatMessage = null;
  }

  /**
   * PeerJS 피어 초기화
   * @returns {Promise<void>} 피어 open 시 resolve
   */
  init() {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(null, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        if (this.onStatusChange) this.onStatusChange('ready', '연결 준비 완료');
        resolve();
      });

      this.peer.on('error', (err) => {
        if (this.onError) this.onError(err);
        if (this.onStatusChange) this.onStatusChange('error', '오류: ' + err.type);
        reject(err);
      });

      this.peer.on('disconnected', () => {
        if (this.onStatusChange) this.onStatusChange('disconnected', '서버 연결 끊김');
      });
    });
  }

  /**
   * 공유자에 연결
   * @param {string} sharerId - 공유자의 peer ID
   */
  connect(sharerId) {
    if (!this.peer) {
      if (this.onError) this.onError(new Error('피어가 초기화되지 않았습니다'));
      return;
    }

    if (this.onStatusChange) this.onStatusChange('connecting', '연결 중...');

    // 데이터 채널 연결 (채팅용)
    const dataConn = this.peer.connect(sharerId);
    this.dataConn = dataConn;
    dataConn.on('data', (data) => {
      if (this.onChatMessage) this.onChatMessage(data);
    });
    dataConn.on('close', () => {
      this.dataConn = null;
    });

    // 빈 스트림으로 call (공유자가 answer로 실제 스트림 반환)
    const call = this.peer.call(sharerId, this._createEmptyStream());
    this.currentCall = call;

    call.on('stream', (remoteStream) => {
      if (this.onStreamReceived) this.onStreamReceived(remoteStream);
      if (this.onStatusChange) this.onStatusChange('connected', '화면 수신 중');
    });

    call.on('close', () => {
      this.currentCall = null;
      if (this.onStatusChange) this.onStatusChange('disconnected', '연결 종료됨');
    });

    call.on('error', (err) => {
      if (this.onError) this.onError(err);
      if (this.onStatusChange) this.onStatusChange('error', '연결 오류');
    });
  }

  /**
   * 채팅 메시지 전송
   * @param {string} message
   */
  sendChat(message) {
    if (this.dataConn && this.dataConn.open) {
      this.dataConn.send(message);
    }
  }

  /**
   * 피어 완전 종료
   */
  destroy() {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
    if (this.dataConn) {
      this.dataConn.close();
      this.dataConn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /**
   * PeerJS call()에 필요한 빈 MediaStream 생성
   * @returns {MediaStream}
   */
  _createEmptyStream() {
    // SDP 협상에 오디오/비디오 모두 포함시키기 위해 빈 트랙 생성
    let stream;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.fillRect(0, 0, 1, 1);
      stream = canvas.captureStream(0);
    } catch { /* 테스트 환경에서는 무시 */ }

    if (!stream) return { getTracks: () => [] };

    // 빈 오디오 트랙 추가 — 없으면 공유자의 오디오가 SDP에 포함되지 않음
    // AudioContext는 유저 제스처 없이 실패할 수 있으므로 별도 try/catch
    try {
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
      audioCtx.close();
    } catch { /* 유저 제스처 없이 AudioContext 생성 실패 시 비디오만 전송 */ }

    return stream;
  }
}

export { Viewer };
