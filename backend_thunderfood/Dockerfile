# ==========================================
# Giai đoạn 1: Build file JAR từ mã nguồn
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Cài đặt curl và ca-certificates hỗ trợ tải package ổn định
RUN apk add --no-cache curl ca-certificates

# Copy Maven Wrapper và pom.xml trước để tận dụng Docker Cache layer
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Xử lý ký tự xuống dòng Windows (CRLF -> LF) và cấp quyền thực thi cho mvnw
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Tải trước các thư viện phụ thuộc (Dependencies)
RUN ./mvnw dependency:go-offline -B

# Copy toàn bộ mã nguồn vào container và tiến hành build
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ==========================================
# Giai đoạn 2: Runtime image gọn nhẹ (Alpine JRE)
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Tạo user không có đặc quyền root để tăng tính bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy file .jar đã build từ stage 1
COPY --from=builder /app/target/*.jar app.jar

# Mặc định Spring Boot chạy trên cổng 8080
EXPOSE 8080

# Cấu hình tối ưu bộ nhớ JVM khi chạy trong container
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
