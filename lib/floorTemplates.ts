const GROCERY_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#f9fafb"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="110" height="160" fill="#dbeafe" rx="6"/>
  <text x="75" y="105" text-anchor="middle" fill="#1e40af" font-size="13" font-weight="600">DAIRY</text>
  <rect x="145" y="20" width="110" height="100" fill="#fce7f3" rx="6"/>
  <text x="200" y="75" text-anchor="middle" fill="#9d174d" font-size="13" font-weight="600">MEAT</text>
  <rect x="145" y="135" width="110" height="145" fill="#f3f4f6" rx="6"/>
  <text x="200" y="215" text-anchor="middle" fill="#6b7280" font-size="12">AISLE 1</text>
  <rect x="270" y="20" width="110" height="260" fill="#f3f4f6" rx="6"/>
  <text x="325" y="152" text-anchor="middle" fill="#6b7280" font-size="12">AISLE 2</text>
  <rect x="395" y="20" width="70" height="260" fill="#f3f4f6" rx="6"/>
  <text x="430" y="152" text-anchor="middle" fill="#9ca3af" font-size="11">AISLE 3</text>
  <rect x="480" y="20" width="100" height="160" fill="#fef3c7" rx="6"/>
  <text x="530" y="105" text-anchor="middle" fill="#92400e" font-size="13" font-weight="600">BAKERY</text>
  <rect x="20" y="195" width="110" height="85" fill="#d1fae5" rx="6"/>
  <text x="75" y="242" text-anchor="middle" fill="#065f46" font-size="13" font-weight="600">PRODUCE</text>
  <rect x="480" y="195" width="100" height="85" fill="#e0e7ff" rx="6"/>
  <text x="530" y="242" text-anchor="middle" fill="#3730a3" font-size="13" font-weight="600">DRINKS</text>
  <rect x="20" y="300" width="560" height="50" fill="#1f2937" rx="6"/>
  <text x="300" y="330" text-anchor="middle" fill="white" font-size="13" font-weight="600" letter-spacing="2">CHECKOUT</text>
  <rect x="260" y="370" width="80" height="22" fill="white" rx="3"/>
  <text x="300" y="384" text-anchor="middle" fill="#6b7280" font-size="11">ENTRANCE</text>
</svg>`

const HARDWARE_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#fafafa"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="170" height="120" fill="#fef3c7" rx="6"/>
  <text x="105" y="85" text-anchor="middle" fill="#92400e" font-size="13" font-weight="600">TOOLS</text>
  <rect x="210" y="20" width="170" height="120" fill="#e0e7ff" rx="6"/>
  <text x="295" y="85" text-anchor="middle" fill="#3730a3" font-size="13" font-weight="600">PAINT</text>
  <rect x="400" y="20" width="180" height="120" fill="#f3f4f6" rx="6"/>
  <text x="490" y="85" text-anchor="middle" fill="#6b7280" font-size="13" font-weight="600">PLUMBING</text>
  <rect x="20" y="160" width="270" height="130" fill="#f3f4f6" rx="6"/>
  <text x="155" y="230" text-anchor="middle" fill="#6b7280" font-size="12">AISLE A</text>
  <rect x="310" y="160" width="270" height="130" fill="#f3f4f6" rx="6"/>
  <text x="445" y="230" text-anchor="middle" fill="#6b7280" font-size="12">AISLE B</text>
  <rect x="20" y="310" width="560" height="50" fill="#1f2937" rx="6"/>
  <text x="300" y="340" text-anchor="middle" fill="white" font-size="13" font-weight="600">CHECKOUT</text>
</svg>`

const PHARMACY_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#fafafa"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="120" height="280" fill="#fce7f3" rx="6"/>
  <text x="80" y="165" text-anchor="middle" fill="#9d174d" font-size="12" font-weight="600">RX COUNTER</text>
  <rect x="160" y="20" width="100" height="280" fill="#f3f4f6" rx="6"/>
  <text x="210" y="165" text-anchor="middle" fill="#6b7280" font-size="11">OTC 1</text>
  <rect x="280" y="20" width="100" height="280" fill="#f3f4f6" rx="6"/>
  <text x="330" y="165" text-anchor="middle" fill="#6b7280" font-size="11">OTC 2</text>
  <rect x="400" y="20" width="180" height="140" fill="#d1fae5" rx="6"/>
  <text x="490" y="95" text-anchor="middle" fill="#065f46" font-size="12" font-weight="600">VITAMINS</text>
  <rect x="400" y="180" width="180" height="120" fill="#dbeafe" rx="6"/>
  <text x="490" y="245" text-anchor="middle" fill="#1e40af" font-size="12" font-weight="600">BEAUTY</text>
  <rect x="20" y="320" width="560" height="40" fill="#1f2937" rx="6"/>
  <text x="300" y="345" text-anchor="middle" fill="white" font-size="12">ENTRANCE</text>
