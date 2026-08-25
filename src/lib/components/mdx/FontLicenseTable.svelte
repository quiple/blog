<script lang="ts">
  import {Check, TriangleAlert, X} from '@lucide/svelte'

  const licenseRows = [
    {
      category: '상업적 이용',
      status: '가능',
      tone: 'positive',
      description: '폰트로 만든 제작물은 용도와 매체에 관계없이 상업적으로 이용하거나 판매할 수 있습니다.',
    },
    {
      category: '임베드 및 번들',
      status: '가능',
      tone: 'positive',
      description:
        '문서·게임·소프트웨어에 포함하거나 웹 폰트로 사용할 수 있습니다. 폰트를 포함한 제작물의 라이선스는 변경할 필요가 없습니다.',
    },
    {
      category: '제작물 출처 표기',
      status: '필수 아님',
      tone: 'positive',
      description: '폰트로 만든 제작물에는 폰트명·출처·저작자명을 표시할 필요가 없습니다.',
    },
    {
      category: '수정',
      status: '가능',
      tone: 'positive',
      description: '폰트를 수정·병합하거나 다른 형식으로 변환할 수 있으며, 수정본을 공개할 의무는 없습니다.',
    },
    {
      category: '재배포',
      status: '조건부 가능',
      tone: 'caution',
      description:
        '원본과 수정본 모두 재배포할 수 있습니다. 폰트의 라이선스는 변경할 수 없으며 계속 OFL-1.1로 배포해야 합니다.',
    },
    {
      category: '저작자명 홍보',
      status: '금지',
      tone: 'negative',
      description: '저작권자·저자 이름을 수정본의 홍보·추천·보증에 사용할 수 없습니다. 기여 사실 표기는 가능합니다.',
    },
    {
      category: '단독 판매',
      status: '금지',
      tone: 'negative',
      description: '폰트나 그 구성 요소만 따로 판매할 수 없습니다. 다른 소프트웨어와 함께 판매하는 것은 가능합니다.',
    },
    {
      category: '보증 및 책임',
      status: '제공하지 않음',
      tone: 'negative',
      description:
        '폰트는 아무런 보증 없이 제공됩니다. 저작권자는 사용·사용 불능으로 생긴 청구나 손해에 책임지지 않습니다.',
    },
    {
      category: '조건 위반',
      status: '라이선스 무효',
      tone: 'negative',
      description: 'OFL-1.1 조건을 위반하면 라이선스가 무효가 됩니다.',
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
            <span class="inline-block size-4 rounded-full"></span>
            {#if row.tone === 'positive'}
              <Check class=" bg-green-500 stroke-4 p-0.5 text-white [print-color-adjust:exact]" aria-hidden="true" />
            {:else if row.tone === 'caution'}
              <TriangleAlert
                class="bg-amber-500 stroke-3 p-0.5 text-white [print-color-adjust:exact]"
                aria-hidden="true"
              />
            {:else}
              <X class="bg-red-500 stroke-4 p-0.5 text-white [print-color-adjust:exact]" aria-hidden="true" />
            {/if}
            {row.status}
          </strong><br />{row.description}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="mt-2! text-sm! leading-5! text-muted-foreground">
  이 표는 OFL-1.1의 이해를 돕기 위한 요약이며 법적 효력이 있는 번역이 아닙니다. 해석이 다른 경우
  <a href="https://openfontlicense.org/open-font-license-official-text/" target="_blank" rel="noreferrer noopener"
    >영문 원문</a
  >이 우선합니다.
</p>
