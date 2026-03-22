const service = require('../services/repairTicket.service');

const sendError = (res, status, message, code = 'error') => {
  res.status(status).json({ error: code, message });
};

const renderCustomerDecisionPage = ({
  title,
  subtitle,
  icon,
  iconBg,
  primaryColor,
}) => `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        --primary: ${primaryColor};
        --text: #0f172a;
        --muted: #64748b;
        --card: #ffffff;
        --bg1: #eef2ff;
        --bg2: #f8fafc;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: var(--text);
        background: radial-gradient(circle at top left, var(--bg1), var(--bg2));
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .card {
        width: 100%;
        max-width: 560px;
        background: var(--card);
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
        padding: 32px;
        text-align: center;
        border: 1px solid #e2e8f0;
      }

      .icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 36px;
        background: ${iconBg};
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
      }

      p {
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }

      .badge {
        margin-top: 20px;
        display: inline-block;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        background: color-mix(in srgb, var(--primary) 12%, white);
        color: var(--primary);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="badge">TechCare Service</div>
    </div>
  </body>
</html>
`;

exports.create = async (req, res) => {
  try {
    const ticket = await service.createTicket(req.body, req.user.userId);
    res.status(201).json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể tạo phiếu sửa chữa');
  }
};

exports.assign = async (req, res) => {
  try {
    const ticket = await service.assignTechnician(req.params.id, req.body.technicianId, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phân công kỹ thuật viên');
  }
};

exports.requestInventory = async (req, res) => {
  try {
    const ticket = await service.requestInventory(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gửi yêu cầu kho');
  }
};

exports.respondInventory = async (req, res) => {
  try {
    const ticket = await service.respondInventory(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể phản hồi kho');
  }
};

exports.sendQuotation = async (req, res) => {
  try {
    const ticket = await service.sendQuotation(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gửi báo giá');
  }
};

exports.customerApprove = async (req, res) => {
  try {
    await service.customerApprove(req.params.token);
    res.status(200).send(
      renderCustomerDecisionPage({
        title: 'Xác nhận thành công',
        subtitle: 'Cảm ơn quý khách đã đồng ý sửa chữa. TechCare sẽ tiến hành xử lý thiết bị trong thời gian sớm nhất.',
        icon: '✅',
        iconBg: '#dcfce7',
        primaryColor: '#16a34a',
      }),
    );
  } catch (err) {
    res.status(400).send(
      renderCustomerDecisionPage({
        title: 'Không thể xác nhận',
        subtitle: err.message || 'Link không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ TechCare để được hỗ trợ.',
        icon: '⚠️',
        iconBg: '#fee2e2',
        primaryColor: '#dc2626',
      }),
    );
  }
};

exports.customerReject = async (req, res) => {
  try {
    await service.customerReject(req.params.token);
    res.status(200).send(
      renderCustomerDecisionPage({
        title: 'Đã ghi nhận từ chối',
        subtitle: 'TechCare đã nhận được phản hồi từ chối báo giá. Nhân viên sẽ sớm liên hệ để tư vấn phương án phù hợp hơn.',
        icon: '📩',
        iconBg: '#fef3c7',
        primaryColor: '#d97706',
      }),
    );
  } catch (err) {
    res.status(400).send(
      renderCustomerDecisionPage({
        title: 'Không thể xử lý yêu cầu',
        subtitle: err.message || 'Link không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ TechCare để được hỗ trợ.',
        icon: '⚠️',
        iconBg: '#fee2e2',
        primaryColor: '#dc2626',
      }),
    );
  }
};

exports.sendInventoryRejection = async (req, res) => {
  try {
    const ticket = await service.sendInventoryRejection(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gửi thông báo cho khách hàng');
  }
};

exports.startRepair = async (req, res) => {
  try {
    const ticket = await service.startRepair(req.params.id, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể bắt đầu sửa chữa');
  }
};

exports.complete = async (req, res) => {
  try {
    const ticket = await service.completeTicket(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể hoàn thành phiếu');
  }
};

exports.findByCode = async (req, res) => {
  try {
    const ticket = await service.findTicketByCode(req.query.ticketCode);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không tìm thấy phiếu');
  }
};

exports.searchByCode = async (req, res) => {
  try {
    const data = await service.searchTicketsByCodeKeyword(req.query.keyword, req.query.limit);
    res.json({ data });
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể gợi ý mã phiếu');
  }
};

exports.createPayosPayment = async (req, res) => {
  try {
    const result = await service.createPayosPayment(req.params.id, req.user.userId);
    res.json(result);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể tạo phiên thanh toán payOS');
  }
};

exports.markPaid = async (req, res) => {
  try {
    const ticket = await service.markTicketAsPaid(req.params.id, req.body, req.user.userId);
    res.json(ticket);
  } catch (err) {
    sendError(res, 400, err.message || 'Không thể cập nhật trạng thái thanh toán');
  }
};

exports.payosWebhook = async (req, res) => {
  try {
    const result = await service.handlePayosWebhook(req.body);
    res.json(result);
  } catch (err) {
    sendError(res, 400, err.message || 'Webhook payOS không hợp lệ');
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await service.getAllTickets(
      {
        limit: req.query.limit || 100,
        sort: req.query.sort || '-createdAt',
        technicianId: req.query.technicianId,
        status: req.query.status,
      },
      req.user || null,
    );

    res.json(result);
  } catch (err) {
    sendError(res, 500, err.message || 'Không thể lấy danh sách phiếu sửa chữa');
  }
};

exports.getManagerSummary = async (req, res) => {
  try {
    const summary = await service.getManagerSummary();
    res.json(summary);
  } catch (err) {
    sendError(res, 500, err.message || 'Không thể lấy thống kê');
  }
};
