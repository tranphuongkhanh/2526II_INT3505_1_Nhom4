# API_CONTRACTS — Endpoint Contracts & Samples

Tài liệu này tập hợp **66 endpoints** của hệ thống Tìm kiếm & Quản lý Nhà trọ cho Sinh viên.

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <access_token>` (JWT)
**Response envelope:** `{ "success": bool, "message": "...", "data": {...} }`
**DTO Class:** `com.example.Rental.dto.response.ApiResponse<T>`

---

## 1. Auth (6 endpoints)

### POST /auth/register

- **Actor:** Guest
- **DB:** users
- **Mục đích:** Đăng ký tài khoản mới (renter hoặc owner).
- **Body:**

```json
{ "email": "user@example.com", "password": "P@ssw0rd", "role": "renter" }
```

- **Note:** role=`renter` → status=`active` ngay; role=`owner` → status=`pending` (chờ duyệt)
- **Response 201:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "id": 123, "email": "user@example.com", "status": "active" }
}
```

### POST /auth/login

- **Actor:** Guest
- **DB:** users
- **Mục đích:** Đăng nhập, nhận JWT access token.
- **Body:**

```json
{ "email": "user@example.com", "password": "P@ssw0rd" }
```

- **Response 200:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": { "access_token": "eyJhbGc...", "expires_in": 3600 }
}
```

### POST /auth/logout

- **Actor:** Any (auth required)
- **DB:** —
- **Mục đích:** Đăng xuất, huỷ token hiện tại.
- **Response 200:** `{ "success": true, "message": "Password reset email sent", "data": null, "message": "Logged out successfully", "data": null }`

### POST /auth/forgot-password

- **Actor:** Guest
- **DB:** users
- **Mục đích:** Gửi email reset mật khẩu.
- **Body:**

```json
{ "email": "user@example.com" }
```

- **Response 200:** `{ "success": true }`

### POST /auth/reset-password

- **Actor:** Guest
- **DB:** users
- **Mục đích:** Đặt lại mật khẩu bằng token từ email.
- **Body:**

```json
{ "token": "reset_token_...", "new_password": "NewP@ssw0rd" }
```

- **Response 200:** `{ "success": true, "message": "Password reset successfully", "data": null }`

### PUT /auth/change-password

- **Actor:** Any (auth required)
- **DB:** users
- **Mục đích:** Đổi mật khẩu khi đang đăng nhập (cần nhập mật khẩu cũ).
- **Body:**

```json
{ "old_password": "OldP@ssw0rd", "new_password": "NewP@ssw0rd" }
```

- **Response 200:** `{ "success": true, "message": "Password changed successfully", "data": null }`

---

## 2. Users / Profile (9 endpoints)

### GET /users/me

- **Actor:** Any (auth required)
- **DB:** users
- **Mục đích:** Xem thông tin hồ sơ bản thân.
- **Response 200:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "phone": "0123456789",
    "avatar_url": "https://...",
    "role": "renter",
    "status": "active"
  }
}
```

### PUT /users/me

- **Actor:** Any (auth required)
- **DB:** users
- **Mục đích:** Cập nhật hồ sơ cá nhân.
- **Body:**

```json
{
  "full_name": "New Name",
  "phone": "0987654321",
  "permanent_address": "123 Main St"
}
```

- **Response 200:** updated user data

### POST /users/me/avatar

- **Actor:** Any (auth required)
- **DB:** users
- **Mục đích:** Upload ảnh đại diện.
- **Content-Type:** multipart/form-data (field: `file`)
- **Response 200:**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": { "avatar_url": "https://cloudinary.com/..." }
}
```

### GET /users

- **Actor:** Admin
- **DB:** users
- **Mục đích:** Danh sách tất cả users, filter theo role và status.
- **Query params:** `role=renter|owner|admin`, `status=pending|active|banned`, `page=1`, `limit=20`
- **Response 200:**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 100, "page": 1, "limit": 20 }
  }
}
```

### PATCH /users/:userId/status

- **Actor:** Admin
- **DB:** users
- **Mục đích:** Duyệt / ban / unban tài khoản.
- **Body:**

```json
{ "status": "active" }
```

- **Note:** status ∈ {pending, active, banned}
- **Response 200:** updated user

---

## 3. Rooms (9 endpoints)

