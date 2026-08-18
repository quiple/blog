<script lang="ts">
  import {Check, X} from '@lucide/svelte'

  const licenseRows = [
    {
      category: '상업적 이용',
      status: '가능',
      positive: true,
      description: '폰트를 상업적으로 이용할 수 있습니다. 표현하는 내용이나 매체 등도 상관하지 않습니다.',
    },
    {
      category: '임베드',
      status: '가능',
      positive: true,
      description: '폰트 파일을 문서·게임·소프트웨어 등에 포함시키거나 웹 폰트로 이용할 수 있습니다.',
    },
    {
      category: '출처 표기',
      status: '필수 아님',
      positive: true,
      description: '폰트의 출처 및 저작자명을 표시하지 않아도 됩니다.',
    },
    {
      category: '수정 및 재배포',
      status: '가능',
      positive: true,
      description: '폰트를 수정하거나 재배포할 수 있습니다. 수정하여 재배포할 경우 OFL-1.1을 채택해야 합니다.',
    },
    {
      category: '단독 판매',
      status: '금지',
      positive: false,
      description: '폰트 파일만을 유료 판매하는 경우. 문서·게임·소프트웨어 등에 포함시켜 판매하는 것은 가능합니다.',
    },
    {
      category: '이용으로 인한 피해',
      status: '책임 안 짐',
      positive: false,
      description: '폰트의 이용으로 인한 피해나 손해가 생기더라도 일절 책임지지 않습니다.',
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
        <td>{row.category}</td>
        <td>
          <strong>
            {#if row.positive}
              <Check
                class="inline-block size-4 rounded-full bg-green-500 stroke-4 p-0.5 text-white [print-color-adjust:exact]"
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
