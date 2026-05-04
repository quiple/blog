export const VARIATION_LABELS: Record<string, {en: string; ja: string; ko: string}> = {
  arbait: {ko: '(아르바이트)', ja: '（アルバイト）', en: ' (Part-Timer)'},
  armed: {ko: '(무장)', ja: '（臨戦）', en: ' (Armed)'},
  band: {ko: '(밴드)', ja: '（バンド）', en: ' (Band)'},
  bunny: {ko: '(바니걸)', ja: '（バニーガール）', en: ' (Bunny)'},
  camp: {ko: '(캠핑)', ja: '（キャンプ）', en: ' (Camp)'},
  casual: {ko: '(사복)', ja: '（私服）', en: ' (Casual)'},
  christmas: {ko: '(크리스마스)', ja: '（クリスマス）', en: ' (Christmas)'},
  dress: {ko: '(드레스)', ja: '（ドレス）', en: ' (Dress)'},
  guide: {ko: '(가이드)', ja: '（ガイド）', en: ' (Guide)'},
  idol: {ko: '(아이돌)', ja: '（アイドル）', en: ' (Pop Idol)'},
  magical: {ko: '(매지컬)', ja: '（マジカル）', en: ' (Magical)'},
  maid: {ko: '(메이드)', ja: '（メイド）', en: ' (Maid)'},
  newyear: {ko: '(새해)', ja: '（正月）', en: ' (New Year)'},
  onsen: {ko: '(온천)', ja: '（温泉）', en: ' (Hot Spring)'},
  ouen: {ko: '(응원단)', ja: '（応援団）', en: ' (Cheer Squad)'},
  pajamas: {ko: '(파자마)', ja: '（パジャマ）', en: ' (Pajamas)'},
  qipao: {ko: '(치파오)', ja: '（チーパオ）', en: ' (Qipao)'},
  ride: {ko: '(라이딩)', ja: '（ライディング）', en: ' (Cycling)'},
  school: {ko: '(교복)', ja: '（制服）', en: ' (School)'},
  small: {ko: '(어린이)', ja: '（幼女）', en: ' (Small)'},
  swimsuit: {ko: '(수영복)', ja: '（水着）', en: ' (Swimsuit)'},
  taisou: {ko: '(체육복)', ja: '（体操服）', en: ' (Track)'},
  terror: {ko: '*테러', ja: '＊テラー', en: '*Terror'},
}

export interface Portrait {
  id: string
  variation?: string
}

export interface Student {
  name: {
    en: string
    ja: string
    ko: string
  }
  portrait: (string | Portrait)[]
}