### GET /rooms

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Danh sách phòng trọ của owner đang đăng nhập.
- **Response 200:** list of rooms

### POST /rooms

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Tạo phòng trọ mới.
- **Body:**

````json
{
  "title": "Phòng trọ gần trường",
  "description": "Phòng rộng, sáng sủa...",
  "price": 2000000,
  "area_m2": 25.5,
  "room_type": "phong_tro",
  "address": "123 Nguyễn Huệ",
  "ward": "Phường 1",
  "district": "Quận 1",
  "city": "TP. HCM",
  "has_wifi": true,
  "has_ac": true,
  "has_fridge": false,
  "has_parking": true,
  "has_private_wc": true,
  "has_security": true
}
- **Response 201:**
```json
{ "success": true, "message": "Room created successfully", "data": { "id": 10, "title": "Phòng trọ gần trường", "price": 2000000, "status": "active" } }
````

### GET /rooms/:roomId

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Xem chi tiết một phòng trọ.
- **Response 200:**

```json
{
  "success": true,
  "message": "Room retrieved successfully",
  "data": {
    "id": 10,
    "title": "...",
    "price": 2000000,
    "rental_status": "available"
  }
}
```

### PUT /rooms/:roomId

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Cập nhật thông tin phòng, kể cả giá.
- **Body:** (same as POST /rooms)
- **Response 200:** updated room

### DELETE /rooms/:roomId

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Xoá phòng trọ (soft delete — set `deleted_at`).
- **Response 204:** no content

### PATCH /rooms/:roomId/rental-status

- **Actor:** Owner
- **DB:** rooms
- **Mục đích:** Đổi trạng thái phòng: `available` / `rented`.
- **Body:**

```json
{ "rental_status": "rented" }
```

- **Response 200:** updated room

### POST /rooms/:roomId/images

- **Actor:** Owner
- **DB:** room_images
- **Mục đích:** Upload ảnh phòng trọ.
- **Content-Type:** multipart/form-data (field: `file`)
- **Response 201:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": { "id": 5001, "image_url": "https://...", "is_thumbnail": false }
}
```

### DELETE /rooms/:roomId/images/:imageId

- **Actor:** Owner
- **DB:** room_images
- **Mục đích:** Xoá ảnh phòng trọ.
- **Response 204:** no content

### PATCH /rooms/:roomId/images/:imageId/thumbnail

- **Actor:** Owner
- **DB:** room_images
- **Mục đích:** Đặt ảnh làm ảnh đại diện của phòng.
- **Body:** (empty or `{ "is_thumbnail": true }`)
- **Response 200:**

```json
{
  "success": true,
  "message": "Image set as thumbnail successfully",
  "data": { "id": 5001, "is_thumbnail": true }
}
```

---

## 4. Posts (8 endpoints)

### GET /posts

- **Actor:** Guest+
- **DB:** posts, rooms
- **Mục đích:** Tìm kiếm bài đăng cho thuê theo nhiều tiêu chí.
- **Query params:** `q, city, district, room_type, min_price, max_price, has_wifi, has_ac, sort, page, limit`
- **Note:** Chỉ trả bài có `status=approved` và `end_date > NOW()`
- **Response 200:**

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "items": [
      {
        "post_id": 88,
        "room": { "id": 10, "title": "...", "price": 2000000, "images": [...] },
        "avg_rating": 4.5,
        "view_count": 150,
        "favorite_count": 25
      }
    ],
    "meta": { "total": 250, "page": 1, "limit": 20 }
  }
}
```

### GET /posts/:postId

- **Actor:** Guest+
- **DB:** posts, rooms, room_images
- **Mục đích:** Xem chi tiết bài đăng, tự động tăng `view_count`.
- **Side effect:** increment `posts.view_count`, insert record vào `post_views`
- **Response 200:**

```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "post_id": 88,
    "room": { "id": 10, "title": "...", "price": 2000000 },
    "images": [...],
    "view_count": 151
  }
}
```

### GET /me/posts

- **Actor:** Owner
- **DB:** posts
- **Mục đích:** Danh sách tất cả bài đăng của owner (mọi trạng thái).
- **Query params:** `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 5, "page": 1, "limit": 20 }
  }
}
```

### POST /me/posts

- **Actor:** Owner
- **DB:** posts, payments
- **Mục đích:** Tạo bài đăng mới cho một phòng.
- **Body:**

```json
{
  "room_id": 10,
  "duration_type": "month",
  "duration_value": 3
}
```

- **Note:** Không lưu giá (lấy từ rooms.price); tính phí đăng, tạo payment record
- **Response 201:**

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": { "id": 88, "room_id": 10, "status": "pending" }
}
```

