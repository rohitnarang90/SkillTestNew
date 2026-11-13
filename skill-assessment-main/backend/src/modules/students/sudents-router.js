const express = require("express");
const router = express.Router();
const studentController = require("./students-controller");
const { validateRequest } = require("../../utils");
const {
    StudentIdSchema,
    StudentListSchema,
    StudentPayloadSchema,
    StudentStatusSchema,
} = require("./students-schema");

router.get(
    "",
    validateRequest(StudentListSchema),
    studentController.handleGetAllStudents
);
router.post(
    "",
    validateRequest(StudentPayloadSchema),
    studentController.handleAddStudent
);
router.get(
    "/:id",
    validateRequest(StudentIdSchema),
    studentController.handleGetStudentDetail
);
router.post(
    "/:id/status",
    validateRequest(StudentStatusSchema),
    studentController.handleStudentStatus
);
router.put(
    "/:id",
    validateRequest(StudentIdSchema),
    validateRequest(StudentPayloadSchema),
    studentController.handleUpdateStudent
);
router.delete("/:id", validateRequest(StudentIdSchema), studentController.handleDeleteStudent);

module.exports = { studentsRoutes: router };