export default [
  {
    name: {en: 'Airi', ko: '아이리', ja: 'アイリ'},
    portrait: ['Student_Portrait_Airi_Collection', {id: 'Student_Portrait_CH0251_Collection', variation: 'band'}],
  },
  {
    name: {en: 'Akane', ko: '아카네', ja: 'アカネ'},
    portrait: ['Student_Portrait_Akane_Collection', {id: 'Student_Portrait_CH0099_Collection', variation: 'bunny'}],
  },
  {
    name: {en: 'Akari', ko: '아카리', ja: 'アカリ'},
    portrait: ['Student_Portrait_Akari_Collection', {id: 'Student_Portrait_CH0196_Collection', variation: 'newyear'}],
  },
  {
    name: {en: 'Ako', ko: '아코', ja: 'アコ'},
    portrait: ['Student_Portrait_Ako_Collection', {id: 'Student_Portrait_CH0231_Collection', variation: 'dress'}],
  },
  {
    name: {en: 'Aoba', ko: '아오바', ja: 'アオバ'},
    portrait: ['Student_Portrait_CH0288_Collection'],
  },
  {
    name: {en: 'Aoi', ko: '아오이', ja: 'アオイ'},
    portrait: ['NPC_Portrait_NP0032_Collection'],
  },
  {
    name: {en: 'Arisu', ko: '아리스', ja: 'アリス'},
    portrait: ['Student_Portrait_Aris_Collection', {id: 'Student_Portrait_CH0200_Collection', variation: 'maid'}],
  },
  {
    name: {en: 'Arona', ko: '아로나', ja: 'アロナ'},
    portrait: ['NPC_Portrait_Arona_Collection'],
  },
  {
    name: {en: 'Aru', ko: '아루', ja: 'アル'},
    portrait: [
      'Student_Portrait_Aru_Collection',
      {id: 'Student_Portrait_Aru_Newyear_Collection', variation: 'newyear'},
      {id: 'Student_Portrait_CH0240_Collection', variation: 'dress'},
    ],
  },
  {
    name: {en: 'Asuna', ko: '아스나', ja: 'アスナ'},
    portrait: [
      'Student_Portrait_Asuna_Collection',
      {id: 'Student_Portrait_CH0098_Collection', variation: 'bunny'},
      {id: 'Student_Portrait_CH0281_Collection', variation: 'school'},
    ],
  },
  {
    name: {en: 'Atsuko', ko: '아츠코', ja: 'アツコ'},
    portrait: ['Student_Portrait_Atsuko_Collection', {id: 'Student_Portrait_CH0267_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Ayane', ko: '아야네', ja: 'アヤネ'},
    portrait: ['Student_Portrait_Ayane_Collection', {id: 'Student_Portrait_CH0176_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Ayumu', ko: '아유무', ja: 'アユム'},
    portrait: ['NPC_Portrait_NP0013_Collection'],
  },
  {
    name: {en: 'Azusa', ko: '아즈사', ja: 'アズサ'},
    portrait: [
      'Student_Portrait_Azusa_Collection',
      {id: 'Student_Portrait_Azusa_Swimsuit_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Cherino', ko: '체리노', ja: 'チェリノ'},
    portrait: ['Student_Portrait_Cherino_Collection', {id: 'Student_Portrait_CH0164_Collection', variation: 'onsen'}],
  },
  {
    name: {en: 'Chiaki', ko: '치아키', ja: 'チアキ'},
    portrait: ['Student_Portrait_CH0238_Collection'],
  },
  {
    name: {en: 'Chihiro', ko: '치히로', ja: 'チヒロ'},
    portrait: ['Student_Portrait_CH0160_Collection'],
  },
  {
    name: {en: 'Chinatsu', ko: '치나츠', ja: 'チナツ'},
    portrait: ['Student_Portrait_Chinatsu_Collection', {id: 'Student_Portrait_CH0163_Collection', variation: 'onsen'}],
  },
  {
    name: {en: 'Chise', ko: '치세', ja: 'チセ'},
    portrait: ['Student_Portrait_Chise_Collection', {id: 'Student_Portrait_CH0178_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Eimi', ko: '에이미', ja: 'エイミ'},
    portrait: ['Student_Portrait_Eimi_Collection', {id: 'Student_Portrait_Ch0219_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Eri', ko: '에리', ja: 'エリ'},
    portrait: ['Student_Portrait_CH0304_Collection'],
  },
  {
    name: {en: 'Fubuki', ko: '후부키', ja: 'フブキ'},
    portrait: ['Student_Portrait_CH0141_Collection', {id: 'Student_Portrait_CH0261_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Fuuka', ko: '후우카', ja: 'フウカ'},
    portrait: ['Student_Portrait_Fuuka_Collection', {id: 'Student_Portrait_CH0177_Collection', variation: 'newyear'}],
  },
  {
    name: {en: 'Fuyu', ko: '후유', ja: 'フユ'},
    portrait: ['Student_Portrait_CH0318_Collection'],
  },
  {
    name: {en: 'Hanae', ko: '하나에', ja: 'ハナエ'},
    portrait: ['Student_Portrait_Hanae_Collection', {id: 'Student_Portrait_CH0195_Collection', variation: 'christmas'}],
  },
  {
    name: {en: 'Hanako', ko: '하나코', ja: 'ハナコ'},
    portrait: ['Student_Portrait_Hanako_Collection', {id: 'Student_Portrait_CH0209_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Hare', ko: '하레', ja: 'ハレ'},
    portrait: ['Student_Portrait_Hare_Collection', {id: 'Student_Portrait_CH0233_Collection', variation: 'camp'}],
  },
  {
    name: {en: 'Haruka', ko: '하루카', ja: 'ハルカ'},
    portrait: ['Student_Portrait_Haruka_Collection', {id: 'Student_Portrait_CH0087_Collection', variation: 'newyear'}],
  },
  {
    name: {en: 'Haruna', ko: '하루나', ja: 'ハルナ'},
    portrait: [
      'Student_Portrait_Haruna_Collection',
      {id: 'Student_Portrait_CH0191_Collection', variation: 'newyear'},
      {id: 'Student_Portrait_CH0193_Collection', variation: 'taisou'},
    ],
  },
  {
    name: {en: 'Hasumi', ko: '하스미', ja: 'ハスミ'},
    portrait: ['Student_Portrait_Hasumi_Collection', {id: 'Student_Portrait_CH0291_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Hibiki', ko: '히비키', ja: 'ヒビキ'},
    portrait: ['Student_Portrait_Hibiki_Collection', {id: 'Student_Portrait_CH0181_Collection', variation: 'ouen'}],
  },
  {
    name: {en: 'Hifumi', ko: '히후미', ja: 'ヒフミ'},
    portrait: ['Student_Portrait_Hihumi_Collection', {id: 'Student_Portrait_CH0058_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Hikari', ko: '히카리', ja: 'ヒカリ'},
    portrait: ['Student_Portrait_CH0242_Collection'],
  },
  {
    name: {en: 'Himari', ko: '히마리', ja: 'ヒマリ'},
    portrait: ['Student_Portrait_CH0159_Collection'],
  },
  {
    name: {en: 'Hina', ko: '히나', ja: 'ヒナ'},
    portrait: [
      'Student_Portrait_Hina_Collection',
      {id: 'Student_Portrait_CH0063_Collection', variation: 'swimsuit'},
      {id: 'Student_Portrait_CH0230_Collection', variation: 'dress'},
    ],
  },
  {
    name: {en: 'Hinata', ko: '히나타', ja: 'ヒナタ'},
    portrait: ['Student_Portrait_Hinata_Collection', {id: 'Student_Portrait_CH0210_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Hiyori', ko: '히요리', ja: 'ヒヨリ'},
    portrait: ['Student_Portrait_Hiyori_Collection', {id: 'Student_Portrait_CH0269_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Hoshino', ko: '호시노', ja: 'ホシノ'},
    portrait: [
      'Student_Portrait_Hoshino_Collection',
      {id: 'Student_Portrait_Hoshino_Swimsuit_Collection', variation: 'swimsuit'},
      {id: 'Student_Portrait_CH0258_Collection', variation: 'armed'},
      {id: 'Student_Portrait_CH0258_01_Collection', variation: 'armed'},
    ],
  },
  {
    name: {en: 'Ibuki', ko: '이부키', ja: 'イブキ'},
    portrait: ['Student_Portrait_Ibuki_Collection'],
  },
  {
    name: {en: 'Ichika', ko: '이치카', ja: 'イチカ'},
    portrait: ['Student_Portrait_CH0071_Collection', {id: 'Student_Portrait_CH0292_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Iori', ko: '이오리', ja: 'イオリ'},
    portrait: ['Student_Portrait_Iori_Collection', {id: 'Student_Portrait_CH0064_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Iroha', ko: '이로하', ja: 'イロハ'},
    portrait: ['Student_Portrait_CH0156_Collection'],
  },
  {
    name: {en: 'Izumi', ko: '이즈미', ja: 'イズミ'},
    portrait: [
      'Student_Portrait_Izumi_Collection',
      {id: 'Student_Portrait_Izumi_swimsuit_Collection', variation: 'swimsuit'},
      {id: 'Student_Portrait_CH0197_Collection', variation: 'newyear'},
    ],
  },
  {
    name: {en: 'Izuna', ko: '이즈나', ja: 'イズナ'},
    portrait: ['Student_Portrait_Izuna_Collection', {id: 'Student_Portrait_CH0179_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Junko', ko: '준코', ja: 'ジュンコ'},
    portrait: ['Student_Portrait_Zunko_Collection', {id: 'Student_Portrait_CH0192_Collection', variation: 'newyear'}],
  },
  {
    name: {en: 'Juri', ko: '주리', ja: 'ジュリ'},
    portrait: ['Student_Portrait_Juri_Collection', {id: 'Student_Portrait_CH0286_Collection', variation: 'arbait'}],
  },
  {
    name: {en: 'Kaede', ko: '카에데', ja: 'カエデ'},
    portrait: ['Student_Portrait_Kaede_Collection'],
  },
  {
    name: {en: 'Kaho', ko: '카호', ja: 'カホ'},
    portrait: ['Student_Portrait_CH0107_Collection'],
  },
  {
    name: {en: 'Kanna', ko: '칸나', ja: 'カンナ'},
    portrait: ['Student_Portrait_CH0170_Collection', {id: 'Student_Portrait_CH0260_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Kanoe', ko: '카노에', ja: 'カノエ'},
    portrait: ['Student_Portrait_CH0306_Collection'],
  },
  {
    name: {en: 'Karin', ko: '카린', ja: 'カリン'},
    portrait: [
      'Student_Portrait_Karin_Collection',
      {id: 'Student_Portrait_CH0100_Collection', variation: 'bunny'},
      {id: 'Student_Portrait_CH0282_Collection', variation: 'school'},
    ],
  },
  {
    name: {en: 'Kasumi', ko: '카스미', ja: 'カスミ'},
    portrait: ['Student_Portrait_CH0089_Collection'],
  },
  {
    name: {en: 'Kayoko', ko: '카요코', ja: 'カヨコ'},
    portrait: [
      'Student_Portrait_Kayoko_Collection',
      {id: 'Student_Portrait_CH0086_Collection', variation: 'newyear'},
      {id: 'Student_Portrait_CH0239_Collection', variation: 'dress'},
    ],
  },
  {
    name: {en: 'Kazusa', ko: '카즈사', ja: 'カズサ'},
    portrait: ['Student_Portrait_Kazusa_Collection', {id: 'Student_Portrait_CH0250_Collection', variation: 'band'}],
  },
  {
    name: {en: 'Kikyou', ko: '키쿄', ja: 'キキョウ'},
    portrait: ['Student_Portrait_CH0225_Collection', {id: 'Student_Portrait_CH0300_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Kirara', ko: '키라라', ja: 'キララ'},
    portrait: ['Student_Portrait_Kirara_Collection'],
  },
  {
    name: {en: 'Kirino', ko: '키리노', ja: 'キリノ'},
    portrait: ['Student_Portrait_Kirino_Collection', {id: 'Student_Portrait_CH0262_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Kisaki', ko: '키사키', ja: 'キサキ'},
    portrait: ['Student_Portrait_CH0139_Collection'],
  },
  {
    name: {en: 'Koharu', ko: '코하루', ja: 'コハル'},
    portrait: ['Student_Portrait_Koharu_Collection', {id: 'Student_Portrait_CH0205_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Kokona', ko: '코코나', ja: 'ココナ'},
    portrait: ['Student_Portrait_CH0137_Collection'],
  },
  {
    name: {en: 'Kotama', ko: '코타마', ja: 'コタマ'},
    portrait: ['Student_Portrait_Kotama_Collection', {id: 'Student_Portrait_CH0232_Collection', variation: 'camp'}],
  },
  {
    name: {en: 'Kotori', ko: '코토리', ja: 'コトリ'},
    portrait: ['Student_Portrait_Kotori_Collection', {id: 'Student_Portrait_CH0185_Collection', variation: 'ouen'}],
  },
  {
    name: {en: 'Koyuki', ko: '코유키', ja: 'コユキ'},
    portrait: ['Student_Portrait_CH0198_Collection'],
  },
  {
    name: {en: 'Maki', ko: '마키', ja: 'マキ'},
    portrait: ['Student_Portrait_Maki_Collection', {id: 'Student_Portrait_CH0235_Collection', variation: 'camp'}],
  },
  {
    name: {en: 'Makoto', ko: '마코토', ja: 'マコト'},
    portrait: ['Student_Portrait_CH0079_Collection'],
  },
  {
    name: {en: 'Mari', ko: '마리', ja: 'マリ'},
    portrait: [
      'Student_Portrait_Mari_Collection',
      {id: 'Student_Portrait_CH0186_Collection', variation: 'taisou'},
      {id: 'Student_Portrait_CH0273_Collection', variation: 'idol'},
    ],
  },
  {
    name: {en: 'Marina', ko: '마리나', ja: 'マリナ'},
    portrait: ['Student_Portrait_Marina_Collection', {id: 'Student_Portrait_CH0270_Collection', variation: 'qipao'}],
  },
  {
    name: {en: 'Mashiro', ko: '마시로', ja: 'マシロ'},
    portrait: [
      'Student_Portrait_Mashiro_Collection',
      {id: 'Student_Portrait_Mashiro_Swimsuit_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Megu', ko: '메구', ja: 'メグ'},
    portrait: ['Student_Portrait_CH0088_Collection'],
  },
  {
    name: {en: 'Meru', ko: '메루', ja: 'メル'},
    portrait: ['Student_Portrait_CH0124_Collection'],
  },
  {
    name: {en: 'Michiru', ko: '미치루', ja: 'ミチル'},
    portrait: ['Student_Portrait_CH0113_Collection', {id: 'Student_Portrait_CH0296_Collection', variation: 'dress'}],
  },
  {
    name: {en: 'Midori', ko: '미도리', ja: 'ミドリ'},
    portrait: ['Student_Portrait_Midori_Collection', {id: 'Student_Portrait_CH0202_Collection', variation: 'maid'}],
  },
  {
    name: {en: 'Mika', ko: '미카', ja: 'ミカ'},
    portrait: ['Student_Portrait_CH0069_Collection', {id: 'Student_Portrait_CH0294_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Mimori', ko: '미모리', ja: 'ミモリ'},
    portrait: ['Student_Portrait_Mimori_Collection', {id: 'Student_Portrait_CH0183_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Mina', ko: '미나', ja: 'ミナ'},
    portrait: ['Student_Portrait_CH0138_Collection'],
  },
  {
    name: {en: 'Mine', ko: '미네', ja: 'ミネ'},
    portrait: ['Student_Portrait_CH0152_Collection', {id: 'Student_Portrait_CH0275_Collection', variation: 'idol'}],
  },
  {
    name: {en: 'Minori', ko: '미노리', ja: 'ミノリ'},
    portrait: ['Student_Portrait_CH0214_Collection'],
  },
  {
    name: {en: 'Misaki', ko: '미사키', ja: 'ミサキ'},
    portrait: ['Student_Portrait_Misaki_Collection', {id: 'Student_Portrait_CH0268_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Miyako', ko: '미야코', ja: 'ミヤコ'},
    portrait: ['Student_Portrait_Miyako_Collection', {id: 'Student_Portrait_CH0215_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Miyo', ko: '미요', ja: 'ミヨ'},
    portrait: ['Student_Portrait_CH0317_Collection'],
  },
  {
    name: {en: 'Miyu', ko: '미유', ja: 'ミユ'},
    portrait: ['Student_Portrait_CH0145_Collection', {id: 'Student_Portrait_CH0218_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Moe', ko: '모에', ja: 'モエ'},
    portrait: ['Student_Portrait_Moe_Collection', {id: 'Student_Portrait_CH0216_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Momiji', ko: '모미지', ja: 'モミジ'},
    portrait: ['Student_Portrait_Momiji_Collection'],
  },
  {
    name: {en: 'Momoi', ko: '모모이', ja: 'モモイ'},
    portrait: ['Student_Portrait_Momoi_Collection', {id: 'Student_Portrait_CH0201_Collection', variation: 'maid'}],
  },
  {
    name: {en: 'Momoka', ko: '모모카', ja: 'モモカ'},
    portrait: ['NPC_Portrait_Momoka_Collection'],
  },
  {
    name: {en: 'Mutsuki', ko: '무츠키', ja: 'ムツキ'},
    portrait: [
      'Student_Portrait_Mutsuki_Collection',
      {id: 'Student_Portrait_Mutsuki_Newyear_Collection', variation: 'newyear'},
    ],
  },
  {
    name: {en: 'Nagisa', ko: '나기사', ja: 'ナギサ'},
    portrait: ['Student_Portrait_Nagisa_Collection', {id: 'Student_Portrait_CH0293_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Nagusa', ko: '나구사', ja: 'ナグサ'},
    portrait: ['Student_Portrait_CH0222_Collection'],
  },
  {
    name: {en: 'Natsu', ko: '나츠', ja: 'ナツ'},
    portrait: ['Student_Portrait_CH0155_Collection', {id: 'Student_Portrait_CH0221_Collection', variation: 'band'}],
  },
  {
    name: {en: 'Neru', ko: '네루', ja: 'ネル'},
    portrait: [
      'Student_Portrait_Neru_Collection',
      {id: 'Student_Portrait_CH0101_Collection', variation: 'bunny'},
      {id: 'Student_Portrait_CH0280_Collection', variation: 'school'},
    ],
  },
  {
    name: {en: 'Niya', ko: '니야', ja: 'ニヤ'},
    portrait: ['Student_Portrait_CH0109_Collection'],
  },
  {
    name: {en: 'Noa', ko: '노아', ja: 'ノア'},
    portrait: ['Student_Portrait_CH0095_Collection', {id: 'Student_Portrait_CH0285_Collection', variation: 'pajamas'}],
  },
  {
    name: {en: 'Nodoka', ko: '노도카', ja: 'ノドカ'},
    portrait: ['Student_Portrait_Nodoka_Collection', {id: 'Student_Portrait_CH0165_Collection', variation: 'onsen'}],
  },
  {
    name: {en: 'Nonomi', ko: '노노미', ja: 'ノノミ'},
    portrait: ['Student_Portrait_Nonomi_Collection', {id: 'Student_Portrait_CH0092_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Nozomi', ko: '노조미', ja: 'ノゾミ'},
    portrait: ['Student_Portrait_CH0243_Collection'],
  },
  {
    name: {en: 'Pina', ko: '피나', ja: 'ピナ'},
    portrait: ['Student_Portrait_Pina_Collection', {id: 'Student_Portrait_CH0257_Collection', variation: 'guide'}],
  },
  {
    name: {en: 'Plana', ko: '프라나', ja: 'プラナ'},
    portrait: ['NPC_Portrait_NP0035_Collection'],
  },
  {
    name: {en: 'Rabu', ko: '라브', ja: 'ラブ'},
    portrait: ['Student_Portrait_CH0166_Collection'],
  },
  {
    name: {en: 'Rei', ko: '레이', ja: 'レイ'},
    portrait: ['Student_Portrait_CH0245_Collection'],
  },
  {
    name: {en: 'Reijo', ko: '레이죠', ja: 'レイジョ'},
    portrait: ['Student_Portrait_Reizyo_Collection'],
  },
  {
    name: {en: 'Reisa', ko: '레이사', ja: 'レイサ'},
    portrait: ['Student_Portrait_CH0167_Collection', {id: 'Student_Portrait_CH0326_Collection', variation: 'magical'}],
  },
  {
    name: {en: 'Renge', ko: '렌게', ja: 'レンゲ'},
    portrait: ['Student_Portrait_CH0224_Collection', {id: 'Student_Portrait_CH0302_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Rin', ko: '린', ja: 'リン'},
    portrait: ['NPC_Portrait_Rin_Collection'],
  },
  {
    name: {en: 'Rio', ko: '리오', ja: 'リオ'},
    portrait: ['Student_Portrait_CH0158_Collection', {id: 'Student_Portrait_CH0190_Collection', variation: 'armed'}],
  },
  {
    name: {en: 'Ritsu', ko: '리츠', ja: 'リツ'},
    portrait: ['Student_Portrait_CH0319_Collection'],
  },
  {
    name: {en: 'Rumi', ko: '루미', ja: 'ルミ'},
    portrait: ['Student_Portrait_CH0135_Collection'],
  },
  {
    name: {en: 'Saki', ko: '사키', ja: 'サキ'},
    portrait: ['Student_Portrait_CH0144_Collection', {id: 'Student_Portrait_CH0217_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Sakurako', ko: '사쿠라코', ja: 'サクラコ'},
    portrait: ['Student_Portrait_Sakurako_Collection', {id: 'Student_Portrait_CH0274_Collection', variation: 'idol'}],
  },
  {
    name: {en: 'Saori', ko: '사오리', ja: 'サオリ'},
    portrait: [
      'Student_Portrait_Saori_Collection',
      {id: 'Student_Portrait_CH0259_Collection', variation: 'dress'},
      {id: 'Student_Portrait_CH0266_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Satsuki', ko: '사츠키', ja: 'サツキ'},
    portrait: ['Student_Portrait_CH0080_Collection'],
  },
  {
    name: {en: 'Saya', ko: '사야', ja: 'サヤ'},
    portrait: [
      'Student_Portrait_Saya_Collection',
      {id: 'Student_Portrait_Saya_casual_Collection', variation: 'casual'},
    ],
  },
  {
    name: {en: 'Seia', ko: '세이아', ja: 'セイア'},
    portrait: ['Student_Portrait_CH0070_Collection', {id: 'Student_Portrait_CH0295_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Sena', ko: '세나', ja: 'セナ'},
    portrait: ['Student_Portrait_Sena_Collection', {id: 'Student_Portrait_CH0082_Collection', variation: 'casual'}],
  },
  {
    name: {en: 'Serika', ko: '세리카', ja: 'セリカ'},
    portrait: [
      'Student_Portrait_Serika_Collection',
      {id: 'Student_Portrait_Serika_Newyear_Collection', variation: 'newyear'},
      {id: 'Student_Portrait_CH0189_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Serina', ko: '세리나', ja: 'セリナ'},
    portrait: [
      'Student_Portrait_Serina_Collection',
      {id: 'Student_Portrait_CH0194_Collection', variation: 'christmas'},
    ],
  },
  {
    name: {en: 'Shigure', ko: '시구레', ja: 'シグレ'},
    portrait: ['Student_Portrait_Shigure_Collection', {id: 'Student_Portrait_CH0123_Collection', variation: 'onsen'}],
  },
  {
    name: {en: 'Shimiko', ko: '시미코', ja: 'シミコ'},
    portrait: ['Student_Portrait_Shimiko_Collection'],
  },
  {
    name: {en: 'Shiroko', ko: '시로코', ja: 'シロコ'},
    portrait: [
      'Student_Portrait_Shiroko_Collection',
      {id: 'Student_Portrait_Shiroko_ridingsuit_Collection', variation: 'ride'},
      {id: 'Student_Portrait_CH0188_Collection', variation: 'swimsuit'},
      {id: 'Student_Portrait_CH0263_Collection', variation: 'terror'},
    ],
  },
  {
    name: {en: 'Shizuko', ko: '시즈코', ja: 'シズコ'},
    portrait: [
      'Student_Portrait_Shizuko_Collection',
      {id: 'Student_Portrait_CH0180_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Shun', ko: '슌', ja: 'シュン'},
    portrait: ['Student_Portrait_Shun_Collection', {id: 'Student_Portrait_CH0066_Collection', variation: 'small'}],
  },
  {
    name: {en: 'Sora', ko: '소라', ja: 'ソラ'},
    portrait: ['NPC_Portrait_Sora_Collection'],
  },
  {
    name: {en: 'Subaru', ko: '스바루', ja: 'スバル'},
    portrait: ['Student_Portrait_CH0309_Collection'],
  },
  {
    name: {en: 'Sumire', ko: '스미레', ja: 'スミレ'},
    portrait: ['Student_Portrait_Sumire_Collection', {id: 'Student_Portrait_CH0287_Collection', variation: 'arbeit'}],
  },
  {
    name: {en: 'Suzumi', ko: '스즈미', ja: 'スズミ'},
    portrait: ['Student_Portrait_Suzumi_Collection', {id: 'Student_Portrait_CH0325_Collection', variation: 'magical'}],
  },
  {
    name: {en: 'Takane', ko: '타카네', ja: 'タカネ'},
    portrait: ['Student_Portrait_CH0229_Collection'],
  },
  {
    name: {en: 'Toki', ko: '토키', ja: 'トキ'},
    portrait: ['Student_Portrait_CH0187_Collection', {id: 'Student_Portrait_CH0211_Collection', variation: 'bunny'}],
  },
  {
    name: {en: 'Tomoe', ko: '토모에', ja: 'トモエ'},
    portrait: ['Student_Portrait_Tomoe_Collection', {id: 'Student_Portrait_CH0271_Collection', variation: 'qipao'}],
  },
  {
    name: {en: 'Tsubaki', ko: '츠바키', ja: 'ツバキ'},
    portrait: ['Student_Portrait_Tsubaki_Collection', {id: 'Student_Portrait_CH0255_Collection', variation: 'guide'}],
  },
  {
    name: {en: 'Tsukuyo', ko: '츠쿠요', ja: 'ツクヨ'},
    portrait: ['Student_Portrait_CH0114_Collection', {id: 'Student_Portrait_CH0297_Collection', variation: 'dress'}],
  },
  {
    name: {en: 'Tsurugi', ko: '츠루기', ja: 'ツルギ'},
    portrait: [
      'Student_Portrait_Tsurugi_Collection',
      {id: 'Student_Portrait_CH0060_Collection', variation: 'swimsuit'},
    ],
  },
  {
    name: {en: 'Ui', ko: '우이', ja: 'ウイ'},
    portrait: ['Student_Portrait_CH0169_Collection', {id: 'Student_Portrait_CH0204_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Umika', ko: '우미카', ja: 'ウミカ'},
    portrait: ['Student_Portrait_CH0110_Collection'],
  },
  {
    name: {en: 'Utaha', ko: '우타하', ja: 'ウタハ'},
    portrait: ['Student_Portrait_Utaha_Collection', {id: 'Student_Portrait_CH0182_Collection', variation: 'ouen'}],
  },
  {
    name: {en: 'Wakamo', ko: '와카모', ja: 'ワカモ'},
    portrait: ['Student_Portrait_Wakamo_Collection', {id: 'Student_Portrait_CH0175_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Yakumo', ko: '야쿠모', ja: 'ヤクモ'},
    portrait: ['Student_Portrait_CH0228_Collection'],
  },
  {
    name: {en: 'Yoshimi', ko: '요시미', ja: 'ヨシミ'},
    portrait: ['Student_Portrait_Yoshimi_Collection', {id: 'Student_Portrait_CH0220_Collection', variation: 'band'}],
  },
  {
    name: {en: 'Yukari', ko: '유카리', ja: 'ユカリ'},
    portrait: ['Student_Portrait_CH0161_Collection', {id: 'Student_Portrait_CH0301_Collection', variation: 'swimsuit'}],
  },
  {
    name: {en: 'Yuuka', ko: '유우카', ja: 'ユウカ'},
    portrait: [
      'Student_Portrait_Yuuka_Collection',
      {id: 'Student_Portrait_CH0184_Collection', variation: 'taisou'},
      {id: 'Student_Portrait_CH0284_Collection', variation: 'pajamas'},
    ],
  },
  {
    name: {en: 'Yuzu', ko: '유즈', ja: 'ユズ'},
    portrait: ['Student_Portrait_Yuzu_Collection', {id: 'Student_Portrait_CH0203_Collection', variation: 'maid'}],
  },
] satisfies Student[]
