const express = require("express")
const {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  addTicketReply,
  getUserSupportTicket,
} = require("../controllers/supportController")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// All support routes require authentication
router.use(authenticate)

router.get("/", getSupportTickets)
router.get("/:id", getSupportTicket)
router.get("/user/:id", getUserSupportTicket)
router.post("/", createSupportTicket)
router.put("/:id", authorize("admin"), updateSupportTicket)
router.post("/:id/replies", addTicketReply)

module.exports = router
