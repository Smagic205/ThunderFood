# ==========================================
# Giai đoạn 1: Build mã nguồn với Node.js Alpine
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Tham số nhận diện ứng dụng cần build (mặc định là 'web', có thể là 'admin' hoặc 'staff')
ARG APP_NAME=web

# Copy các file cấu hình và quản lý workspace để tận dụng cache layer
COPY package.json package-lock.json ./
COPY packages/ packages/
COPY apps/${APP_NAME}/package.json apps/${APP_NAME}/

# Cài đặt dependencies toàn bộ workspace
RUN npm ci

# Copy toàn bộ mã nguồn của app được chọn
COPY apps/${APP_NAME}/ apps/${APP_NAME}/

# Build production cho ứng dụng tương ứng
RUN npm run build --workspace=@thunderfood/${APP_NAME}

# ==========================================
# Giai đoạn 2: Runtime image Nginx Alpine (< 25MB)
# ==========================================
FROM nginx:alpine

ARG APP_NAME=web

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copy file cấu hình Nginx SPA & Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy kết quả build từ stage builder sang thư mục phục vụ web của Nginx
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
