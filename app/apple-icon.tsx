import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const PIN_SVG = `<svg width="120" height="120" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" fill-rule="evenodd"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={120}
          height={120}
          src={`data:image/svg+xml,${encodeURIComponent(PIN_SVG)}`}
          alt=""
        />
      </div>
    ),
    { ...size }
  )
}
