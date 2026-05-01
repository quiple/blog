const fs = require('fs')
const path = require('path')

const inputDir = 'src/lib/assets/fonts'
const outputDir = 'static/fonts'
const key = 'quiple.dev'

// 출력 디렉터리가 없으면 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {recursive: true})
}

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`)
  process.exit(1)
}

const files = fs.readdirSync(inputDir)

files.forEach((file) => {
  // .woff2 파일만 처리
  if (file.endsWith('.woff2')) {
    const inputPath = path.join(inputDir, file)

    // 파일명 규칙: 소문자화, 공백을 하이픈으로 변경, 특수문자 제거
    let baseName = file
      .split('.')[0]
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // 매핑 예외 처리 (기존에 사용하던 이름과 맞춤)
    if (baseName.includes('shinmgo') && baseName.includes('debold')) baseName = 'shinmgo-debold'
    else if (baseName.includes('shinmgo') && baseName.includes('medium')) baseName = 'shinmgo'
    else if (baseName.includes('gyeonggititle-bold')) baseName = 'gyeonggi-bold'
    else if (baseName.includes('gyeonggititle-medium')) baseName = 'gyeonggi'
    else if (baseName.includes('jalnan')) baseName = 'jalnan'
    else if (baseName.includes('notosans')) baseName = 'notosans'

    const outputName = `${baseName}.bin`
    const outputPath = path.join(outputDir, outputName)

    const buffer = fs.readFileSync(inputPath)
    const obfuscated = Buffer.alloc(buffer.length)

    for (let i = 0; i < buffer.length; i++) {
      // XOR 연산 수행
      obfuscated[i] = buffer[i] ^ key.charCodeAt(i % key.length)
    }

    fs.writeFileSync(outputPath, obfuscated)
    console.log(`Converted: ${file} -> ${outputName} (${buffer.length} bytes)`)
  }
})

console.log('\n모든 폰트 변환이 완료되었습니다.')