### DELETE /me/posts/:postId

- **Actor:** Owner
- **DB:** posts
- **Mục đích:** Ẩn / xoá bài đăng.
- **Response 204:**

```json
{ "success": true, "message": "Post deleted successfully", "data": null }
```

### POST /me/posts/:postId/extend

- **Actor:** Owner
- **DB:** posts, post_extensions, payments
- **Mục đích:** Gia hạn bài đăng thêm thời gian.
- **Body:**

```json
{ "duration_type": "month", "duration_value": 2 }
```

- **Side effect:** update `posts.end_date`, insert `post_extensions`, insert `payments`
- **Response 201:**

```json
{
  "success": true,
  "message": "Post extended successfully",
  "data": { "id": 2001, "post_id": 88, "duration_value": 2 }
}
```

### GET /admin/posts

- **Actor:** Admin
- **DB:** posts
- **Mục đích:** Danh sách tất cả bài đăng, filter theo status.
- **Query params:** `status=pending|approved|rejected`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 100, "page": 1, "limit": 20 }
  }
}
```

### PATCH /admin/posts/:postId/status

- **Actor:** Admin
- **DB:** posts
- **Mục đích:** Duyệt hoặc từ chối bài đăng.
- **Body:**

```json
{ "status": "approved", "reject_reason": null }
```

- **Side effect:** set `posts.status`, `posts.approved_by`, `posts.approved_at`; publish notification
- **Response 200:**

```json
{
  "success": true,
  "message": "Post status updated successfully",
  "data": {
    "id": 88,
    "status": "approved",
    "approved_at": "2026-05-13T10:30:00Z"
  }
}
```

---

## 5. Favorites (3 endpoints)

### POST /posts/:postId/favorites

- **Actor:** Renter
- **DB:** favorites
- **Mục đích:** Lưu bài đăng vào danh sách yêu thích.
- **Response 201:** `{ "success": true, "message": "Post added to favorites", "data": null }`

### DELETE /posts/:postId/favorites

- **Actor:** Renter
- **DB:** favorites
- **Mục đích:** Bỏ lưu bài đăng khỏi danh sách yêu thích.
- **Response 204:** `{ "success": true, "message": "Post removed from favorites", "data": null }`

### GET /users/me/favorites

- **Actor:** Renter
- **DB:** favorites, posts
- **Mục đích:** Xem danh sách bài đăng đã lưu yêu thích.
- **Query params:** `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Favorite posts retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 12, "page": 1, "limit": 20 }
  }
}
```

---

## 6. Reviews (6 endpoints)

### GET /rooms/:roomId/reviews

- **Actor:** Guest+
- **DB:** reviews
- **Mục đích:** Danh sách review đã duyệt của một phòng.
- **Query params:** `page, limit`
- **Note:** Chỉ trả review có `status=approved`
- **Response 200:**

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 8, "page": 1, "limit": 20 }
  }
}
```

### POST /rooms/:roomId/reviews

- **Actor:** Renter
- **DB:** reviews
- **Mục đích:** Renter viết review phòng (cần `contract_id` hợp lệ).
- **Body:**

```json
{
  "contract_id": 501,
  "rating": 5,
  "comment": "Phòng sạch sẽ, chủ nhân thân thiện"
}
```

- **Note:** rating ∈ [1, 5]; review.status = pending cho đến khi admin duyệt
- **Response 201:**

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": { "id": 7001, "rating": 5, "status": "pending" }
}
```

### POST /contracts/:contractId/renter-review

- **Actor:** Owner
- **DB:** reviews
- **Mục đích:** Owner đánh giá người thuê sau khi hợp đồng kết thúc.
- **Body:**

```json
{ "rating": 4, "comment": "Người thuê trả tiền đúng hạn" }
```

- **Note:** review_type = owner_to_renter, target_user_id = renter
- **Response 201:**

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": { "id": 7002, "rating": 4, "status": "pending" }
}
```

