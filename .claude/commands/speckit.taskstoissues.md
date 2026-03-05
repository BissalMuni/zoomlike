---
description: Convert tasks into GitHub issues
---

# Tasks to Issues 워크플로우

## 입력

```text
$ARGUMENTS
```

사용자 입력이 있으면 반영한다.

## 절차

1. `.spec/tasks.md`를 읽어 작업 목록을 파싱한다.
2. Git remote URL을 확인한다:
   ```bash
   git config --get remote.origin.url
   ```
3. **GitHub URL인 경우에만** 다음 단계를 진행한다.
4. 각 작업에 대해 `gh issue create`로 GitHub Issue를 생성한다:
   - 제목: 작업 설명
   - 본문: 관련 spec/plan 참조, 의존성 정보
   - 라벨: Phase별 라벨 (setup, core, feature, polish)
5. 생성된 Issue 목록을 보고한다.

## 규칙

- **절대로 remote URL과 다른 리포지토리에 Issue를 생성하지 않는다.**
- tasks.md가 없으면 `/speckit.tasks`를 먼저 실행하도록 안내한다.
- 이미 생성된 Issue와 중복되지 않도록 확인한다.
