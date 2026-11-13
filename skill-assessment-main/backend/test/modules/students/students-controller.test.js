const assert = require("node:assert/strict");
const { after, test } = require("node:test");

const servicePath = require.resolve("../../../src/modules/students/students-service");
const implementations = {};
const service = Object.fromEntries(
    [
        "getAllStudents",
        "addNewStudent",
        "getStudentDetail",
        "setStudentStatus",
        "updateStudent",
        "deleteStudent",
    ].map((name) => [
        name,
        (...args) => implementations[name](...args),
    ])
);
const setServiceMock = (name, implementation) => {
    implementations[name] = implementation;
};

require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: service,
};

const controller = require("../../../src/modules/students/students-controller");

after(() => {
    delete require.cache[servicePath];
});

const createResponse = () => {
    let complete;
    const completed = new Promise((resolve) => {
        complete = resolve;
    });
    const res = {
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            complete({ body, statusCode: this.statusCode });
            return this;
        },
    };

    return {
        res,
        completed,
        next: (error) => complete({ error }),
    };
};

test("lists students and maps the class query to className", async () => {
    const students = [{ id: 1 }];
    let received;
    setServiceMock("getAllStudents", async (filters) => {
        received = filters;
        return students;
    });
    const { res, completed, next } = createResponse();

    controller.handleGetAllStudents(
        { query: { class: "Grade 1", status: "active" } },
        res,
        next
    );

    assert.deepEqual(await completed, {
        body: { students },
        statusCode: 200,
    });
    assert.deepEqual(received, { status: "active", className: "Grade 1" });
});

test("creates a student with status 201", async () => {
    const payload = { name: "Student" };
    const result = { id: 10 };
    let received;
    setServiceMock("addNewStudent", async (body) => {
        received = body;
        return result;
    });
    const { res, completed, next } = createResponse();

    controller.handleAddStudent({ body: payload }, res, next);

    assert.deepEqual(await completed, { body: result, statusCode: 201 });
    assert.equal(received, payload);
});

test("gets a student using a numeric ID", async () => {
    const student = { id: 12 };
    let received;
    setServiceMock("getStudentDetail", async (id) => {
        received = id;
        return student;
    });
    const { res, completed, next } = createResponse();

    controller.handleGetStudentDetail({ params: { id: "12" } }, res, next);

    assert.deepEqual(await completed, { body: student, statusCode: 200 });
    assert.equal(received, 12);
});

test("updates a student with a numeric userId", async () => {
    const body = { name: "Updated" };
    const result = { message: "Updated" };
    let received;
    setServiceMock("updateStudent", async (payload) => {
        received = payload;
        return result;
    });
    const { res, completed, next } = createResponse();

    controller.handleUpdateStudent(
        { body, params: { id: "13" } },
        res,
        next
    );

    assert.deepEqual(await completed, { body: result, statusCode: 200 });
    assert.deepEqual(received, { name: "Updated", userId: 13 });
});

test("changes student status with the authenticated reviewer ID", async () => {
    const result = { message: "Status changed" };
    let received;
    setServiceMock("setStudentStatus", async (payload) => {
        received = payload;
        return result;
    });
    const { res, completed, next } = createResponse();

    controller.handleStudentStatus(
        {
            body: { status: true },
            params: { id: "14" },
            user: { id: 7 },
        },
        res,
        next
    );

    assert.deepEqual(await completed, { body: result, statusCode: 200 });
    assert.deepEqual(received, { userId: 14, reviewerId: 7, status: true });
});

test("deletes a student using a numeric ID", async () => {
    const result = { message: "Deleted" };
    let received;
    setServiceMock("deleteStudent", async (id) => {
        received = id;
        return result;
    });
    const { res, completed, next } = createResponse();

    controller.handleDeleteStudent({ params: { id: "15" } }, res, next);

    assert.deepEqual(await completed, { body: result, statusCode: 200 });
    assert.equal(received, 15);
});

test("forwards service errors to Express error handling", async () => {
    const error = new Error("Service failed");
    setServiceMock("getStudentDetail", async () => {
        throw error;
    });
    const { res, completed, next } = createResponse();

    controller.handleGetStudentDetail({ params: { id: "16" } }, res, next);

    assert.deepEqual(await completed, { error });
});
