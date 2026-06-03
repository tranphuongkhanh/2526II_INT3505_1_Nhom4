# Hệ Thống Cho Thuê Phòng Trọ

Đây là một nền tảng website hỗ trợ người dùng tìm kiếm, cho thuê phòng trọ và quản lý hợp đồng, hóa đơn một cách tiện lợi và minh bạch.

## Công nghệ sử dụng (Tech Stack)
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Java Spring Boot, Spring Security, Hibernate
- **Database:** PostgreSQL (Neon Tech), Redis (Caching)
- **Deployment:** AWS EC2, K3s (Kubernetes), Docker, GitHub Actions CI/CD
- **Tích hợp:** VNPay (Thanh toán), Cloudinary (Upload ảnh), Google OAuth (Đăng nhập), WebSockets (Chat)

---

## Hướng dẫn cài đặt và chạy dự án (Local Development)

### Yêu cầu môi trường (Prerequisites)
- **Node.js** (Phiên bản >= 18)
- **Java JDK** (Phiên bản >= 21)
- **Maven** (Phiên bản >= 3.8)
- **Git**

### Bước 1: Clone dự án về máy
```bash
git clone https://github.com/tranphuongkhanh/2526II_INT3505_1_Nhom4.git
cd 2526II_INT3505_1_Nhom4
```

### Bước 2: Cài đặt và chạy Backend (Spring Boot)
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cấu hình biến môi trường:
   - Copy file mẫu `.env.example` thành file `.env`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` vừa tạo và điền các thông số kết nối Database (PostgreSQL), JWT Secret, cấu hình VNPay, Cloudinary và Google OAuth của bạn vào.
3. Chạy project:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Backend sẽ khởi chạy ở địa chỉ: `http://localhost:8080`*

### Bước 3: Cài đặt và chạy Frontend (React + Vite)
1. Mở một Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện phụ thuộc (Dependencies):
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   - Copy file mẫu `.env.example` thành file `.env`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` vừa tạo và điền `VITE_GOOGLE_CLIENT_ID` của bạn vào.
4. Chạy giao diện người dùng:
   ```bash
   npm run dev
   ```
   *Frontend sẽ khởi chạy ở địa chỉ: `http://localhost:5173`*

---

## Hướng dẫn Deploy (Dành cho Server K3s / AWS)

Dự án đã được tích hợp CI/CD tự động bằng **GitHub Actions**. Bất cứ khi nào bạn đẩy code lên nhánh `main` hệ thống sẽ tự động:
1. Đóng gói Frontend và Backend thành các image Docker.
2. Đẩy image lên GitHub Container Registry (GHCR).
3. Đăng nhập vào Server AWS thông qua SSH.
4. Triển khai cấu hình Kubernetes (file `.yaml` trong thư mục `k8s/`).

**Lưu ý:** Cần cấu hình đầy đủ các **GitHub Secrets** (như `ENV_FILE`, `SERVER_HOST`, `SERVER_SSH_KEY`,...) trong phần Settings của Repository trước khi chạy luồng Deploy.

---

## 🔑 Phụ lục: Cách lấy các thông số cho file .env

### 1. PostgreSQL (Neon Tech)
- Truy cập [Neon.tech](https://neon.tech/) và tạo một Project mới.
- Vào mục **Dashboard**, copy các thông số kết nối Database (Host, Database Name, User, Password) và điền vào các biến `DB_...` tương ứng trong file `.env`.

### 2. VNPay (Cổng thanh toán)
- Đăng ký tài khoản Sandbox tại [VNPAY Sandbox](https://sandbox.vnpayment.vn/devreg/).
- Đăng nhập vào hệ thống quản lý của VNPAY Sandbox để lấy **TmnCode** và **HashSecret**.

### 3. Cloudinary (Lưu trữ hình ảnh)
- Tạo tài khoản miễn phí tại [Cloudinary](https://cloudinary.com/).
- Vào bảng điều khiển (Dashboard) của bạn, copy 3 thông số: `Cloud Name`, `API Key`, và `API Secret`.

### 4. Google OAuth (Đăng nhập bằng Google)
- Vào [Google Cloud Console](https://console.cloud.google.com/).
- Tạo một Project mới, vào mục **APIs & Services** > **Credentials**.
- Tạo thông tin xác thực loại **OAuth client ID** (chọn loại Web application).
- Thêm `http://localhost:5173` và địa chỉ domain của bạn vào phần **Authorized JavaScript origins**.
- Copy **Client ID** được cấp và dán vào biến `GOOGLE_CLIENT_ID` (Backend) và `VITE_GOOGLE_CLIENT_ID` (Frontend).

---

## Thành viên nhóm
- **Trần Phương Khánh**
- **Hoàng Ngọc Nhi**
- **Nguyễn Dương Việt Nga**
- **Võ Văn Hải**
- **Nguyễn Thị Huyền**
