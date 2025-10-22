
const asyncHandler = require("express-async-handler");
const {
  SupportTicket,
  SupportTicketReply,
  User,
} = require("../../models");
const { Op } = require("sequelize");

// @desc    Get all support tickets
// @route   GET /api/admin/tickets
// @access  Private/Admin
const getTickets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  let status = req.query.status || "";
  let priority = req.query.priority || "";

  // Map frontend status/priority to DB values
  const statusMap = {
    "open": "open",
    "in-progress": "in_progress",
    "resolved": "resolved",
    "closed": "closed"
  };
  const priorityMap = {
    "low": "low",
    "medium": "medium",
    "high": "high",
    "urgent": "urgent"
  };
  if (status && status !== "all") status = statusMap[status] || status;
  if (priority) priority = priorityMap[priority] || priority;

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status && status !== "all") {
    whereClause.status = status;
  }
  if (priority) {
    whereClause.priority = priority;
  }

  const { count, rows: tickets } = await SupportTicket.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["first_name", "last_name", "email"],
      },
    ],
  });

  // Map DB enums to frontend values
  const statusMapReverse = {
    "open": "open",
    "in_progress": "in-progress",
    "resolved": "resolved",
    "closed": "closed"
  };

  const formattedTickets = tickets.map((t) => ({
  id: t.id,
  subject: t.subject,
  customer: t.user ? `${t.user.first_name} ${t.user.last_name}` : "N/A",
  email: t.user ? t.user.email : "N/A",
  status: statusMapReverse[t.status] || t.status,
  priority: t.priority,
  createdAt: t.created_at,
  lastReply: t.updated_at,
  }));

  res.json({
    tickets: formattedTickets,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalTickets: count,
      limit,
    },
  });
});

// @desc    Get single ticket details
// @route   GET /api/admin/tickets/:id
// @access  Private/Admin
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      {
        model: SupportTicketReply,
        as: "replies",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["first_name", "last_name", "role"],
          },
        ],
      },
    ],
  });

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  // Map DB enums to frontend values
  const statusMapReverse = {
    "open": "open",
    "in_progress": "in-progress",
    "resolved": "resolved",
    "closed": "closed"
  };

  res.json({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    status: statusMapReverse[ticket.status] || ticket.status,
    priority: ticket.priority,
    createdAt: ticket.created_at,
    customer: ticket.user
      ? {
          id: ticket.user.id,
          name: `${ticket.user.first_name} ${ticket.user.last_name}`,
          email: ticket.user.email,
        }
      : null,
    relatedOrder: null, // Implement if you have order relation
    messages: ticket.replies.map((m) => ({
      id: m.id,
      sender: m.user && m.user.role === "customer" ? "customer" : "admin",
      senderName: m.user ? `${m.user.first_name} ${m.user.last_name}` : "Support Team",
      message: m.message,
      timestamp: m.created_at,
      attachments: [], // Implement if you have attachments
    })),
  });
});

// @desc    Update ticket status
// @route   PUT /api/admin/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const { status } = req.body;
  ticket.status = status;
  await ticket.save();

  res.json({ success: true, message: "Ticket status updated successfully" });
});

// @desc    Update ticket priority
// @route   PUT /api/admin/tickets/:id/priority
// @access  Private/Admin
const updateTicketPriority = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const { priority } = req.body;
  ticket.priority = priority;
  await ticket.save();

  res.json({ success: true, message: "Ticket priority updated successfully" });
});

// @desc    Reply to a ticket
// @route   POST /api/admin/tickets/:id/reply
// @access  Private/Admin
const addTicketReply = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByPk(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const { message, attachments } = req.body;

  const reply = await SupportTicketReply.create({
    ticket_id: req.params.id,
    user_id: req.user.id,
    message,
  });

  // This needs to be implemented
  // if (attachments && attachments.length > 0) {
  //   ...
  // }

  res.status(201).json({
    success: true,
    message: "Reply sent successfully",
    reply: {
      id: reply.id,
      sender: "admin",
      senderName: req.user.name,
      message: reply.message,
      timestamp: reply.created_at,
    },
  });
});

module.exports = {
  getTickets,
  getTicket,
  updateTicketStatus,
  updateTicketPriority,
  addTicketReply,
};
