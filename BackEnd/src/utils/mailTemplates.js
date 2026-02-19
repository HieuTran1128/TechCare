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

const approvalTemplate = (customerName, ticketCode, diagnosisResult, estimatedCost, approveUrl, rejectUrl) => {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo giá sửa chữa - TechCare</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; color: #333; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .info-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .buttons { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; padding: 14px 32px; margin: 10px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 50px; transition: all 0.3s; }
    .btn-approve { background: #10b981; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .highlight { color: #3b82f6; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TechCare - Báo giá sửa chữa</h1>
    </div>
    
    <div class="content">
      <p>Xin chào <strong>${customerName}</strong>,</p>
      
      <p>Cảm ơn quý khách đã tin tưởng gửi thiết bị đến TechCare. Chúng tôi đã kiểm tra và chẩn đoán xong phiếu sửa chữa <strong>#${ticketCode}</strong>.</p>
      
      <div class="info-box">
        <strong>Kết quả chẩn đoán:</strong><br>
        ${diagnosisResult || 'Không có mô tả chi tiết'}
      </div>
      
      <div class="info-box">
        <strong>Chi phí ước tính:</strong><br>
        <span class="highlight">${estimatedCost.toLocaleString('vi-VN')} ₫</span>
      </div>
      
      <p>Vui lòng xác nhận bằng cách chọn một trong hai nút bên dưới. Link xác nhận có hiệu lực trong <strong>24 giờ</strong>.</p>
      
      <div class="buttons">
        <a href="${approveUrl}" class="btn btn-approve">Đồng ý sửa chữa</a>
        <a href="${rejectUrl}" class="btn btn-reject">Từ chối sửa chữa</a>
      </div>
      
      <p>Nếu quý khách có bất kỳ thắc mắc nào, hãy liên hệ hotline <strong>1900-xxxx</strong> hoặc reply email này.</p>
      
      <p>Trân trọng,<br>
      <strong>Đội ngũ TechCare</strong></p>
    </div>
    
    <div class="footer">
      <p>TechCare - Dịch vụ sửa chữa thiết bị chuyên nghiệp</p>
      <p>Email: support@techcare.vn | Hotline: 1900-xxxx</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  inviteTemplate,
  approvalTemplate
};