### GET /users/:userId/renter-reviews

- **Actor:** Guest+
- **DB:** reviews
- **Mục đích:** Xem lịch sử bị đánh giá của một renter.
- **Query params:** `page, limit`
- **Note:** Chỉ trả review đã duyệt
- **Response 200:**

```json
{
  "success": true,
  "message": "Renter reviews retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 3, "page": 1, "limit": 20 }
  }
}
```

### GET /admin/reviews

- **Actor:** Admin
- **DB:** reviews
- **Mục đích:** Danh sách review chờ admin duyệt.
- **Query params:** `status=pending|approved|rejected`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 15, "page": 1, "limit": 20 }
  }
}
```

### PATCH /admin/reviews/:reviewId/status

- **Actor:** Admin
- **DB:** reviews
- **Mục đích:** Duyệt hoặc từ chối review.
- **Body:**

```json
{ "status": "approved" }
```

- **Side effect:** set `reviews.status`, `reviews.moderated_by`, `reviews.moderated_at`; publish notification
- **Response 200:**

```json
{
  "success": true,
  "message": "Review status updated successfully",
  "data": { "id": 7001, "status": "approved" }
}
```

---

## 7. Reports (5 endpoints)

### POST /posts/:postId/reports

- **Actor:** Renter
- **DB:** reports
- **Mục đích:** Báo cáo bài đăng vi phạm.
- **Body:**

```json
{
  "reason": "FAKE_INFO",
  "description": "Ảnh không phải là ảnh thực tế..."
}
```

- **Response 201:**

```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": { "id": 6001, "status": "pending" }
}
```

### GET /users/me/reports

- **Actor:** Renter
- **DB:** reports
- **Mục đích:** Xem danh sách report đã gửi và trạng thái xử lý.
- **Query params:** `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 2, "page": 1, "limit": 20 }
  }
}
```

### GET /admin/reports

- **Actor:** Admin
- **DB:** reports
- **Mục đích:** Danh sách tất cả reports, filter theo status.
- **Query params:** `status=pending|resolved|rejected`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 12, "page": 1, "limit": 20 }
  }
}
```

### GET /admin/reports/:reportId

- **Actor:** Admin
- **DB:** reports
- **Mục đích:** Xem chi tiết một report (kèm post info và reporter info).
- **Response 200:**

```json
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "id": 6001,
    "post_id": 88,
    "reason": "FAKE_INFO",
    "description": "Ảnh không phải là ảnh thực tế...",
    "status": "pending"
  }
}
```

### PATCH /admin/reports/:reportId/status

- **Actor:** Admin
- **DB:** reports
- **Mục đích:** Xử lý report: `resolved` hoặc `rejected`.
- **Body:**

```json
{
  "status": "resolved",
  "resolution": "Đã yêu cầu owner xoá post"
}
```

- **Side effect:** set `reports.status`, `reports.handled_by`, `reports.handled_at`; publish notification
- **Response 200:**

```json
{
  "success": true,
  "message": "Report status updated successfully",
  "data": { "id": 6001, "status": "resolved" }
}
```

---

## 8. Chat / Conversations (6 endpoints)

### GET /conversations

- **Actor:** Any (auth required)
- **DB:** conversations
- **Mục đích:** Danh sách hội thoại, sort theo tin nhắn mới nhất.
- **Query params:** `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "user1_id": 12,
        "user2_id": 23,
        "last_message_at": "2026-05-13T10:30:00Z",
        "last_message_preview": "Bạn vẫn có quan tâm...",
        "other_user": { "id": 23, "full_name": "Alice", "avatar_url": "..." }
      }
    ],
    "meta": { "total": 5, "page": 1, "limit": 20 }
  }
}
```

### POST /conversations

- **Actor:** Any (auth required)
- **DB:** conversations
- **Mục đích:** Tạo mới hoặc lấy lại conversation đã tồn tại.
- **Body:**

```json
{ "receiver_id": 23 }
```

- **Note:** Convention: user1_id < user2_id; nếu đã tồn tại thì trả conversation cũ
- **Response 201 or 200:**

```json
{
  "success": true,
  "message": "Conversation created/retrieved successfully",
  "data": { "id": 1, "user1_id": 12, "user2_id": 23 }
}
```

### GET /conversations/:id

