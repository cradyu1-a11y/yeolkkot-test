# 열꽃 8인 닮은꼴 테스트

## 폴더
- index.html · app.js · data.js — 테스트 페이지(프론트엔드). 문항·결과 문장은 전부 data.js에 있다.
- img/ — 8인 쪼꼬미 이미지
- og/ — 링크 미리보기 이미지(메인 1장 + 캐릭터별 8장, 1200×630)
- r/C01.html … r/C08.html — 결과 공유 링크. 카톡 등에서 캐릭터별 미리보기가 뜨고, 열면 테스트로 넘어간다.
- backend/Code.gs — 결과 집계(구글 시트 + Apps Script)

## 공개 순서
1. 구글 시트 새로 만들기 → 확장 프로그램 → Apps Script → backend/Code.gs 붙여 넣기 → setupSummary 한 번 실행
2. 배포 → 새 배포 → 웹 앱(실행: 나 / 액세스: 모든 사용자) → 권한 승인 → /exec 주소 복사
3. data.js의 API_URL에 그 주소 넣기
4. GitHub 저장소에 이 폴더를 올리고 Settings → Pages에서 공개
5. 링크 꼬리표: ?from=shorts, ?from=insta, ?from=longform_010 처럼 붙여 유입을 나눈다

## 저장하는 것
시각 · 세션(무작위 문자열) · 유입 꼬리표 · 친구 결과 · 1·2위 · 여섯 축 점수 · 8인 겹침 % · 24문항 응답 · 걸린 시간 · 모바일 여부.
이름·연락처·IP는 받지 않는다.
