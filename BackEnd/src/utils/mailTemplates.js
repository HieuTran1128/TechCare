function inviteTemplate(fullName, link) {
  return `
    <h2>Xin chào ${fullName},</h2>
    <p>Bạn được mời tham gia hệ thống TechCare.</p>
    <p>Nhấn vào nút bên dưới để kích hoạt tài khoản:</p>
    <a href="${link}" 
       style="padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">
       Kích hoạt tài khoản
    </a>
    <p>Link có hiệu lực trong 24 giờ.</p>
  `;
}

const approvalTemplate = ({
  customerName,
  ticketCode,
  diagnosisResult,
  estimatedCost,
  workDescription,
  estimatedCompletionDate,
  approveUrl,
  rejectUrl,
  partsCost,
  partsCount,
  laborCost,
}) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo giá sửa chữa - TechCare</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f7fb; margin:0; padding:20px; color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#2563eb,#4f46e5);color:white;padding:20px;">
      <h1 style="margin:0;font-size:22px;">TechCare - Báo giá sửa chữa</h1>
      <p style="margin:8px 0 0;opacity:.9;">Mã phiếu: <strong>${ticketCode}</strong></p>
    </div>

    <div style="padding:20px;line-height:1.6;">
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Chúng tôi đã hoàn tất kiểm tra thiết bị và gửi báo giá sửa chữa cho phiếu <strong>${ticketCode}</strong>.</p>

      <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px;border-radius:8px;margin:12px 0;">
        <strong>Mô tả lỗi kỹ thuật:</strong><br/>
        ${diagnosisResult || 'Chưa có mô tả'}
      </div>

      <div style="background:#f8fafc;border-left:4px solid #10b981;padding:12px;border-radius:8px;margin:12px 0;">
        <strong>Hạng mục cần xử lý:</strong><br/>
        ${workDescription || 'Sửa lỗi phần mềm / bảo trì tiêu chuẩn'}
      </div>

      <div style="background:#f8fafc;border-left:4px solid #0ea5e9;padding:12px;border-radius:8px;margin:12px 0;">
        <strong>Giá linh kiện cần thay:</strong> ${partsCount ? Number(partsCost || 0).toLocaleString('vi-VN') + ' ₫' : 'Không có'}
      </div>

      <div style="background:#f8fafc;border-left:4px solid #8b5cf6;padding:12px;border-radius:8px;margin:12px 0;">
        <strong>Tiền công thợ:</strong> ${Number(laborCost || 0).toLocaleString('vi-VN')} ₫
      </div>

      <div style="background:#f8fafc;border-left:4px solid #f59e0b;padding:12px;border-radius:8px;margin:12px 0;">
        <strong>Chi phí ước tính:</strong> ${Number(estimatedCost || 0).toLocaleString('vi-VN')} ₫<br/>
        <strong>Dự kiến hoàn thành:</strong> ${estimatedCompletionDate ? new Date(estimatedCompletionDate).toLocaleDateString('vi-VN') : 'Sẽ cập nhật sau'}
      </div>

      <p>Vui lòng xác nhận để chúng tôi tiếp tục xử lý thiết bị:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:10px 18px;border-radius:999px;margin:0 6px;">Đồng ý sửa chữa</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#ef4444;color:white;text-decoration:none;padding:10px 18px;border-radius:999px;margin:0 6px;">Từ chối</a>
      </div>

      <p style="font-size:13px;color:#6b7280;">Liên kết có hiệu lực trong 24 giờ.</p>
    </div>
  </div>
</body>
</html>
  `;
};

const completionTemplate = ({ customerName, ticketCode, pickupNote }) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thiết bị đã sửa xong - TechCare</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f7fb; margin:0; padding:20px; color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#059669,#0ea5e9);color:white;padding:20px;">
      <h1 style="margin:0;font-size:22px;">TechCare - Thiết bị đã hoàn thành</h1>
      <p style="margin:8px 0 0;opacity:.9;">Mã phiếu: <strong>${ticketCode}</strong></p>
    </div>
    <div style="padding:20px;line-height:1.6;">
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>Thiết bị của quý khách đã được sửa xong. Quý khách vui lòng đến cửa hàng để nhận máy.</p>
      <div style="background:#f8fafc;border-left:4px solid #0ea5e9;padding:12px;border-radius:8px;margin:12px 0;">
        ${pickupNote || 'Vui lòng mang theo biên nhận khi nhận máy.'}
      </div>
      <p>Xin cảm ơn quý khách đã sử dụng dịch vụ TechCare.</p>
    </div>
  </div>
</body>
</html>
  `;
};

const inventoryRejectedTemplate = ({ customerName, ticketCode, message }) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo linh kiện - TechCare</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f7fb; margin:0; padding:20px; color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#ef4444,#f97316);color:white;padding:20px;">
      <h1 style="margin:0;font-size:22px;">TechCare - Thông báo linh kiện</h1>
      <p style="margin:8px 0 0;opacity:.9;">Mã phiếu: <strong>${ticketCode}</strong></p>
    </div>
    <div style="padding:20px;line-height:1.6;">
      <p>Xin chào <strong>${customerName}</strong>,</p>
      <p>${message || 'Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.'}</p>
      <p>Chúng tôi sẽ liên hệ lại khi có linh kiện phù hợp.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  inviteTemplate,
  approvalTemplate,
  completionTemplate,
  inventoryRejectedTemplate,
};
