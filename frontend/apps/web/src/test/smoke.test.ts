import { describe, it, expect } from 'vitest'

describe('Smoke Test - Môi trường kiểm thử Frontend', () => {
  it('đảm bảo môi trường Vitest hoạt động bình thường', () => {
    expect(1 + 1).toBe(2)
  })

  it('đảm bảo môi trường JSDOM (DOM ảo) hoạt động', () => {
    const div = document.createElement('div')
    div.textContent = 'ThunderFood Test'
    expect(div.textContent).toBe('ThunderFood Test')
  })
})
