
const express = require("express");
const router = express.Router();
const {
  getTickets,
  getTicket,
  updateTicketStatus,
  updateTicketPriority,
  addTicketReply,
} = require("../../controllers/admin/ticketController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/", getTickets);
router.get("/:id", getTicket);
router.put("/:id/status", updateTicketStatus);
router.put("/:id/priority", updateTicketPriority);
router.post("/:id/reply", addTicketReply);

module.exports = router;
