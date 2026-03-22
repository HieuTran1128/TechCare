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

function staffPasswordTemplate(fullName, email, password) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tài khoản nhân viên - TechCare</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f5f7fb; margin:0; padding:20px; color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#2563eb,#4f46e5);color:white;padding:20px;">
      <h1 style="margin:0;font-size:22px;">TechCare - Tài khoản nhân viên</h1>
    </div>
    <div style="padding:20px;line-height:1.6;">
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo trong hệ thống TechCare.</p>
      <p>Dưới đây là thông tin đăng nhập:</p>
      <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px;border-radius:8px;margin:12px 0;">
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0;"><strong>Mật khẩu tạm:</strong> ${password}</p>
      </div>
      <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
    </div>
  </div>
</body>
</html>
  `;
}

const approvalTemplate = ({
  customerName,
  ticketCode,
  deviceType,
  deviceBrand,
  deviceModel,
  diagnosisResult,
  estimatedCost,
  workDescription,
  estimatedCompletionDate,
  approveUrl,
  rejectUrl,
  partsCost,
  partsCount,
  partDetails = [],
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
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:22px 24px;color:white;">
      <h1 style="margin:0;font-size:24px;line-height:1.2;font-weight:800;">TechCare - Báo giá sửa chữa</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:.95;">Mã phiếu: <strong>${ticketCode}</strong></p>
    </div>

    <div style="padding:22px;line-height:1.6;">
      <p style="margin:0 0 10px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 14px;color:#334155;">Chúng tôi đã hoàn tất kiểm tra thiết bị và gửi báo giá sửa chữa cho phiếu <strong>${ticketCode}</strong>.</p>

      <div style="border:1px solid #bfdbfe;background:#f8fbff;border-radius:12px;padding:14px;margin:0 0 12px;">
        <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">Thông tin thiết bị</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:8px 8px;">
          <tr>
            <td style="background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:10px;">
              <div style="font-size:11px;color:#64748b;">Loại máy</div>
              <div style="font-size:14px;font-weight:700;">${deviceType || '-'}</div>
            </td>
            <td style="background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:10px;">
              <div style="font-size:11px;color:#64748b;">Hãng</div>
              <div style="font-size:14px;font-weight:700;">${deviceBrand || '-'}</div>
            </td>
            <td style="background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:10px;">
              <div style="font-size:11px;color:#64748b;">Model</div>
              <div style="font-size:14px;font-weight:700;">${deviceModel || '-'}</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:10px;padding:12px;margin:0 0 10px;">
        <div style="font-weight:700;margin-bottom:3px;">Mô tả lỗi kỹ thuật:</div>
        <div style="color:#334155;">${diagnosisResult || 'Chưa có mô tả'}</div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #10b981;border-radius:10px;padding:12px;margin:0 0 10px;">
        <div style="font-weight:700;margin-bottom:3px;">Hạng mục cần xử lý:</div>
        <div style="color:#334155;">${workDescription || 'Sửa lỗi phần mềm / bảo trì tiêu chuẩn'}</div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0ea5e9;border-radius:10px;padding:12px;margin:0 0 10px;">
        <div style="font-weight:700;margin-bottom:6px;">Giá linh kiện cần thay:</div>
        ${partsCount
          ? `<div style="margin-top:6px;">
              ${partDetails
                .map(
                  (item, index) => `
                    <div style="padding:8px 0;border-bottom:${index === partDetails.length - 1 ? 'none' : '1px dashed #cbd5e1'};font-size:14px;">
                      <div style="font-weight:700;color:#0f172a;">${item.name}</strong>${item.brand ? ` (${item.brand})` : ''}</div>
                      <div style="color:#475569;">SL: ${item.quantity} • Đơn giá: ${Number(item.unitPrice || 0).toLocaleString('vi-VN')} ₫ • Thành tiền: ${Number(item.lineTotal || 0).toLocaleString('vi-VN')} ₫</div>
                    </div>
                  `,
                )
                .join('')}
              <div style="margin-top:8px;font-weight:800;color:#0f172a;">Tổng linh kiện: ${Number(partsCost || 0).toLocaleString('vi-VN')} ₫</div>
            </div>`
          : 'Không có'}
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #8b5cf6;border-radius:10px;padding:12px;margin:0 0 10px;">
        <strong>Tiền công thợ:</strong> ${Number(laborCost || 0).toLocaleString('vi-VN')} ₫
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;border-radius:10px;padding:12px;margin:0 0 12px;">
        <strong>Chi phí ước tính:</strong> ${Number(estimatedCost || 0).toLocaleString('vi-VN')} ₫<br/>
        <strong>Dự kiến hoàn thành:</strong> ${estimatedCompletionDate ? new Date(estimatedCompletionDate).toLocaleDateString('vi-VN') : 'Sẽ cập nhật sau'}
      </div>

      <p style="margin:0 0 14px;">Vui lòng xác nhận để chúng tôi tiếp tục xử lý thiết bị:</p>
      <div style="text-align:center;margin:18px 0 8px;">
        <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;margin:0 6px 8px;font-weight:700;font-size:14px;">Đồng ý sửa chữa</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;margin:0 6px 8px;font-weight:700;font-size:14px;">Từ chối</a>
      </div>

      <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Liên kết có hiệu lực trong 24 giờ.</p>
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
