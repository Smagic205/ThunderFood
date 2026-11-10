import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import axios from 'axios'
import { server } from './mocks/server'

// Sử dụng adapter 'fetch' cho Axios trong môi trường test để MSW chặn request mượt mà
axios.defaults.adapter = 'fetch'

// 1. Khởi động MSW Server chặn các cuộc gọi mạng trước khi chạy bài test
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'warn' })
})

// 2. Reset lại các handlers tùy biến sau mỗi bài test và cleanup DOM
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// 3. Tắt MSW Server khi tất cả các bài test kết thúc
afterAll(() => {
  server.close()
})
