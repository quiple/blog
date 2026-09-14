<script lang="ts">
  import Toc from '$lib/components/mdx/Toc.svelte'
  import PageTitle from '$lib/components/page-title.svelte'

  const weights = [200, 300, 400, 500, 600] as const
  const sizes = [
    {name: 'xs', value: 12},
    {name: 'sm', value: 14},
    {name: 'base', value: 16},
    {name: 'lg', value: 18},
    {name: 'xl', value: 20},
    {name: '2xl', value: 24},
    {name: '3xl', value: 30},
    {name: '4xl', value: 36},
    {name: '5xl', value: 48},
    {name: '6xl', value: 60},
    {name: '7xl', value: 72},
    {name: '8xl', value: 96},
    {name: '9xl', value: 128},
  ] as const
</script>

<svelte:head>
  <title>Typography Storybook – quiple</title>
  <meta name="robots" content="noindex,nofollow,noarchive" />
</svelte:head>

<PageTitle>Typography Storybook</PageTitle>

<div class="mx-auto max-w-[96rem]">
  <header class="mb-8 border-b pb-6">
    <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
      Astr의 라틴·한국어·일본어 조화를 굵기와 크기별로 확인하는 비공개 타입 스케일입니다.
    </p>
  </header>

  <section class="mb-20 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] xl:gap-12">
    <article id="toc-story" class="min-w-0">
      <div class="min-h-screen border-b pt-8 first:pt-0">
        <p class="max-w-2xl text-muted-foreground">
          목차가 비활성화된 초기 상태입니다. 아래로 스크롤해 첫 번째 헤딩이 화면에 진입하는 순간을 확인할 수 있습니다.
        </p>
      </div>

      <section class="min-h-screen border-b py-8">
        <h2>목차 테스트 시작</h2>
        <p class="max-w-2xl text-muted-foreground">
          첫 번째 헤딩이 화면에 들어올 때 활성 항목이 정확히 하나만 표시되는지 확인하는 구간입니다.
        </p>
      </section>

      <section class="min-h-[70vh] border-b py-8">
        <h3>첫 번째 하위 단계</h3>
        <p class="max-w-2xl text-muted-foreground">
          2단계 헤딩으로 진입할 때 목차 경로가 자연스럽게 이어지는지 확인합니다.
        </p>
      </section>

      <section class="min-h-[70vh] border-b py-8">
        <h3>두 번째 하위 단계</h3>
        <p class="max-w-2xl text-muted-foreground">
          앞뒤 섹션이 한 화면에 함께 보일 때 여러 항목이 동시에 활성화되는지 확인합니다.
        </p>
      </section>

      <section class="min-h-[70vh] border-b py-8">
        <h2>두 번째 상위 단계</h2>
        <p class="max-w-2xl text-muted-foreground">
          다시 상위 단계로 이동할 때 목차 선의 들여쓰기와 활성 범위가 올바르게 전환되는지 확인합니다.
        </p>
      </section>

      <section class="min-h-[70vh] border-b py-8">
        <h3>경계 진입 확인</h3>
        <p class="max-w-2xl text-muted-foreground">
          헤딩이 화면 아래쪽 경계를 통과하는 순간 다음 항목이 너무 일찍 활성화되지 않는지 확인합니다.
        </p>
      </section>

      <section class="min-h-[70vh] border-b py-8">
        <h3>빠른 스크롤 확인</h3>
        <p class="max-w-2xl text-muted-foreground">
          빠르게 위아래로 스크롤해도 중간 항목이 잘못 활성화되거나 뒤늦게 따라오지 않는지 확인합니다.
        </p>
      </section>

      <section class="min-h-[70vh] py-8">
        <h2>목차 테스트 마무리</h2>
        <p class="max-w-2xl text-muted-foreground">
          마지막 섹션과 문서 하단에서 활성 상태가 안정적으로 유지되는지 확인하는 구간입니다.
        </p>
      </section>
    </article>

    <aside>
      <Toc selector="#toc-story" title="목차 테스트" />
    </aside>
  </section>

  <div class="space-y-16">
    {#each weights as weight}
      <section aria-labelledby={`weight-${weight}`}>
        <div class="mb-4 flex items-baseline gap-3 border-b pb-3">
          <h2 id={`weight-${weight}`} class="text-xl font-semibold">Weight {weight}</h2>
          <span class="text-xs text-muted-foreground">font-weight: {weight}</span>
        </div>

        <div class="divide-y divide-border">
          {#each sizes as size}
            <div class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
              <div class="pt-1 font-mono text-[11px] leading-4 text-muted-foreground tabular-nums">
                <div>{size.name}</div>
                <div>{size.value}px</div>
              </div>

              <div class="overflow-x-auto pb-1">
                <p
                  class="w-max min-w-full leading-[1.4] whitespace-nowrap"
                  style={`font-size: ${size.value}px; font-weight: ${weight};`}
                >
                  <span lang="en">Hamburgefontsiv 0123456789</span>
                  <span aria-hidden="true"> · </span>
                  <span>다람쥐 헌 쳇바퀴에 타고파</span>
                  <span aria-hidden="true"> · </span>
                  <span lang="ja">素早い狐は怠けた犬を飛び越える。</span>
                </p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
