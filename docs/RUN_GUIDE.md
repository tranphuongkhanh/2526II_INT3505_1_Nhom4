# Hướng Dẫn Chạy & Kiểm Thử Dự Án Backend

Tài liệu này cung cấp hướng dẫn từng bước để cấu hình, khởi chạy và kiểm thử dự án backend Spring Boot bằng **IntelliJ IDEA**, **Visual Studio Code** hoặc **Terminal (Dòng lệnh)** mà không gặp lỗi.

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
1. Tạo tệp `.env` trong thư mục `backend/` (KHÔNG commit tệp này vào hệ thống quản lý mã nguồn).
2. Tệp `.env` nên chứa các biến môi trường sau (chỉ liệt kê tên biến ở đây — KHÔNG ghi giá trị nhạy cảm trong tài liệu này):
   - DB_HOST
   - DB_PORT
   - DB_NAME
   - DB_USERNAME
   - DB_PASSWORD
   - DB_SSLMODE
   - DB_CHANNEL_BINDING
   - MAIL_USERNAME
   - MAIL_PASSWORD
   - JWT_SECRET

3. Điền các giá trị tương ứng trên máy local hoặc trong môi trường CI/CD của bạn. Nếu chạy trên máy local khác hoặc muốn đổi database, chỉ cần sửa các biến trong `backend/.env`.

---

## 3. Khởi chạy dự án bằng IntelliJ IDEA

Để nhập (import) và chạy dự án trong IntelliJ IDEA mà không gặp lỗi biên dịch hay thiếu file cấu hình:

### Bước 1: Import dự án vào IntelliJ
1. Mở IntelliJ IDEA.
2. Chọn **File** -> **Open** và chọn thư mục gốc của dự án: `2526II_INT3505_1_Nhom4` hoặc trực tiếp mở thư mục `backend`.
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
2. Click chuột phải vào file `RentalApplication.java` và chọn **Run 'RentalApplication.main()'** (hoặc Debug để gỡ lỗi).
3. Hệ thống sẽ biên dịch và chạy trên cổng mặc định **`8080`**.
4. Bạn sẽ thấy log khởi chạy thành công dạng: `Started RentalApplication in X seconds`.

> [!TIP]
> **Giải quyết lỗi không tìm thấy `application.properties` khi chạy trên IntelliJ:**
>
> Chúng tôi đã đảm bảo tệp `application.properties` nằm trong `backend/src/main/resources/`. Khi IntelliJ hoặc Maven biên dịch dự án, tệp này sẽ tự động được đóng gói vào classpath (thư mục `target/classes`), đảm bảo ứng dụng luôn tìm thấy cấu hình dù cho bạn thiết lập thư mục làm việc (Working Directory) của IntelliJ ở bất kỳ đâu.

---

## 3b. Khởi chạy dự án bằng Visual Studio Code (VS Code)

Nếu bạn thích dùng VS Code, làm theo các bước sau để mở, biên dịch và chạy ứng dụng Spring Boot:

### Yêu cầu mở rộng (Extensions)
Cài đặt các extension sau trong VS Code để có trải nghiệm tốt nhất:
* Java Extension Pack (Microsoft)
* Spring Boot Extension Pack (Pivotal/VMware hoặc Microsoft)
* Lombok Annotations Support for VS Code (nếu có)

### Bước 1: Mở dự án
1. Mở VS Code.
2. Chọn **File** -> **Open Folder...** và chọn thư mục `backend` của dự án.

### Bước 2: Chọn Java Runtime
1. VS Code sẽ yêu cầu chỉ định Java SDK nếu chưa có. Chọn JDK 21 hoặc 22 đã cài sẵn.

### Bước 3: Biên dịch và chạy
Bạn có thể chạy theo nhiều cách:

- Chạy bằng terminal tích hợp (dễ nhất):
  * Mở terminal trong VS Code (Terminal -> New Terminal).
  * Di chuyển đến thư mục `backend` (nếu chưa ở đó) và chạy:
    - Trên Windows CMD:
      ```cmd
      mvnw spring-boot:run
      ```
    - Hoặc trên PowerShell:
      ```powershell
      .\mvnw spring-boot:run
      ```

