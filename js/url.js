// 공유 URL 생성 및 파싱 유틸리티

/**
 * 피어 ID가 포함된 공유 URL 생성
 * @param {string} peerId
 * @returns {string}
 */
export function buildShareUrl(peerId) {
  const url = new URL(window.location.href);
  // 기존 해시/파라미터 제거 후 peer 파라미터만 설정
  url.hash = '';
  url.searchParams.set('peer', peerId);
  return url.toString();
}

/**
 * URL 쿼리 파라미터에서 피어 ID 추출
 * @returns {string|null}
 */
export function getPeerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('peer') || null;
}
