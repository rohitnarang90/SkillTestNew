const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const {
    findAllStudents,
    findStudentDetail,
    findStudentToSetStatus,
    addOrUpdateStudent,
    studentExists,
    deleteStudentById,
} = require("./students-repository");

const checkStudentId = async (id) => {
    if (!await studentExists(id)) {
        throw new ApiError(404, "Student not found");
    }
};

const getAllStudents = async (payload) => {
    return findAllStudents(payload);
};

const isEmailConflict = (result) =>
    result?.message === "Email already exists" ||
    /duplicate key.*email/i.test(result?.description || "");

const handleStudentWriteFailure = (operation, result) => {
    console.error(`Unable to ${operation} student`, {
        message: result?.message,
        description: result?.description,
    });

    if (isEmailConflict(result)) {
        throw new ApiError(409, "A student with this email already exists");
    }

    throw new ApiError(400, result?.message || `Unable to ${operation} student`);
};

const getStudentDetail = async (id) => {
    await checkStudentId(id);
    return findStudentDetail(id);
};

const addNewStudent = async (payload) => {
    const result = await addOrUpdateStudent(payload);
    if (!result?.status) {
        handleStudentWriteFailure("add", result);
    }

    try {
        await sendAccountVerificationEmail({
            userId: result.userId,
            userEmail: payload.email,
        });
        return {
            id: result.userId,
            message: "Student added and verification email sent successfully.",
        };
    } catch (error) {
        console.error("Student was added, but verification email could not be sent:", error);
        return {
            id: result.userId,
            message: "Student added, but failed to send verification email.",
        };
    }
};

const updateStudent = async (payload) => {
    await checkStudentId(payload.userId);

    const result = await addOrUpdateStudent(payload);
    if (!result?.status) {
        handleStudentWriteFailure("update", result);
    }

    return { message: result.message };
};

const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(404, "Student not found");
    }

    return { message: "Student status changed successfully" };
};

const deleteStudent = async (id) => {
    await checkStudentId(id);

    const affectedRow = await deleteStudentById(id);
    if (affectedRow <= 0) {
        throw new ApiError(404, "Student not found");
    }

    return { message: "Student deleted successfully" };
};

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
    deleteStudent,
};
