# Hướng Dẫn Chạy & Kiểm Thử Dự Án Backend

Tài liệu này cung cấp hướng dẫn từng bước để cấu hình, khởi chạy và kiểm thử dự án backend Spring Boot bằng **IntelliJ IDEA** hoặc **Terminal (Dòng lệnh)** mà không gặp lỗi.

---

## 1. Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
*   **Java Development Kit (JDK):** Phiên bản **21** hoặc **22** (dự án cấu hình sử dụng JDK 21/22).
*   **Maven:** Đã được tích hợp sẵn thông qua Maven Wrapper (`mvnw` / `mvnw.cmd`).
*   **Postman:** Dùng để kiểm thử các đầu API.
*   **Kết nối Internet:** Để tải các thư viện Maven và kết nối tới cơ sở dữ liệu đám mây Neon PostgreSQL.

---

## 2. Cấu hình tệp môi trường (`.env`)

Dự án sử dụng tệp cấu hình `.env` để bảo mật các thông số nhạy cảm.
1. Đảm bảo tệp `.env` nằm trong thư mục `backend/` có nội dung tương tự như dưới đây:
   ```properties
   DB_HOST=ep-hidden-heart-aqv8rp6w-pooler.c-8.us-east-1.aws.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USERNAME=neondb_owner
   DB_PASSWORD=npg_PlEGfbr4R5WT
   DB_SSLMODE=require
   DB_CHANNEL_BINDING=require
   MAIL_USERNAME=huyennguyen08032005@gmail.com
   MAIL_PASSWORD=
   JWT_SECRET=770864096025a19b80a33e4c2d5a345678912345678912345678912345678912
   ```
2. Nếu chạy trên máy local khác hoặc muốn đổi database, bạn chỉ cần sửa các giá trị tương ứng trong tệp `backend/.env` này.

---

## 3. Khởi chạy dự án bằng IntelliJ IDEA

Để nhập (import) và chạy dự án trong IntelliJ IDEA mà không gặp lỗi biên dịch hay thiếu file cấu hình:

### Bước 1: Import dự án vào IntelliJ
1. Mở IntelliJ IDEA.
2. Chọn **File** -> **Open** và chọn thư mục gốc của dự án: `2526II_INT3505_1_Nhom4`.
3. IntelliJ sẽ tự động phát hiện dự án Maven và đồng bộ hóa các thư viện (quá trình này có thể mất vài phút ở lần đầu tiên).

### Bước 2: Cấu hình SDK / JDK 21 hoặc 22
1. Đi tới **File** -> **Project Structure** (hoặc nhấn `Ctrl + Alt + Shift + S`).
2. Tại mục **Project**, đảm bảo:
   *   **SDK:** Chọn JDK 21 hoặc JDK 22.
   *   **Language level:** Chọn `21 - String templates...` hoặc `22`.
3. Nhấn **OK** để lưu lại.

### Bước 3: Bật Annotation Processing (Bắt buộc cho Lombok)
Dự án sử dụng thư viện Lombok để sinh tự động getter/setter/builder. Bạn phải bật tính năng xử lý annotation để IntelliJ không báo lỗi code đỏ:
1. Vào **File** -> **Settings** (hoặc `Ctrl + Alt + S`).
2. Tìm kiếm từ khóa: `Annotation Processors` (nằm trong mục **Build, Execution, Deployment** -> **Compiler** -> **Annotation Processors**).
3. Tích chọn **Enable annotation processing**.
4. Nhấn **Apply** và **OK**.

### Bước 4: Khởi chạy ứng dụng
1. Trong cửa sổ Project, điều hướng tới: `backend/src/main/java/com/example/Rental/RentalApplication.java`.
2. Click chuột phải vào file `RentalApplication.java` và chọn **Run 'RentalApplication.main()'**.
3. Hệ thống sẽ biên dịch và chạy trên cổng mặc định **`8080`**.
4. Bạn sẽ thấy log khởi chạy thành công dạng: `Started RentalApplication in X seconds`.

> [!TIP]
> **Giải quyết lỗi không tìm thấy `application.properties` khi chạy trên IntelliJ:**
>
> Chúng tôi đã di chuyển tệp `application.properties` vào thư mục chuẩn Maven `backend/src/main/resources/`. Khi IntelliJ hoặc Maven biên dịch dự án, tệp này sẽ tự động được đóng gói vào classpath (thư mục `target/classes`), đảm bảo ứng dụng luôn tìm thấy cấu hình dù cho bạn thiết lập thư mục làm việc (Working Directory) của IntelliJ ở bất kỳ đâu.

---

## 4. Khởi chạy dự án bằng Terminal / Dòng lệnh

Nếu bạn muốn build hoặc chạy ứng dụng trực tiếp bằng dòng lệnh từ terminal (PowerShell, Command Prompt, Git Bash):

1. **Mở terminal** và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. **Dọn dẹp và Biên dịch dự án:**
   ```bash
   # Trên Windows (PowerShell)
   .\mvnw clean compile

   # Trên Windows (CMD)
   mvnw clean compile

   # Trên Linux/macOS
   ./mvnw clean compile
   ```

3. **Chạy các bài kiểm thử tự động (Unit / Integration Tests):**
   ```bash
   .\mvnw test
   ```

4. **Khởi chạy ứng dụng Spring Boot:**
   ```bash
   .\mvnw spring-boot:run
   ```
   Ứng dụng sẽ bắt đầu chạy và lắng nghe tại cổng `http://localhost:8080`.

---

## 5. Kiểm thử các API bằng Postman

Chúng tôi đã chuẩn bị sẵn một tệp Postman Collection đầy đủ các endpoint phục vụ việc đăng ký, đăng nhập, quản lý hợp đồng và thanh toán.

### Bước 1: Nhập Collection vào Postman
1. Mở ứng dụng Postman.
2. Chọn nút **Import** ở góc trên cùng bên trái.
3. Chọn tệp [postman_collection.json](file:///d:/Download/Learn/kientrucdichvu/2526II_INT3505_1_Nhom4/docs/postman_collection.json) nằm trong thư mục `docs/` của dự án để nhập vào.
4. Một collection tên **"Rental Services API"** sẽ xuất hiện trong danh mục kiểm thử của bạn.

### Bước 2: Cấu hình biến môi trường trên Postman
Collection này sử dụng hai biến tự động là `{{baseUrl}}` (mặc định là `http://localhost:8080`) và `{{token}}` (được lưu tự động sau khi đăng nhập thành công).
1. Kiểm tra tab **Variables** của collection để đảm bảo `baseUrl` trỏ tới đúng cổng của backend đang chạy (`http://localhost:8080`).

### Bước 3: Kiểm thử luồng API chuẩn
1. **Đăng ký tài khoản (Register):**
   *   Chọn request `Register Owner` (đăng ký làm chủ nhà) hoặc `Register Renter` (đăng ký làm người thuê).
   *   Nhấn **Send** để đăng ký.
2. **Đăng nhập (Login):**
   *   Mở request `Login` và điền tài khoản vừa đăng ký.
   *   Nhấn **Send**. Đoạn script kiểm thử đi kèm sẽ tự động lưu mã JWT token vào biến môi trường `{{token}}`.
3. **Quản lý hợp đồng & Thanh toán (Contracts & Payments):**
   *   Sau khi đăng nhập thành công, bạn có thể thực hiện kiểm thử các API trong thư mục `Contracts` và `Payments`. Mã `token` sẽ tự động được đính kèm vào phần Header `Authorization: Bearer {{token}}` của tất cả các yêu cầu tiếp theo.
