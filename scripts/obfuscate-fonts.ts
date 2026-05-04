import fs from 'node:fs'
import path from 'node:path'

/**
 * 폰트 파일을 XOR 연산으로 난독화하여 바이너리(.bin) 파일로 변환하는 스크립트
 */

const INPUT_DIR = 'src/lib/assets/fonts'
const OUTPUT_DIR = 'static/fonts'
const XOR_KEY = 'quiple.dev'

function obfuscate() {
  // 출력 디렉터리가 없으면 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {recursive: true})
  }

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Input directory not found: ${INPUT_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(INPUT_DIR)
  let count = 0

  console.log('🚀 Starting font obfuscation...')

  for (const file of files) {
    // .woff2 파일만 처리 (필요시 .ttf, .otf 등 추가 가능)
    if (file.endsWith('.woff2')) {
      const inputPath = path.join(INPUT_DIR, file)

      // 파일명 정규화: 소문자화, 공백 제거 등
      let baseName = file
        .split('.')[0]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // 기존 API에서 사용하는 이름과 매핑
      if (baseName.includes('shinmgo') && baseName.includes('debold')) {
        baseName = 'shinmgo-debold'
      } else if (baseName.includes('shinmgo') && baseName.includes('medium')) {
        baseName = 'shinmgo'
      } else if (baseName.includes('gyeonggititle-bold')) {
        baseName = 'gyeonggi-bold'
      } else if (baseName.includes('gyeonggititle-medium')) {
        baseName = 'gyeonggi'
      } else if (baseName.includes('gyeonggititle-light')) {
        baseName = 'gyeonggi-light'
      } else if (baseName.includes('jalnan')) {
        baseName = 'jalnan'
      } else if (baseName.includes('notosans-regular')) {
        baseName = 'notosans'
      } else if (baseName.includes('notosans-bold')) {
        baseName = 'notosans-bold'
      }

      const outputName = `${baseName}.bin`
      const outputPath = path.join(OUTPUT_DIR, outputName)

      try {
        const buffer = fs.readFileSync(inputPath)
        const obfuscated = Buffer.alloc(buffer.length)

        for (let i = 0; i < buffer.length; i++) {
          // XOR 연산 수행
          obfuscated[i] = buffer[i] ^ XOR_KEY.charCodeAt(i % XOR_KEY.length)
        }

        fs.writeFileSync(outputPath, obfuscated)
        console.log(`✅ Converted: ${file.padEnd(35)} -> ${outputName} (${(buffer.length / 1024).toFixed(1)} KB)`)
        count++
      } catch (err) {
        console.error(`❌ Failed to convert ${file}:`, err)
      }
    }
  }

  console.log(`\n✨ Done! Total ${count} fonts obfuscated in "${OUTPUT_DIR}".`)
}

obfuscate()
