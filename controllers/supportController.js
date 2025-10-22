const { SupportTicket, SupportTicketReply, User } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// Generate unique ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `TH${timestamp.slice(-6)}${random}`
}

// @desc    Get user's support tickets
// @route   GET /api/support
// @access  Private
const getSupportTickets = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, priority } = req.query

    const whereClause = {}

    // Admin can see all tickets, users only see their own
    if (req.user.role !== "admin") {
      whereClause.user_id = userId
    }

    if (status) whereClause.status = status
    if (priority) whereClause.priority = priority

    const { count, rows: tickets } = await SupportTicket.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
    })

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get support tickets error:", error)
    res.status(500).json({ message: "Failed to fetch support tickets" })
  }
}

// @desc    Get single support ticket
// @route   GET /api/support/:id
// @access  Private
const getSupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const whereClause = { id }
    if (req.user.role !== "admin") {
      whereClause.user_id = userId
    }

    const ticket = await SupportTicket.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: SupportTicketReply,
          as: "replies",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "first_name", "last_name", "email", "role"],
            },
          ],
          where: req.user.role === "admin" ? {} : { is_internal: false },
          required: false,
          order: [["created_at", "ASC"]],
        },
      ],
    })

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" })
    }

    res.json({
      success: true,
      data: { ticket },
    })
  } catch (error) {
    logger.error("Get support ticket error:", error)
    res.status(500).json({ message: "Failed to fetch support ticket" })
  }
}
const getUserSupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    // const userId = req.user.id

    const whereClause = {  }
    if (req.user.role !== "admin") {
      whereClause.user_id = id
    }

    const ticket = await SupportTicket.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
        {
          model: SupportTicketReply,
          as: "replies",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "first_name", "last_name", "email", "role"],
            },
          ],
          where: req.user.role === "admin" ? {} : { is_internal: false },
          required: false,
          order: [["created_at", "ASC"]],
        },
      ],
    })

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" })
    }

    res.json({
      success: true,
      data: { ticket },
    })
  } catch (error) {
    logger.error("Get support ticket error:", error)
    res.status(500).json({ message: "Failed to fetch support ticket" })
  }
}

// @desc    Create support ticket
// @route   POST /api/support
// @access  Private
const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, priority = "medium" } = req.body

    const ticket = await SupportTicket.create({
      ticket_number: generateTicketNumber(),
      user_id: req.user.id,
      subject,
      message,
      priority,
    })

    // Fetch the complete ticket with user details
    const completeTicket = await SupportTicket.findByPk(ticket.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: { ticket: completeTicket },
    })
  } catch (error) {
    logger.error("Create support ticket error:", error)
    res.status(500).json({ message: "Failed to create support ticket" })
  }
}

// @desc    Update support ticket
// @route   PUT /api/support/:id
// @access  Private/Admin
const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { status, priority, assigned_to } = req.body

    const ticket = await SupportTicket.findByPk(id)
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" })
    }

    // Only admin can update tickets
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    await ticket.update({
      status: status || ticket.status,
      priority: priority || ticket.priority,
      assigned_to: assigned_to !== undefined ? assigned_to : ticket.assigned_to,
    })

    // Fetch updated ticket with associations
    const updatedTicket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["id", "first_name", "last_name", "email"],
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      message: "Support ticket updated successfully",
      data: { ticket: updatedTicket },
    })
  } catch (error) {
    logger.error("Update support ticket error:", error)
    res.status(500).json({ message: "Failed to update support ticket" })
  }
}

// @desc    Add reply to support ticket
// @route   POST /api/support/:id/replies
// @access  Private
const addTicketReply = async (req, res) => {
  try {
    const { id } = req.params
    const { message, is_internal = false } = req.body

    const whereClause = { id }
    if (req.user.role !== "admin") {
      whereClause.user_id = req.user.id
    }

    const ticket = await SupportTicket.findOne({ where: whereClause })
    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" })
    }

    // Only admin can add internal replies
    const replyData = {
      ticket_id: id,
      user_id: req.user.id,
      message,
      is_internal: req.user.role === "admin" ? is_internal : false,
    }

    const reply = await SupportTicketReply.create(replyData)

    // Update ticket status if it was closed and customer replies
    if (ticket.status === "closed" && req.user.role !== "admin") {
      await ticket.update({ status: "open" })
    }

    // Fetch the complete reply with user details
    const completeReply = await SupportTicketReply.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "role"],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: { reply: completeReply },
    })
  } catch (error) {
    logger.error("Add ticket reply error:", error)
    res.status(500).json({ message: "Failed to add reply" })
  }
}

module.exports = {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  addTicketReply,
  getUserSupportTicket
}
