<script lang="ts">
  import {Check, TriangleAlert, X} from '@lucide/svelte'

  const licenseRows = [
    {
      category: '상업적 이용',
      status: '가능',
      tone: 'positive',
      description:
        '폰트를 사용해 만든 문서·이미지·영상·로고 등을 상업적으로 이용하거나 판매할 수 있습니다. 제작물 자체에는 OFL이 적용되지 않습니다.',
    },
    {
      category: '임베드 및 번들',
      status: '가능',
      tone: 'positive',
      description:
        '폰트를 문서에 임베드하거나 게임·소프트웨어 등에 포함시키고 웹 폰트로 이용할 수 있습니다. 문서나 프로그램의 라이선스를 OFL로 바꿀 필요는 없습니다.',
    },
    {
      category: '제작물 출처 표기',
      status: '필수 아님',
      tone: 'positive',
      description: '폰트를 사용해 만든 제작물에는 폰트명·출처·저작자명을 표시하지 않아도 됩니다.',
    },
    {
      category: '수정',
      status: '가능',
      tone: 'positive',
      description: '폰트를 수정·병합하거나 형식을 변환할 수 있습니다. 수정했다는 이유만으로 공개할 의무는 없습니다.',
    },
    {
      category: '재배포',
      status: '조건부 가능',
      tone: 'caution',
      description:
        '원본과 수정본을 재배포할 수 있습니다. 폰트에 포함된 저작권 고지와 OFL-1.1 라이선스 정보를 유지해야 하며, 폰트에 해당하는 부분은 다른 라이선스로 배포할 수 없습니다.',
    },
    {
      category: '저작자명 홍보',
      status: '금지',
      tone: 'negative',
      description:
        '저작권자나 저자의 이름을 수정본의 홍보·추천·보증에 이용할 수 없습니다. 기여 사실을 밝히는 것은 가능합니다.',
    },
    {
      category: '단독 판매',
      status: '금지',
      tone: 'negative',
      description:
        '폰트 소프트웨어나 그 개별 구성 요소만을 따로 판매할 수 없습니다. 다른 소프트웨어에 포함시켜 판매하는 것은 가능합니다.',
    },
    {
      category: '보증 및 책임',
      status: '제공하지 않음',
      tone: 'negative',
      description:
        '폰트는 어떠한 보증도 없이 있는 그대로 제공되며, 저작권자는 이용·이용 불능 등으로 발생한 청구나 손해에 책임지지 않습니다.',
    },
    {
      category: '조건 위반',
      status: '라이선스 무효',
      tone: 'negative',
      description: 'OFL-1.1의 조건을 지키지 않으면 부여된 라이선스는 무효가 됩니다.',
    },
  ] as const
</script>

<table>
  <thead>
    <tr>
      <th>범주</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    {#each licenseRows as row}
      <tr>
        <td class="whitespace-nowrap">{row.category}</td>
        <td>
          <strong>
            {#if row.tone === 'positive'}
              <Check
                class="inline-block size-4 rounded-full bg-green-500 stroke-4 p-0.5 text-white [print-color-adjust:exact]"
                aria-hidden="true"
              />
            {:else if row.tone === 'caution'}
              <TriangleAlert
                class="inline-block size-4 rounded-full bg-amber-500 stroke-3 p-0.5 text-white [print-color-adjust:exact]"
                aria-hidden="true"
              />
            {:else}
              <X
                class="inline-block size-4 rounded-full bg-red-500 stroke-4 p-0.5 text-white [print-color-adjust:exact]"
                aria-hidden="true"
              />
            {/if}
            {row.status}
          </strong><br />{row.description}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="mt-2 text-xs leading-5 text-muted-foreground">
  이 표는 OFL-1.1의 이해를 돕기 위한 요약이며 법적 효력이 있는 번역이 아닙니다. 해석이 다른 경우
  <a href="https://openfontlicense.org/documents/OFL.md" target="_blank" rel="noreferrer noopener">영문 원문</a>이
  우선합니다.
</p>