</svg>`

const GARDEN_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#fafafa"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="260" height="150" fill="#d1fae5" rx="6"/>
  <text x="150" y="100" text-anchor="middle" fill="#065f46" font-size="13" font-weight="600">OUTDOOR PLANTS</text>
  <rect x="300" y="20" width="280" height="150" fill="#fef3c7" rx="6"/>
  <text x="440" y="100" text-anchor="middle" fill="#92400e" font-size="13" font-weight="600">SOIL &amp; MULCH</text>
  <rect x="20" y="190" width="180" height="150" fill="#f3f4f6" rx="6"/>
  <text x="110" y="270" text-anchor="middle" fill="#6b7280" font-size="12">TOOLS</text>
  <rect x="220" y="190" width="180" height="150" fill="#f3f4f6" rx="6"/>
  <text x="310" y="270" text-anchor="middle" fill="#6b7280" font-size="12">SEEDS</text>
  <rect x="420" y="190" width="160" height="150" fill="#e0e7ff" rx="6"/>
  <text x="500" y="270" text-anchor="middle" fill="#3730a3" font-size="12">POTS</text>
  <rect x="20" y="360" width="560" height="30" fill="#1f2937" rx="6"/>
  <text x="300" y="380" text-anchor="middle" fill="white" font-size="11">CHECKOUT</text>
</svg>`

const LIQUOR_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#fafafa"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="130" height="280" fill="#fef3c7" rx="6"/>
  <text x="85" y="165" text-anchor="middle" fill="#92400e" font-size="12" font-weight="600">WINE</text>
  <rect x="170" y="20" width="130" height="280" fill="#e0e7ff" rx="6"/>
  <text x="235" y="165" text-anchor="middle" fill="#3730a3" font-size="12" font-weight="600">BEER</text>
  <rect x="320" y="20" width="130" height="280" fill="#fce7f3" rx="6"/>
  <text x="385" y="165" text-anchor="middle" fill="#9d174d" font-size="12" font-weight="600">SPIRITS</text>
  <rect x="470" y="20" width="110" height="280" fill="#f3f4f6" rx="6"/>
  <text x="525" y="165" text-anchor="middle" fill="#6b7280" font-size="11">MIXERS</text>
  <rect x="20" y="320" width="560" height="40" fill="#1f2937" rx="6"/>
  <text x="300" y="345" text-anchor="middle" fill="white" font-size="12">CHECKOUT</text>
</svg>`

const BOOKSTORE_SVG = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
  <rect width="600" height="400" fill="#fafafa"/>
  <rect x="8" y="8" width="584" height="384" fill="none" stroke="#d1d5db" stroke-width="2" rx="6"/>
  <rect x="20" y="20" width="170" height="280" fill="#e0e7ff" rx="6"/>
  <text x="105" y="165" text-anchor="middle" fill="#3730a3" font-size="12" font-weight="600">FICTION</text>
  <rect x="210" y="20" width="170" height="280" fill="#fce7f3" rx="6"/>
  <text x="295" y="165" text-anchor="middle" fill="#9d174d" font-size="12" font-weight="600">NON-FICTION</text>
  <rect x="400" y="20" width="180" height="130" fill="#fef3c7" rx="6"/>
  <text x="490" y="90" text-anchor="middle" fill="#92400e" font-size="12" font-weight="600">KIDS</text>
  <rect x="400" y="170" width="180" height="130" fill="#d1fae5" rx="6"/>
  <text x="490" y="240" text-anchor="middle" fill="#065f46" font-size="12" font-weight="600">STATIONERY</text>
  <rect x="20" y="320" width="560" height="40" fill="#1f2937" rx="6"/>
  <text x="300" y="345" text-anchor="middle" fill="white" font-size="12">CHECKOUT</text>
</svg>`

export interface FloorTemplate {
  id: string
  label: string
  svg: string
  url: string
}

function toTemplate(id: string, label: string, svg: string): FloorTemplate {
  return { id, label, svg, url: `data:image/svg+xml,${encodeURIComponent(svg)}` }
}

export const FLOOR_TEMPLATES: FloorTemplate[] = [
  toTemplate('grocery', 'Grocery', GROCERY_SVG),
  toTemplate('hardware', 'Hardware', HARDWARE_SVG),
  toTemplate('pharmacy', 'Pharmacy', PHARMACY_SVG),
  toTemplate('garden', 'Garden Center', GARDEN_SVG),
  toTemplate('liquor', 'Liquor', LIQUOR_SVG),
  toTemplate('bookstore', 'Bookstore', BOOKSTORE_SVG),
]

export function getTemplate(id: string): FloorTemplate | undefined {
  return FLOOR_TEMPLATES.find(t => t.id === id)
}

export const AUTO_TAG_SPOTS: [number, number][] = [
  [12, 30], [12, 55], [33, 22], [33, 52], [45, 40], [55, 30],
  [55, 55], [71, 35], [88, 25], [88, 58], [12, 68], [33, 65],
]