- **Actor:** Any (auth required)
- **DB:** conversations
- **Mục đích:** Chi tiết conversation (tên, avatar người kia).
- **Response 200:**

```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "id": 1,
    "user1_id": 12,
    "user2_id": 23,
    "other_user": { "id": 23, "full_name": "Alice", "avatar_url": "..." }
  }
}
```

### GET /conversations/:id/messages

- **Actor:** Any (auth required)
- **DB:** messages
- **Mục đích:** Lịch sử tin nhắn, cursor-based pagination.
- **Query params:** `before=messageId`, `limit=50`
- **Response 200:**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 45, "limit": 50 }
  }
}
```

### POST /conversations/:id/messages

- **Actor:** Any (auth required)
- **DB:** messages
- **Mục đích:** Gửi tin nhắn mới vào hội thoại.
- **Body:**

```json
{ "content": "Phòng còn trống không?" }
```

- **Side effect:** insert message, update conversation.last_message_at, publish to WebSocket
- **Response 201:**

```json
{ \"success\": true, \"message\": \"Message sent successfully\", \"data\": { \"id\": 4001, \"content\": \"Phòng còn trống không?\", \"created_at\": \"2026-05-13T10:35:00Z\" } }
```

### PUT /conversations/:id/read

- **Actor:** Any (auth required)
- **DB:** messages
- **Mục đích:** Đánh dấu đã đọc tất cả tin trong hội thoại.
- **Body:** (empty)
- **Side effect:** set `messages.is_read = true` for all messages in conversation (for current user)
- **Response 200:** `{ "success": true, "message": "All messages marked as read", "data": null }`

---

## 9. Notifications (3 endpoints)

### GET /notifications

- **Actor:** Any (auth required)
- **DB:** notifications
- **Mục đích:** Danh sách thông báo, filter theo `is_read`.
- **Query params:** `is_read=false` (để lọc chưa đọc), `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 8, "page": 1, "limit": 20 }
  }
}
```

### PATCH /notifications/:id/read

- **Actor:** Any (auth required)
- **DB:** notifications
- **Mục đích:** Đánh dấu một thông báo đã đọc.
- **Body:** (empty or `{ "is_read": true }`)
- **Response 200:**

```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { "id": 8001, "is_read": true }
}
```

### PUT /notifications/read-all

- **Actor:** Any (auth required)
- **DB:** notifications
- **Mục đích:** Đánh dấu tất cả thông báo đã đọc.
- **Body:** (empty)
- **Side effect:** set `notifications.is_read = true` for all notifications of current user
- **Response 200:** `{ "success": true, "message": "All notifications marked as read", "data": null }`

---

## 10. Payments (1 endpoint)

### GET /me/payments

- **Actor:** Owner
- **DB:** payments
- **Mục đích:** Lịch sử phí đăng bài và gia hạn của owner.
- **Query params:** `status=pending|paid`, `page, limit`
- **Validation:** `page >= 1`; `limit >= 1` và backend giới hạn tối đa `100`.
- **Validation:** `status` chỉ chấp nhận `pending` hoặc `paid` (không phân biệt hoa/thường).
- **Invalid status response (400):** `{ "success": false, "message": "Invalid status. Supported values: pending, paid", "data": null }`
- **Response 200:**

```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1001,
        "owner_id": 12,
        "post_id": 88,
        "extension_id": null,
        "amount": 150000,
        "status": "paid",
        "note": "Chuyển khoản ngân hàng",
        "paid_at": "2026-05-01T10:00:00Z",
        "created_at": "2026-05-01T09:30:00Z",
        "post": { "id": 88, "room_id": 10 }
      }
    ],
    "meta": { "total": 10, "page": 1, "limit": 20 }
  }
}
```

---

## 11. Contracts (5 endpoints)

### POST /rooms/:roomId/contracts

- **Actor:** Owner
- **DB:** rental_contracts, rooms
- **Mục đích:** Tạo hợp đồng khi có người thuê, tự động set `rooms.rental_status = rented`.
- **Body:**

```json
{
  "renter_id": 23,
  "start_date": "2026-05-01",
  "end_date": "2027-05-01",
  "monthly_rent": 2500000,
  "electricity_price": 3000,
  "water_price": 8000
}
```

- **Side effect:** insert contract, update rooms.rental_status
- **Response 201:**

```json
{
  "success": true,
  "message": "Contract created successfully",
  "data": { "id": 501, "room_id": 10, "renter_id": 23, "status": "active" }
}
```

### GET /rooms/:roomId/contracts

- **Actor:** Owner
- **DB:** rental_contracts
- **Mục đích:** Lịch sử tất cả hợp đồng của một phòng.
- **Query params:** `status=active|ended`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Contracts retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 3, "page": 1, "limit": 20 }
  }
}
```

