# Hướng dẫn chạy backend (IntelliJ & VS Code)

Mô tả ngắn: tài liệu này hướng dẫn cách chuẩn bị môi trường và chạy module `backend` của dự án trên Windows/macOS/Linux bằng IntelliJ IDEA hoặc Visual Studio Code.

---

## 1. Yêu cầu trước

- Java JDK 21 (Temurin/Adoptium hoặc OpenJDK 21). Kiểm tra bằng:

```
java -version
```

- Git (để clone repo) — hoặc tải zip từ giao diện.

- Maven không bắt buộc do dự án có `mvnw` (Maven Wrapper), nhưng bạn có thể cài Maven nếu muốn.

- Docker (tùy chọn) — nếu muốn chạy PostgreSQL local với Docker.

- IDE: IntelliJ IDEA (Community hoặc Ultimate) hoặc Visual Studio Code + Java extensions.

---

## 2. Cài đặt bổ sung hữu ích

- IntelliJ:
  - Lombok plugin (Preferences → Plugins → search "Lombok")
  - Chọn SDK: Java 21 (Project Structure → Project SDK)
  - Bật "Annotation Processors": Settings → Build, Execution, Deployment → Compiler → Annotation Processors → Enable annotation processing

- VS Code:
  - Cài `Extension Pack for Java` (Microsoft)
  - Cài `Language Support for Java(TM) by Red Hat`, `Debugger for Java`, `Maven for Java`
  - Cài `Lombok Annotations Support for VS Code` (nếu cần)
  - Cấu hình `java.home` nếu VS Code không tự phát hiện JDK

---

## 3. Cơ sở dữ liệu (PostgreSQL)

Ứng dụng mặc định dùng PostgreSQL (xem `backend/src/main/resources/application.properties`). Bạn có 2 cách:

A. Sử dụng database được cấu hình sẵn (nếu repo cung cấp) — CHÚ Ý: kiểm tra file `application.properties` trước khi chạy để tránh dùng credential không mong muốn.

B. Chạy PostgreSQL local bằng Docker (khuyến nghị):

```bash
# chạy postgres local (bạn có thể đổi user/password/db)
docker run --name rental-db -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=rentaldb -p 5432:5432 -d postgres:15
```

Sau đó chỉnh `backend/src/main/resources/application.properties` (hoặc tạo `application-local.properties`) để trỏ tới `jdbc:postgresql://localhost:5432/rentaldb` và set username/password tương ứng.

Bạn cũng có thể export biến môi trường để ghi đè cấu hình Spring Boot:

```bash
# Windows (Powershell)
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/rentaldb"
$env:SPRING_DATASOURCE_USERNAME = "myuser"
$env:SPRING_DATASOURCE_PASSWORD = "mypassword"

# Linux/macOS
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/rentaldb"
export SPRING_DATASOURCE_USERNAME="myuser"
export SPRING_DATASOURCE_PASSWORD="mypassword"
```

---

## 4. Cấu hình dự án

1. Mở project root (thư mục chứa `backend/` và `frontend/`) trong IDE.
2. Chọn JDK 21 cho module `backend` (Project Structure / Settings).
3. Nếu dùng Lombok: đảm bảo plugin đã được cài và annotation processing bật.
4. Nếu bạn chỉnh `application.properties`, lưu ý: KHÔNG commit credential nhạy cảm vào git.

---

## 5. Chạy bằng IntelliJ IDEA

1. Mở IntelliJ → `File` → `Open...` → chọn thư mục `backend` hoặc toàn project.
2. IntelliJ sẽ phát hiện `pom.xml` (Maven). Cho phép import Maven project.
3. Thiết lập `Project SDK` → chọn Java 21.
4. Bật Annotation Processors và cài Lombok plugin (nếu chưa).
5. Tạo cấu hình run: `Run` → `Edit Configurations...` → `+` → `Application`.
   - Name: `RentalApplication`
   - Main class: `com.example.Rental.RentalApplication`
   - Use classpath of module: chọn module `backend` (hoặc module tương ứng)
   - VM options: (thêm nếu cần)
   - Environment variables: (nếu muốn ghi đè DB) `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/rentaldb;SPRING_DATASOURCE_USERNAME=myuser;SPRING_DATASOURCE_PASSWORD=mypassword`
6. Chạy (Run) hoặc debug config vừa tạo.

Hoặc chạy Maven goal trực tiếp trong IntelliJ: `Lifecycle` → `clean` → `install` hoặc `spring-boot:run`.

---

## 6. Chạy bằng Visual Studio Code

1. Mở thư mục project trong VS Code.
2. Khi VS Code gợi ý, chọn "Import Maven Projects" hoặc mở view `Maven` (left bar) và import `backend/pom.xml`.
3. Cài đặt extension Java cần thiết (như phần 2).
4. Để chạy:
   - Mở terminal trong VS Code rồi chạy (Windows):

```powershell
# Windows
cd backend
mvnw.cmd spring-boot:run
```

```bash
# macOS / Linux
cd backend
./mvnw spring-boot:run
```

   - Hoặc tạo launch configuration trong `.vscode/launch.json` để chạy `com.example.Rental.RentalApplication`.
5. Để chạy tests:

```bash
# Windows
cd backend
mvnw.cmd test

# macOS / Linux
cd backend
./mvnw test
```

---

## 7. Các lệnh thường dùng

- Build (skip tests):

```bash
# Windows
cd backend
mvnw.cmd -DskipTests package

# macOS/Linux
cd backend
./mvnw -DskipTests package
```

- Run tests:

```bash
cd backend
# Windows
mvnw.cmd test
# macOS/Linux
./mvnw test
```

- Run app via mvnw:

```bash
# Windows
mvnw.cmd spring-boot:run
# macOS/Linux
./mvnw spring-boot:run
```

---

## 8. Troubleshooting nhanh

- Error: `Could not determine database` / `Connection refused` → kiểm tra DB đang chạy và `application.properties` hoặc biến môi trường.
- Error: Lombok annotations không nhận dạng → cài Lombok plugin + bật annotation processing.
- Error: `Port 8080 already in use` → thay `server.port` trong `application.properties` hoặc chạy app trên cổng khác:

```
# Run with different port
-Dserver.port=8081
```

- Nếu tests không load ApplicationContext do thiếu bean (đặc biệt khi test tắt auto-config cho DB), mock các `@Repository` liên quan trong test bằng `@MockBean`.

---

## 9. Ghi chú bảo mật

- `backend/src/main/resources/application.properties` có cấu hình DB; KHÔNG commit các thay đổi chứa mật khẩu/credential thật lên remote.
- Sử dụng `application-local.properties` hoặc biến môi trường để ghi đè khi chạy local.

---

Nếu bạn muốn, mình có thể:
- Thêm `launch.json` và `settings.json` mẫu cho VS Code vào repo.
- Tạo `docker-compose.yml` nhỏ để khởi động PostgreSQL + (tuỳ chọn) pgadmin.

Bạn muốn mình thêm phần nào không?