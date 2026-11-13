const { z } = require("zod");

const studentId = z.string().regex(/^[1-9]\d*$/, "Student ID must be a positive integer");

const StudentIdSchema = z.object({
    params: z.object({ id: studentId }),
});

const StudentListSchema = z.object({
    query: z.object({
        name: z.string().optional(),
        class: z.string().optional(),
        section: z.string().optional(),
        roll: z.string().regex(/^\d+$/, "Roll must be a number").optional(),
    }),
});

const StudentPayloadSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("A valid email is required"),
    }).passthrough(),
});

const StudentStatusSchema = z.object({
    params: z.object({ id: studentId }),
    body: z.object({
        status: z.boolean(),
    }),
});

module.exports = {
    StudentIdSchema,
    StudentListSchema,
    StudentPayloadSchema,
    StudentStatusSchema,
};
