import {fontRange} from 'font-range'

const kr_path = 'node_modules/@ibm/plex-sans-kr/fonts/complete/woff2/hinted/IBMPlexSansKR-'
const jp_path = 'node_modules/@ibm/plex-sans-jp/fonts/complete/woff2/hinted/IBMPlexSansJP-'
const ext = '.woff2'

const kr_css = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR&display=swap'
const jp_css = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap'

fontRange(kr_path + 'ExtraLight' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'Light' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'Regular' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'Text' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'Medium' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'SemiBold' + ext, kr_css, 'static/fonts')
fontRange(kr_path + 'Bold' + ext, kr_css, 'static/fonts')

fontRange(jp_path + 'ExtraLight' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'Light' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'Regular' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'Text' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'Medium' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'SemiBold' + ext, jp_css, 'static/fonts')
fontRange(jp_path + 'Bold' + ext, jp_css, 'static/fonts')