### GET /me/contracts

- **Actor:** Renter
- **DB:** rental_contracts, rooms
- **Mục đích:** Danh sách hợp đồng thuê của renter.
- **Query params:** `status=active|ended`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Contracts retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 2, "page": 1, "limit": 20 }
  }
}
```

### PATCH /contracts/:contractId/end

- **Actor:** Owner
- **DB:** rental_contracts, rooms
- **Mục đích:** Kết thúc hợp đồng, tự động set `rooms.rental_status = available`.
- **Body:**

```json
{ "end_date": "2026-12-31" }
```

- **Side effect:** update contract.status = ended, update contract.end_date, update rooms.rental_status = available
- **Response 200:**

```json
{
  "success": true,
  "message": "Contract ended successfully",
  "data": { "id": 501, "status": "ended", "end_date": "2026-12-31T00:00:00Z" }
}
```

---

## 12. Utility Bills (5 endpoints)

### GET /contracts/:contractId/bills

- **Actor:** Owner or Renter
- **DB:** utility_bills
- **Mục đích:** Danh sách hoá đơn điện nước theo hợp đồng.
- **Query params:** `status=unpaid|paid`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Bills retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 12, "page": 1, "limit": 20 }
  }
}
```

### POST /contracts/:contractId/bills

- **Actor:** Owner
- **DB:** utility_bills
- **Mục đích:** Tạo hoá đơn tháng mới, backend tự tính tiền điện nước.
- **Body:**

```json
{
  "billing_month": "2026-05-01",
  "elec_curr": 1200,
  "water_curr": 30,
  "extra_fee": 0,
  "extra_note": ""
}
```

- **Calculation:**
  - `elec_usage = elec_curr - elec_prev`
  - `elec_amount = elec_usage * elec_unit_price`
  - `water_amount = water_usage * water_unit_price`
  - `total_amount = elec_amount + water_amount + rent_amount + extra_fee`
- **Response 201:**

```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": 9001,
    "contract_id": 501,
    "total_amount": 2880000,
    "status": "unpaid"
  }
}
```

### GET /bills/:billId

- **Actor:** Owner or Renter
- **DB:** utility_bills
- **Mục đích:** Xem chi tiết một hoá đơn điện nước.
- **Response 200:**

```json
{
  "success": true,
  "message": "Bill retrieved successfully",
  "data": {
    "id": 9001,
    "contract_id": 501,
    "total_amount": 2880000,
    "status": "unpaid"
  }
}
```

### PATCH /bills/:billId/paid

- **Actor:** Owner
- **DB:** utility_bills
- **Mục đích:** Xác nhận renter đã thanh toán hoá đơn.
- **Body:** (empty or `{ "note": "..." }`)
- **Side effect:** set bill.status = paid, set bill.paid_at = now()
- **Response 200:**

```json
{
  "success": true,
  "message": "Bill marked as paid",
  "data": { "id": 9001, "status": "paid", "paid_at": "2026-05-20T14:00:00Z" }
}
```

---

## 13. Vehicles (3 endpoints)

### GET /rooms/:roomId/vehicles

- **Actor:** Owner
- **DB:** vehicles
- **Mục đích:** Danh sách xe đã đăng ký tại phòng.
- **Query params:** `vehicle_type`, `renter_id`, `page, limit`
- **Response 200:**

```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": {
    "items": [...],
    "meta": { "total": 5, "page": 1, "limit": 20 }
  }
}
```

### POST /rooms/:roomId/vehicles

- **Actor:** Owner
- **DB:** vehicles
- **Mục đích:** Đăng ký xe mới cho phòng.
- **Body:**

```json
{
  "license_plate": "59A1-12345",
  "vehicle_type": "xe_may",
  "renter_id": 23,
  "image_url": "https://..."
}
```

