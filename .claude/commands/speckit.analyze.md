---
description: Cross-artifact consistency analysis (read-only)
---

# Analyze 워크플로우

## 입력

```text
$ARGUMENTS
```

사용자 입력이 있으면 반영한다.

## 절차

1. `.spec/` 디렉토리의 모든 파일을 읽는다:
   - `constitution.md` — 프로젝트 원칙
   - `spec.md` — 기능 명세
   - `plan.md` — 구현 계획
   - `tasks.md` — 작업 목록 (있는 경우)
2. 다음 항목에 대해 교차 분석을 수행한다:
   - **중복 (Duplication)**: 문서 간 동일한 내용이 반복되는가?
   - **모호성 (Ambiguity)**: 불명확하거나 여러 해석이 가능한 요구사항이 있는가?
   - **갭 (Gap)**: spec에 정의되었지만 plan/tasks에 없는 요구사항이 있는가?
   - **Constitution 위반**: plan이나 tasks가 constitution 원칙에 어긋나는가?
   - **일관성 (Consistency)**: 문서 간 수치, 기술 용어, 범위가 일치하는가?
3. 분석 결과를 Markdown 보고서로 출력한다:
   - Severity별 분류: CRITICAL / WARNING / INFO
   - 각 항목에 출처 문서와 섹션 참조 포함
   - 커버리지 요약 (spec 요구사항 중 plan/tasks에 반영된 비율)

## 규칙

- **읽기 전용**: 파일을 수정하지 않는다.
- 인용은 125자 이내로 제한한다.
- 사실에 기반하여 분석한다 (추측하지 않는다).
