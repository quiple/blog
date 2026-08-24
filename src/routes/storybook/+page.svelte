<script lang="ts">
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
      Aster의 라틴·한국어·일본어 조화를 굵기와 크기별로 확인하는 비공개 타입 스케일입니다.
    </p>
  </header>

  <div class="space-y-16">
    {#each weights as weight}
      <section aria-labelledby={`weight-${weight}`}>
        <div class="mb-4 flex items-baseline gap-3 border-b pb-3">
          <h2 id={`weight-${weight}`} class="text-xl font-semibold">Weight {weight}</h2>
          <span class="text-xs text-muted-foreground">font-weight: {weight}</span>
        </div>

        <div class="divide-y divide-border">
          {#each sizes as size}
            <article class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
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
                  <span lang="ko">다람쥐 헌 쳇바퀴에 타고파</span>
                  <span aria-hidden="true"> · </span>
                  <span lang="ja">素早い狐は怠けた犬を飛び越える。</span>
                </p>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