- **Note:** license_plate là bắt buộc; renter_id và image_url là tuỳ chọn
- **Response 201:**

```json
{
  "success": true,
  "message": "Vehicle registered successfully",
  "data": {
    "id": 3001,
    "license_plate": "59A1-12345",
    "vehicle_type": "xe_may"
  }
}
```

### DELETE /vehicles/:vehicleId

- **Actor:** Owner
- **DB:** vehicles
- **Mục đích:** Xoá xe khỏi danh sách đăng ký.
- **Response 204:**

```json
{ "success": true, "message": "Vehicle deleted successfully", "data": null }
```

---

## 14. OCR (2 endpoints)

### POST /ocr/meter

- **Actor:** Owner
- **DB:** — (no persistence)
- **Mục đích:** OCR đọc chỉ số đồng hồ điện hoặc nước từ ảnh chụp.
- **Content-Type:** multipart/form-data (field: `file`)
- **Response 200:**

```json
{
  "success": true,
  "message": "Meter reading recognized successfully",
  "data": {
    "meter_number": "1250",
    "confidence": 0.95,
    "need_verify": false
  }
}
```

- **Note:** Kết quả chỉ dùng để prefill form hoá đơn; owner phải xác nhận

### POST /ocr/license-plate

- **Actor:** Owner
- **DB:** — (no persistence)
- **Mục đích:** OCR nhận dạng biển số xe từ ảnh chụp.
- **Content-Type:** multipart/form-data (field: `file`)
- **Response 200:**

```json
{
  "success": true,
  "message": "License plate recognized successfully",
  "data": {
    "license_plate": "59A1-12345",
    "is_valid": true,
    "need_verify": false
  }
}
```

- **Note:** Kết quả chỉ dùng để prefill form đăng ký xe; owner phải xác nhận

---

## 15. Statistics (2 endpoints)

### GET /admin/statistics

- **Actor:** Admin
- **DB:** users, rooms, posts, reviews, reports
- **Mục đích:** Tổng quan hệ thống: số user, phòng, bài đăng, review, report.
- **Response 200:**

```json
{
  "success": true,
  "message": "System statistics retrieved successfully",
  "data": {
    "total_users": 1500,
    "users_by_role": { "renter": 1200, "owner": 280, "admin": 20 },
    "total_rooms": 450,
    "total_posts": 320,
    "reviews_pending": 15,
    "reports_pending": 8
  }
}
```

### GET /me/posts/:postId/statistics

- **Actor:** Owner
- **DB:** post_views, favorites
- **Mục đích:** Thống kê bài đăng: lượt xem, yêu thích, cao điểm truy cập.
- **Response 200:**

```json
{
  "success": true,
  "message": "Post statistics retrieved successfully",
  "data": {
    "post_id": 88,
    "total_views": 250,
    "total_favorites": 35,
    "views_by_date": [
      { "date": "2026-05-13", "views": 45 },
      { "date": "2026-05-12", "views": 38 }
    ],
    "peak_hours": [10, 14, 19]
  }
}
```

---

## Error Responses

### 422 Unprocessable Entity (Validation Error)

```json
{
  "success": false,
  "message": "Input validation failed",
  "data": {
    "errors": [
      { "field": "email", "message": "Email already exists" },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "data": null
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found",
  "data": null
}
```

---

## General Notes

- **Pagination:** Tất cả endpoint list dùng `page` và `limit` query params (default: `page=1`, `limit=20`)
- **Sorting:** Một số endpoint hỗ trợ `sort` param (VD: `sort=-created_at`)
- **Date Format:** ISO-8601 UTC (VD: `2026-05-13T10:30:00Z`)
- **Currency:** VND (Vietnamese Dong), không dùng decimal cho tiền
- **Authentication:** JWT Bearer token, store ở localStorage hoặc session
- **Rate Limiting:** Áp dụng cho auth endpoints (max 5 requests/min), reports (max 3/hour)
- **WebSocket:** Hỗ trợ real-time chat events (connection: `ws://api.example.com/ws`)

---

**Tài liệu này đề cập chi tiết 66 endpoints được chia thành 15 nhóm chính.**

Xem thêm: [DATABASE.md](DATABASE.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [CRITICAL_PATHS.md](CRITICAL_PATHS.md) | [SECURITY.md](SECURITY.md)
