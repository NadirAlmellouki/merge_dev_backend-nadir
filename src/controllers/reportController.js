import sequelize from "../config/db.config.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import StudySession from "../models/StudySession.js";
import Message from "../models/Message.js";
import AdminAction from "../models/AdminAction.js";

const hasTarget = (body) =>
  body.reported_user_id || body.reported_session_id || body.reported_message_id;

const createReport = async (req, res) => {
  const reporter_id = req.user.userId;
  const {
    reported_user_id,
    reported_session_id,
    reported_message_id,
    reason,
    description,
  } = req.body;

  if (!reason?.trim()) {
    return res.status(400).json({ message: "reason is required" });
  }

  if (!hasTarget(req.body)) {
    return res.status(400).json({
      message: "at least one target is required: reported_user_id, reported_session_id or reported_message_id",
    });
  }

  if (reported_user_id) {
    const user = await User.findByPk(reported_user_id);
    if (!user) return res.status(404).json({ message: "reported user not found" });
  }

  if (reported_session_id) {
    const session = await StudySession.findByPk(reported_session_id);
    if (!session) return res.status(404).json({ message: "reported session not found" });
  }

  if (reported_message_id) {
    const message = await Message.findByPk(reported_message_id);
    if (!message) return res.status(404).json({ message: "reported message not found" });
  }

  const report = await Report.create({
    reporter_id,
    reported_user_id: reported_user_id ?? null,
    reported_session_id: reported_session_id ?? null,
    reported_message_id: reported_message_id ?? null,
    reason: reason.trim(),
    description,
    status: "pending",
  });

  return res.status(201).json({ report });
};

const listReports = async (req, res) => {
  const where = {};
  if (req.query.status) {
    where.status = req.query.status;
  }

  const reports = await Report.findAll({
    where,
    order: [["created_at", "DESC"]],
    include: [
      { model: User, as: "reporter", attributes: ["id", "first_name", "last_name", "email", "role"] },
      { model: User, as: "reportedUser", attributes: ["id", "first_name", "last_name", "email", "role"] },
      { model: User, as: "resolvedBy", attributes: ["id", "first_name", "last_name", "role"] },
    ],
  });

  return res.status(200).json({ count: reports.length, reports });
};

const resolveReport = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const moderatorId = req.user.userId;

  if (!["resolved", "dismissed"].includes(status)) {
    return res.status(400).json({ message: "status must be resolved or dismissed" });
  }

  const report = await Report.findByPk(id);
  if (!report) {
    return res.status(404).json({ message: "report not found" });
  }

  if (report.status !== "pending") {
    return res.status(400).json({ message: "report is already processed" });
  }

  const result = await sequelize.transaction(async (t) => {
    await report.update(
      {
        status,
        resolved_by_id: moderatorId,
        resolved_at: new Date(),
      },
      { transaction: t },
    );

    const adminAction = await AdminAction.create(
      {
        admin_id: moderatorId,
        action_type: "resolve_report",
        target_user_id: report.reported_user_id,
        reason: reason?.trim() || `Report ${status}`,
      },
      { transaction: t },
    );

    return { report, adminAction };
  });

  return res.status(200).json({
    report: result.report,
    admin_action: result.adminAction,
  });
};

export default {
  createReport,
  listReports,
  resolveReport,
};
