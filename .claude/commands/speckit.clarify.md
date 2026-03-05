---
description: Clarify ambiguous or underspecified areas in the feature spec
---

# Clarify 워크플로우

## 입력

```text
$ARGUMENTS
```

사용자 입력이 있으면 반영한다.

## 절차

1. `.spec/spec.md`를 읽는다.
2. `.spec/constitution.md`를 읽어 프로젝트 원칙을 파악한다.
3. spec에서 모호하거나 불완전한 부분을 자동 탐지한다:
   - 기능 범위 (Functional Scope)
   - 데이터 모델 (Data Model)
   - UX/UI 요구사항
   - 비기능 요구사항 (성능, 보안, 접근성)
   - 에지 케이스 및 예외 처리
4. 탐지된 모호한 부분에 대해 최대 5개의 대화형 질문을 한다.
5. 사용자 답변을 `.spec/spec.md`의 `## Clarifications` 섹션에 기록한다.
6. 반복: 답변 후 추가 모호성이 있으면 한 번 더 질문한다 (최대 2라운드).

## 규칙

- **WHAT과 WHY**에 집중하고, **HOW**는 포함하지 않는다.
- 합리적인 기본값을 사용하되, 여러 해석이 가능하고 영향이 큰 경우에만 질문한다.
- 우선순위: 범위 > 보안 > UX > 기술적 세부사항