- Chạy bằng cấu hình debug/Run của VS Code:
  * Mở file `RentalApplication.java`.
  * Click vào biểu tượng Run/Debug xuất hiện ở cạnh trái của editor hoặc trên gutter để chạy ứng dụng dưới chế độ Debug (nếu Spring Boot extensions đã cài, phần lớn cấu hình launch sẽ được tự động tạo).

> [!TIP]
> Nếu gặp lỗi liên quan đến Lombok trong VS Code, đảm bảo extension Lombok đã được cài và `java.compile.nullAnalysis.mode` trong `settings.json` không gây xung đột với annotation processing.

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

Chúng tôi đã chuẩn bị sẵn hai tệp Postman Collection trong thư mục `backend/`:
* `postman_full_collection.json` — collection đầy đủ các endpoint.
* `postman_e2e_flow.json` — flow kiểm thử end-to-end (các bước tự động hóa kịch bản chính).

### Bước 1: Nhập Collection vào Postman
1. Mở ứng dụng Postman.
2. Chọn nút **Import** ở góc trên cùng bên trái.
3. Chọn tệp `backend/postman_full_collection.json` (nằm trong thư mục gốc dự án ở `backend`).
   * Nếu muốn chạy luồng end-to-end, import thêm `backend/postman_e2e_flow.json`.
4. Sau khi import, một collection tên **"Rental Services API"** (hoặc tên tương ứng trong file) sẽ xuất hiện trong danh mục kiểm thử của bạn.

### Bước 2: Cấu hình biến môi trường trên Postman
Collection này sử dụng hai biến tự động là `{{baseUrl}}` (mặc định là `http://localhost:8080`) và `{{token}}` (được lưu tự động sau khi đăng nhập thành công).
1. Kiểm tra tab **Variables** của collection để đảm bảo `baseUrl` trỏ tới đúng cổng của backend đang chạy (`http://localhost:8080`).

### Bước 3: Chạy Collection / Flow
1. Mở collection `Rental Services API`.
2. Bạn có thể chạy từng request riêng lẻ hoặc dùng Collection Runner để chạy toàn bộ:
   * Chọn **Runner** (Collection Runner) -> chọn collection `Rental Services API` -> thiết lập `Environment` nếu cần -> nhấn **Start Run**.
3. Nếu bạn đã import `postman_e2e_flow.json`, dùng Runner để thực thi luồng end-to-end (các bước đăng ký, đăng nhập, tạo hợp đồng, thanh toán...).

### Bước 4: Luồng kiểm thử cơ bản
1. **Đăng ký tài khoản (Register):**
   *   Chọn request `Register Owner` (đăng ký làm chủ nhà) hoặc `Register Renter` (đăng ký làm người thuê).
   *   Nhấn **Send** để đăng ký.
2. **Đăng nhập (Login):**
   *   Mở request `Login` và điền tài khoản vừa đăng ký.
   *   Nhấn **Send**. Đoạn script kiểm thử đi kèm sẽ tự động lưu mã JWT token vào biến môi trường `{{token}}`.
3. **Quản lý hợp đồng & Thanh toán (Contracts & Payments):**
   *   Sau khi đăng nhập thành công, bạn có thể thực hiện kiểm thử các API trong thư mục `Contracts` và `Payments`. Mã `token` sẽ tự động được đính kèm vào phần Header `Authorization: Bearer {{token}}` của tất cả các yêu cầu tiếp theo.

---

## Ghi chú & Khắc phục sự cố thường gặp
* Nếu Maven không tải được dependency, kiểm tra kết nối Internet và chạy lại `mvnw clean`.
* Nếu gặp lỗi kết nối DB, kiểm tra lại giá trị trong `backend/.env` và đảm bảo DB có thể truy cập từ máy bạn (kiểm tra firewall, network).
* Nếu gặp lỗi Lombok (thiếu getter/setter), chắc chắn đã bật Annotation Processing (IntelliJ) hoặc cài extension Lombok cho VS Code.

---

Chúc bạn chạy và kiểm thử dự án thuận lợi. Nếu cần, tôi có thể tạo sẵn một file `launch.json`/`tasks.json` cho VS Code để chạy nhanh hơn.
