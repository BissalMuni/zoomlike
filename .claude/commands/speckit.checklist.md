---
description: Generate quality checklists to validate requirements completeness
---

# Checklist 워크플로우

## 핵심 개념: "요구사항의 단위 테스트"

체크리스트는 **구현을 테스트하는 것이 아니라**, **요구사항의 품질을 검증**하는 도구이다.

- **올바른 예**: "모든 인터랙티브 요소에 대해 접근성 요구사항이 정의되어 있는가?" [Coverage]
- **잘못된 예**: "버튼 클릭이 정상 동작하는지 확인" (이것은 구현 테스트)

## 입력

```text
$ARGUMENTS
```

사용자 입력이 있으면 반영한다 (예: "ux", "security", "api" 등 체크리스트 유형).

## 절차

1. `.spec/` 디렉토리의 문서를 읽는다 (spec.md, plan.md, constitution.md).
2. 사용자와 대화하여 체크리스트 범위를 결정한다:
   - 도메인 (UX, API, Security, Performance 등)
   - 깊이 (Standard / Thorough)
3. `.spec/checklists/` 디렉토리에 체크리스트 파일을 생성한다:
   - 파일명: `[domain].md` (예: `ux.md`, `security.md`)
   - 항목 형식: `- [ ] CHK001 - 질문 [품질 차원, 참조]`
4. 각 항목은 다음 품질 차원을 검증한다:
   - **Completeness**: 필요한 모든 요구사항이 문서화되었는가?
   - **Clarity**: 요구사항이 구체적이고 모호하지 않은가?
   - **Consistency**: 요구사항 간 충돌이 없는가?
   - **Measurability**: 성공 기준이 측정 가능한가?
   - **Coverage**: 모든 시나리오/에지 케이스가 다루어졌는가?
5. 생성된 체크리스트 경로, 항목 수, 범위를 보고한다.

## 항목 작성 규칙

### 올바른 패턴

- "Are [requirement type] defined/specified/documented for [scenario]?"
- "Is [vague term] quantified with specific criteria?"
- "Are requirements consistent between [section A] and [section B]?"

### 금지 패턴

- "Verify", "Test", "Confirm" + 구현 동작
- "Displays", "works", "renders" 등 구현 검증 용어
- 코드 실행, 사용자 액션, 시스템 동작에 대한 언급

## 규칙

- 항목 수 상한: 40개 (초과 시 우선순위별 필터링)
- 80% 이상의 항목에 출처 참조 포함 (`[Spec §X.Y]` 또는 `[Gap]`)
- 매 실행마다 새 파일을 생성한다 (기존 파일 덮어쓰지 않음)
