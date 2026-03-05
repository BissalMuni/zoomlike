// 앱 오케스트레이션 — UI 이벤트 바인딩, 공유자/뷰어 흐름 제어

import { Sharer } from './sharer.js';
import { Viewer } from './viewer.js';

(function () {
  'use strict';

  // DOM 요소
  const $ = (id) => document.getElementById(id);
  const roleSelect = $('role-select');
  const sharerPanel = $('sharer-panel');
  const viewerPanel = $('viewer-panel');

  // 공유자 UI 요소
  const btnSharer = $('btn-sharer');
  const btnStartShare = $('btn-start-share');
  const btnStopShare = $('btn-stop-share');
  const btnCopy = $('btn-copy');
  const btnBackSharer = $('btn-back-sharer');
  const sharerStatus = $('sharer-status');
  const peerIdDisplay = $('peer-id-display');
  const peerIdText = $('peer-id-text');
  const localVideo = $('local-video');

  // 뷰어 UI 요소
  const btnViewer = $('btn-viewer');
  const btnConnect = $('btn-connect');
  const btnBackViewer = $('btn-back-viewer');
  const viewerStatus = $('viewer-status');
  const inputPeerId = $('input-peer-id');
  const remoteVideo = $('remote-video');

  let sharer = null;
  let viewer = null;

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
    roleSelect.classList.remove('hidden');
    sharerPanel.classList.add('hidden');
    viewerPanel.classList.add('hidden');
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
    };

    sharer.onStreamReady = (stream) => {
      localVideo.srcObject = stream;
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

    // URL 해시에 peer ID가 있으면 자동 연결
    const hashId = window.location.hash.slice(1);
    if (hashId) {
      inputPeerId.value = hashId;
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

  btnConnect.addEventListener('click', connectToSharer);

  // Enter 키로 연결
  inputPeerId.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') connectToSharer();
  });
})();
