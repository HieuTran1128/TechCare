function inviteTemplate(fullName, link) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Thư mời làm việc - TechCare</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <tr>
    <td style="background:linear-gradient(160deg,#1e40af,#4f46e5);border-radius:16px 16px 0 0;padding:32px 36px;">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">TechCare Service</div>
      <div style="font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">Thư mời làm việc</div>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">Xin chào <span style="color:#4f46e5;">${fullName}</span>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">Bạn đã được mời tham gia hệ thống quản lý <strong style="color:#0f172a;">TechCare</strong>. Nhấn vào nút bên dưới để kích hoạt tài khoản và bắt đầu làm việc.</p>

      <div style="height:1px;background:#f1f5f9;margin-bottom:24px;"></div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td align="center">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#1e40af);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.02em;">Kích hoạt tài khoản</a>
          </td>
        </tr>
      </table>

      <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:12px 16px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#854d0e;">⏱ Liên kết có hiệu lực trong <strong>24 giờ</strong>. Sau thời gian này vui lòng liên hệ quản lý để được cấp lại.</p>
      </div>

    </td>
  </tr>

  <tr>
    <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 36px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© TechCare Service &nbsp;·&nbsp; Chào mừng bạn đến với đội ngũ</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function staffPasswordTemplate(fullName, email, password) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Tài khoản nhân viên - TechCare</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:20px;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#2563eb,#4f46e5);color:white;padding:20px;">
      <h1 style="margin:0;font-size:22px;">TechCare - Tài khoản nhân viên</h1>
    </div>
    <div style="padding:20px;line-height:1.6;">
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo trong hệ thống TechCare.</p>
      <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:12px;border-radius:8px;margin:12px 0;">
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0;"><strong>Mật khẩu tạm:</strong> ${password}</p>
      </div>
      <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
    </div>
  </div>
