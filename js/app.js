// 앱 오케스트레이션 — UI 이벤트 바인딩, 공유자/뷰어 흐름 제어

import { Sharer } from './sharer.js';
import { Viewer } from './viewer.js';
import { buildShareUrl, getPeerIdFromUrl } from './url.js';
import { PASSWORD_HASH } from './config.js';
import { playConnectSound } from './sound.js';
import { ChatWindow } from './chat-window.js';

(function () {
  'use strict';

  // DOM 요소
  const $ = (id) => document.getElementById(id);
  const loginScreen = $('login-screen');
  const inputPassword = $('input-password');
  const btnLogin = $('btn-login');
  const loginError = $('login-error');
  const roleSelect = $('role-select');
  const sharerPanel = $('sharer-panel');
  const viewerPanel = $('viewer-panel');

  // 공유자 UI 요소
  const btnSharer = $('btn-sharer');
  const btnStartShare = $('btn-start-share');
  const btnStopShare = $('btn-stop-share');
  const btnCopy = $('btn-copy');
  const btnCopyUrl = $('btn-copy-url');
  const btnBackSharer = $('btn-back-sharer');
  const sharerStatus = $('sharer-status');
  const peerIdDisplay = $('peer-id-display');
  const peerIdText = $('peer-id-text');
  const shareUrlDisplay = $('share-url-display');
  const shareUrlText = $('share-url-text');
  const localVideo = $('local-video');

  // 뷰어 UI 요소
  const btnViewer = $('btn-viewer');
  const btnConnect = $('btn-connect');
  const btnBackViewer = $('btn-back-viewer');
  const viewerStatus = $('viewer-status');
  const inputPeerId = $('input-peer-id');
  const remoteVideo = $('remote-video');
  const btnFullscreen = $('btn-fullscreen');

  // 채팅
  const btnSharerChatToggle = $('btn-sharer-chat-toggle');
  const btnViewerChatToggle = $('btn-viewer-chat-toggle');
  const chatWin = new ChatWindow();

  let sharer = null;
  let viewer = null;

  // --- 인증 ---

  /** SHA-256 해시 생성 */
  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** 비밀번호 검증 후 역할 선택 화면으로 전환 */
  async function handleLogin() {
    const password = inputPassword.value;
    if (!password) return;

    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
      loginScreen.classList.add('hidden');
      roleSelect.classList.remove('hidden');

      // URL에 peer 파라미터가 있으면 자동으로 뷰어 모드 진입
      if (getPeerIdFromUrl()) {
        initViewer();
      }
    } else {
      loginError.classList.remove('hidden');
      inputPassword.value = '';
      inputPassword.focus();
    }
  }

  btnLogin.addEventListener('click', handleLogin);
  inputPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // --- 유틸리티 ---

  /** 상태 표시 업데이트 */
  function updateStatus(el, state, message) {
    el.textContent = message;
    el.className = 'status';
    if (state === 'connected' || state === 'sharing') {
      el.classList.add('connected');
    } else if (state === 'error') {
      el.classList.add('error');
    }
  }

  /** 화면 전환 */
  function showPanel(panel) {
    roleSelect.classList.add('hidden');
    sharerPanel.classList.add('hidden');
    viewerPanel.classList.add('hidden');
    panel.classList.remove('hidden');
  }

  /** 역할 선택 화면으로 복귀 */
  function backToRoleSelect() {
    if (sharer) {
      sharer.destroy();
      sharer = null;
    }
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    btnStartShare.classList.remove('hidden');
    btnStopShare.classList.add('hidden');
    peerIdDisplay.classList.add('hidden');
    shareUrlDisplay.classList.add('hidden');
    chatWin.close();
    btnSharerChatToggle.classList.add('hidden');
    btnViewerChatToggle.classList.add('hidden');
    roleSelect.classList.remove('hidden');
    sharerPanel.classList.add('hidden');
    viewerPanel.classList.add('hidden');
  }

  // --- 채팅 ---

  /** 채팅 윈도우 열기 + 전송 콜백 연결 */
  function openChat() {
    chatWin.onSend = (msg) => {
      if (sharer) sharer.sendChat(msg);
      if (viewer) viewer.sendChat(msg);
    };
    chatWin.open();
    // 알림 배지 제거
    btnSharerChatToggle.textContent = '💬 채팅';
    btnViewerChatToggle.textContent = '💬 채팅';
  }

  /** 메시지 도착 알림 (채팅 윈도우가 닫혀있을 때) */
  function notifyChat(btn) {
    if (!btn.textContent.includes('🔴')) {
      btn.textContent = '🔴 채팅 (새 메시지)';
    }
  }

  // --- 공유자 흐름 ---

  function initSharer() {
    sharer = new Sharer();

    sharer.onStatusChange = (state, msg) => {
      updateStatus(sharerStatus, state, msg);
    };

    sharer.onPeerIdReady = (id) => {
      peerIdText.textContent = id;
      peerIdDisplay.classList.remove('hidden');
      // 공유 URL 생성 및 표시
      shareUrlText.value = buildShareUrl(id);
      shareUrlDisplay.classList.remove('hidden');
    };

    sharer.onStreamReady = (stream) => {
      localVideo.srcObject = stream;
    };

    sharer.onViewerConnected = () => {
      playConnectSound();
      btnSharerChatToggle.classList.remove('hidden');
    };

    sharer.onChatMessage = (msg) => {
      chatWin.appendMessage('뷰어:', msg, false);
      if (!chatWin.isOpen) notifyChat(btnSharerChatToggle);
    };

    sharer.onError = (err) => {
      console.error('Sharer error:', err);
    };

    sharer.init();
    showPanel(sharerPanel);
  }

  async function startSharing() {
    try {
      btnStartShare.disabled = true;
      await sharer.startCapture();
      btnStartShare.classList.add('hidden');
      btnStopShare.classList.remove('hidden');
    } catch {
      btnStartShare.disabled = false;
    }
  }

  function stopSharing() {
    sharer.stopCapture();
    localVideo.srcObject = null;
    btnStopShare.classList.add('hidden');
    btnStartShare.classList.remove('hidden');
    btnStartShare.disabled = false;
  }

  // --- 뷰어 흐름 ---

  async function initViewer() {
    viewer = new Viewer();

    viewer.onStatusChange = (state, msg) => {
      updateStatus(viewerStatus, state, msg);
    };

    viewer.onStreamReceived = (stream) => {
      remoteVideo.srcObject = stream;
      // 일부 브라우저에서 명시적 play() 필요
      remoteVideo.play().catch(() => {});
      btnViewerChatToggle.classList.remove('hidden');
    };

    viewer.onChatMessage = (msg) => {
      chatWin.appendMessage('공유자:', msg, false);
      if (!chatWin.isOpen) notifyChat(btnViewerChatToggle);
    };

    viewer.onError = (err) => {
      console.error('Viewer error:', err);
      btnConnect.disabled = false;
    };

    showPanel(viewerPanel);

    try {
      await viewer.init();
    } catch {
      updateStatus(viewerStatus, 'error', '피어 초기화 실패');
    }

    // URL 쿼리 파라미터에 peer ID가 있으면 자동 연결
    const urlPeerId = getPeerIdFromUrl();
    if (urlPeerId) {
      inputPeerId.value = urlPeerId;
      connectToSharer();
    }
  }

  function connectToSharer() {
    const peerId = inputPeerId.value.trim();
    if (!peerId) return;
    btnConnect.disabled = true;
    viewer.connect(peerId);
  }

  // --- 이벤트 바인딩 ---

  btnSharer.addEventListener('click', initSharer);
  btnViewer.addEventListener('click', initViewer);
  btnStartShare.addEventListener('click', startSharing);
  btnStopShare.addEventListener('click', stopSharing);
  btnBackSharer.addEventListener('click', backToRoleSelect);
  btnBackViewer.addEventListener('click', backToRoleSelect);

  btnCopy.addEventListener('click', () => {
    const id = peerIdText.textContent;
    navigator.clipboard.writeText(id).then(() => {
      btnCopy.textContent = '복사됨!';
      setTimeout(() => { btnCopy.textContent = '복사'; }, 1500);
    });
  });

  // 공유 URL 복사 버튼
  btnCopyUrl.addEventListener('click', () => {
    const url = shareUrlText.value;
    navigator.clipboard.writeText(url).then(() => {
      btnCopyUrl.textContent = '복사됨!';
      setTimeout(() => { btnCopyUrl.textContent = 'URL 복사'; }, 1500);
    });
  });

  // 전체화면 토글 — video 요소 직접 사용 (div보다 호환성 높음)
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      const req = remoteVideo.requestFullscreen
        || remoteVideo.webkitRequestFullscreen
        || remoteVideo.mozRequestFullScreen
        || remoteVideo.msRequestFullscreen;
      if (req) req.call(remoteVideo);
    } else {
      (document.exitFullscreen
        || document.webkitExitFullscreen
        || document.mozCancelFullScreen
        || document.msExitFullscreen).call(document);
    }
  });

  // 전체화면 해제 시 버튼 아이콘 복원
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      btnFullscreen.textContent = '⛶';
      btnFullscreen.title = '전체화면';
    } else {
      btnFullscreen.textContent = '✕';
      btnFullscreen.title = '전체화면 해제';
    }
  });

  btnConnect.addEventListener('click', connectToSharer);

  // Enter 키로 연결
  inputPeerId.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectToSharer();
  });

  btnSharerChatToggle.addEventListener('click', openChat);
  btnViewerChatToggle.addEventListener('click', openChat);

  // 페이지 로드 시 비밀번호 입력에 포커스
  inputPassword.focus();
})();
