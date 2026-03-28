// 별도 브라우저 윈도우 채팅 — window.open()으로 독립 팝업 생성

const MAX_MESSAGES = 200;

// 채팅 윈도우 HTML 템플릿
const CHAT_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>Zoomlike Chat</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#e0e0e0;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.messages{flex:1;overflow-y:auto;padding:0.75rem;display:flex;flex-direction:column;gap:0.4rem}
.msg{font-size:0.85rem;line-height:1.4}
.msg .sender{font-weight:600;margin-right:0.4rem}
.msg.me .sender{color:#7c6ff7}
.msg.them .sender{color:#4caf50}
.input-bar{display:flex;border-top:1px solid #333}
.input-bar input{flex:1;padding:0.6rem 0.75rem;border:none;background:#0f0f1a;color:#e0e0e0;font-size:0.9rem;outline:none}
.input-bar button{padding:0.6rem 1rem;border:none;background:#333;color:#e0e0e0;cursor:pointer;font-size:0.9rem}
.input-bar button:hover{opacity:0.85}
</style>
</head>
<body>
<div class="messages" id="messages"></div>
<div class="input-bar">
  <input type="text" id="input" placeholder="메시지 입력..." autofocus/>
  <button id="btn-send">전송</button>
</div>
<script>
const messages = document.getElementById('messages');
const input = document.getElementById('input');
const btnSend = document.getElementById('btn-send');

// 부모 윈도우에서 호출하는 메시지 추가 함수
window.appendMessage = function(sender, text, isMe) {
  const div = document.createElement('div');
  div.className = 'msg ' + (isMe ? 'me' : 'them');
  const span = document.createElement('span');
  span.className = 'sender';
  span.textContent = sender;
  div.appendChild(span);
  div.appendChild(document.createTextNode(text));
  messages.appendChild(div);
  while (messages.children.length > ${MAX_MESSAGES}) {
    messages.removeChild(messages.firstChild);
  }
  messages.scrollTop = messages.scrollHeight;
};

function send() {
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  window.appendMessage('나:', msg, true);
  // 부모 윈도우에 전달
  if (window.opener && window.opener.__chatSend) {
    window.opener.__chatSend(msg);
  }
}

btnSend.addEventListener('click', send);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') send();
});
</script>
</body>
</html>`;

class ChatWindow {
  constructor() {
    this._win = null;
    this._pending = []; // 윈도우 로드 전 메시지 버퍼
    this.onSend = null; // 메시지 전송 콜백
  }

  /** 채팅 윈도우 열기 */
  open() {
    if (this._win && !this._win.closed) {
      this._win.focus();
      return;
    }

    // 부모 윈도우에 전송 콜백 등록
    window.__chatSend = (msg) => {
      if (this.onSend) this.onSend(msg);
    };

    this._win = window.open('', '_blank',
      'width=360,height=450,left=100,top=100,resizable=yes,scrollbars=no'
    );

    if (!this._win) {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
      return;
    }

    this._win.document.open();
    this._win.document.write(CHAT_HTML);
    this._win.document.close();

    // 버퍼에 쌓인 메시지 플러시
    this._win.addEventListener('load', () => {
      for (const m of this._pending) {
        this._win.appendMessage(m.sender, m.text, m.isMe);
      }
      this._pending = [];
    });
  }

  /** 메시지 추가 (윈도우 열려있으면 바로, 아니면 버퍼) */
  appendMessage(sender, text, isMe) {
    if (this._win && !this._win.closed && this._win.appendMessage) {
      this._win.appendMessage(sender, text, isMe);
    } else {
      this._pending.push({ sender, text, isMe });
    }
  }

  /** 윈도우 닫기 */
  close() {
    if (this._win && !this._win.closed) {
      this._win.close();
    }
    this._win = null;
    this._pending = [];
    delete window.__chatSend;
  }

  /** 윈도우 열려있는지 확인 */
  get isOpen() {
    return this._win && !this._win.closed;
  }
}

export { ChatWindow };