</body>
</html>`;
}

const approvalTemplate = ({
  customerName, ticketCode, deviceType, deviceBrand, deviceModel,
  diagnosisResult, estimatedCost, workDescription, estimatedCompletionDate,
  approveUrl, rejectUrl, partsCost, partsCount, partDetails = [], laborCost,
}) => `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Báo giá sửa chữa - TechCare</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
  <tr>
    <td style="background:linear-gradient(160deg,#1e40af,#4f46e5);border-radius:16px 16px 0 0;padding:32px 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td>
          <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">TechCare Service</div>
          <div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Báo giá sửa chữa</div>
        </td>
        <td align="right" valign="top">
          <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;">
            <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:2px;">Mã phiếu</div>
            <div style="font-size:13px;font-weight:700;color:#ffffff;">${ticketCode}</div>
          </div>
        </td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#ffffff;padding:32px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="margin:0 0 6px;font-size:16px;color:#0f172a;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">Chúng tôi đã hoàn tất kiểm tra thiết bị và gửi báo giá sửa chữa cho phiếu <strong style="color:#1e40af;">${ticketCode}</strong>.</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td colspan="3" style="padding-bottom:10px;"><span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Thiết bị</span></td></tr>
        <tr>
          <td width="34%" style="padding-right:8px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Loại máy</div><div style="font-size:14px;font-weight:700;color:#0f172a;">${deviceType || '—'}</div></div></td>
          <td width="33%" style="padding-right:8px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Hãng</div><div style="font-size:14px;font-weight:700;color:#0f172a;">${deviceBrand || '—'}</div></div></td>
          <td width="33%"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">Model</div><div style="font-size:14px;font-weight:700;color:#0f172a;">${deviceModel || '—'}</div></div></td>
        </tr>
      </table>

      <div style="height:1px;background:#f1f5f9;margin-bottom:20px;"></div>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
        <tr><td style="padding-bottom:6px;"><span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Chẩn đoán lỗi</span></td></tr>
        <tr><td style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:14px 16px;font-size:14px;color:#713f12;line-height:1.6;">${diagnosisResult || 'Chưa có mô tả'}</td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td style="padding-bottom:6px;"><span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Hạng mục xử lý</span></td></tr>
        <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;font-size:14px;color:#14532d;line-height:1.6;">${workDescription || 'Sửa lỗi / bảo trì tiêu chuẩn'}</td></tr>
      </table>

      ${partsCount ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr><td style="padding-bottom:10px;"><span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Linh kiện thay thế</span></td></tr>
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          ${partDetails.map((item, idx) => `
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:14px 16px;border-bottom:${idx < partDetails.length - 1 ? '1px solid #f1f5f9' : 'none'};">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td>
                  <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:3px;">${item.name}${item.brand ? ` (${item.brand})` : ''}${item.warrantyMonths ? `&nbsp;<span style="padding:2px 8px;background:#ede9fe;color:#6d28d9;border-radius:20px;font-size:11px;font-weight:700;">BH ${item.warrantyMonths} tháng</span>` : ''}</div>
                  <div style="font-size:12px;color:#94a3b8;">SL: ${item.quantity} &nbsp;·&nbsp; Đơn giá: ${Number(item.unitPrice).toLocaleString('vi-VN')} ₫</div>
                </td>
                <td align="right" style="white-space:nowrap;padding-left:12px;font-size:15px;font-weight:700;color:#0f172a;">${Number(item.lineTotal).toLocaleString('vi-VN')} ₫</td>
              </tr></table>
            </td></tr>
          </table>`).join('')}
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:12px 16px;background:#f1f5f9;border-top:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="font-size:13px;color:#475569;font-weight:600;">Tổng linh kiện</td>
                <td align="right" style="font-size:15px;font-weight:800;color:#0f172a;">${Number(partsCost).toLocaleString('vi-VN')} ₫</td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
      </table>` : ''}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td width="49%" style="padding-right:6px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;"><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Tiền công thợ</div><div style="font-size:16px;font-weight:700;color:#0f172a;">${Number(laborCost || 0).toLocaleString('vi-VN')} ₫</div></div></td>
          <td width="49%" style="padding-left:6px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;"><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Dự kiến hoàn thành</div><div style="font-size:16px;font-weight:700;color:#0f172a;">${estimatedCompletionDate ? new Date(estimatedCompletionDate).toLocaleDateString('vi-VN') : 'Sẽ cập nhật'}</div></div></td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr><td style="background:linear-gradient(135deg,#1e40af,#4f46e5);border-radius:12px;padding:18px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:600;">Tổng chi phí ước tính</td>
            <td align="right" style="font-size:24px;font-weight:900;color:#ffffff;">${Number(estimatedCost || 0).toLocaleString('vi-VN')} ₫</td>
          </tr></table>
        </td></tr>
      </table>

      <p style="margin:0 0 16px;font-size:14px;color:#64748b;text-align:center;">Vui lòng xác nhận để chúng tôi tiếp tục xử lý thiết bị của bạn:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td width="49%" style="padding-right:6px;"><a href="${approveUrl}" style="display:block;background:#16a34a;color:#ffffff;text-decoration:none;text-align:center;padding:15px;border-radius:10px;font-size:15px;font-weight:700;">Đồng ý sửa chữa</a></td>
          <td width="49%" style="padding-left:6px;"><a href="${rejectUrl}" style="display:block;background:#dc2626;color:#ffffff;text-decoration:none;text-align:center;padding:15px;border-radius:10px;font-size:15px;font-weight:700;">Từ chối</a></td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">Liên kết có hiệu lực trong 24 giờ. Sau thời gian này, vui lòng liên hệ lại cửa hàng.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 36px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© TechCare Service &nbsp;·&nbsp; Cảm ơn quý khách đã tin tưởng dịch vụ của chúng tôi</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const completionTemplate = ({ customerName, ticketCode, pickupNote }) => `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Thiết bị đã sửa xong - TechCare</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:20px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#059669,#0ea5e9);color:white;padding:24px 28px;">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">TechCare Service</div>
      <div style="font-size:22px;font-weight:800;">Thiết bị đã hoàn thành</div>
      <div style="margin-top:10px;background:rgba(255,255,255,0.15);border-radius:6px;padding:6px 12px;display:inline-block;font-size:13px;font-weight:600;">Mã phiếu: ${ticketCode}</div>
    </div>
    <div style="padding:28px;line-height:1.6;">
      <p style="margin:0 0 12px;font-size:15px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#475569;">Thiết bị của quý khách đã được sửa xong. Vui lòng đến cửa hàng để nhận máy.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;padding:14px 16px;border-radius:10px;margin-bottom:20px;font-size:14px;color:#14532d;">
        ${pickupNote || 'Vui lòng mang theo mã phiếu khi đến nhận máy.'}
      </div>
      <p style="margin:0;font-size:14px;color:#475569;">Xin cảm ơn quý khách đã sử dụng dịch vụ TechCare.</p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:14px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© TechCare Service &nbsp;·&nbsp; Cảm ơn quý khách</p>
    </div>
  </div>
</body>
</html>`;

const warrantyCompletionTemplate = ({ customerName, ticketCode, warrantyTicketCode, partName, note }) => `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bảo hành hoàn tất - TechCare</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:20px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#7c3aed,#2563eb);color:white;padding:24px 28px;">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">TechCare Service</div>
      <div style="font-size:22px;font-weight:800;">Bảo hành hoàn tất</div>
      <div style="margin-top:10px;background:rgba(255,255,255,0.15);border-radius:6px;padding:6px 12px;display:inline-block;font-size:13px;font-weight:600;">Phiếu: ${warrantyTicketCode}</div>
    </div>
    <div style="padding:28px;line-height:1.6;">
      <p style="margin:0 0 12px;font-size:15px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#475569;">Thiết bị của quý khách đã được xử lý bảo hành thành công (phiếu gốc: <strong>${ticketCode}</strong>).</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;padding:14px 16px;border-radius:10px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#15803d;margin-bottom:4px;">Linh kiện bảo hành</div>
        <div style="font-size:14px;color:#14532d;">${partName}</div>
        ${note ? `<div style="margin-top:8px;font-size:13px;color:#374151;">${note}</div>` : ''}
      </div>
      <p style="margin:0;font-size:14px;color:#475569;">Quý khách vui lòng đến cửa hàng để nhận máy. Xin cảm ơn đã tin tưởng TechCare.</p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:14px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© TechCare Service &nbsp;·&nbsp; Cảm ơn quý khách</p>
    </div>
  </div>
</body>
</html>`;

const inventoryRejectedTemplate = ({ customerName, ticketCode, message }) => `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Thông báo linh kiện - TechCare</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f7fb;margin:0;padding:20px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(120deg,#ef4444,#f97316);color:white;padding:24px 28px;">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">TechCare Service</div>
      <div style="font-size:22px;font-weight:800;">Thông báo linh kiện</div>
      <div style="margin-top:10px;background:rgba(255,255,255,0.15);border-radius:6px;padding:6px 12px;display:inline-block;font-size:13px;font-weight:600;">Mã phiếu: ${ticketCode}</div>
    </div>
    <div style="padding:28px;line-height:1.6;">
      <p style="margin:0 0 12px;font-size:15px;">Xin chào <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#475569;">${message || 'Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.'}</p>
      <p style="margin:0;font-size:14px;color:#475569;">Chúng tôi sẽ liên hệ lại khi có linh kiện phù hợp.</p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:14px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">© TechCare Service &nbsp;·&nbsp; Cảm ơn quý khách</p>
    </div>
  </div>
</body>
</html>`;

module.exports = {
  inviteTemplate,
  staffPasswordTemplate,
  approvalTemplate,
  completionTemplate,
  inventoryRejectedTemplate,
  warrantyCompletionTemplate,
};
