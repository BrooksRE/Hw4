const request = require('supertest');
const { app, server } = require('../studentserver');

// Test Fixtures
const baseURL = "http://localhost:5678";
const data = {
    enrolled: true,
    first_name: "James",
    gpa: 3,
    last_name: "Beam",
};

afterAll((done) => {
    server.close(() => {
        done();
    });
});

describe('GET /students', () => {
    var response;

    beforeAll(async() => {
        response = await request(baseURL).get('/students');
    });

    it('should return a 200 status', async() => {
        expect(response.status).toBe(200);
    });
});

describe("GET /students/{record_id}", () => {
    var response;

    beforeAll(async() => {
        response = await request(baseURL).get('/students/1677444950300');
    });

    it('should return a 200 status', async() => {
        expect(response.status).toBe(200);
    });

    it('should return a specific student', async() => {
        expect(response.body).toEqual({
            "record_id": 1677444950300,
            "first_name": "John",
            "last_name": "Doe",
            "gpa": 3,
            "enrolled": true
        });
    });
});

describe("GET /students/{record_id} - Student Does Not Exist", () => {
    var response;

    beforeAll(async() => {
        // Choose a record_id that is not in your system
        response = await request(baseURL).get('/students/1234567890');
    });

    it('should return a 404 status', async() => {
        expect(response.status).toBe(404);
    });

    it('should return a message indicating the student does not exist', async() => {
        expect(response.body).toEqual({
            "message": "error - resource not found",
            "record_id": "1234567890"
        });
    });
});

describe("POST /students", () => {
    let response;
    let studentId; // To store the created student's ID
    let isDuplicate = false; // To track whether a duplicate student is being tested

    beforeAll(async() => {
        try {
            // Simulate a duplicate student creation by sending the same data
            response = await request(baseURL).post('/students').send(data);

            // Check if the response status is 201 or 409
            if (response.status === 201) {
                studentId = response.body.record_id; // Store the created student's ID
            } else if (response.status === 409) {
                isDuplicate = true;
                console.error("Student with the same name already exists");
            }
        } catch (error) {
            // Handle other errors
            throw error;
        }
    });

    it('Should return either 201 or 409', async() => {
        expect([201, 409]).toContain(response.status);
    });

    it('Should have message and record_id if created', async() => {
        if (response.status === 201) {
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('record_id');
        }
    });

    afterAll(async() => {
        // Clean up the created student only if it was created successfully
        if (studentId && !isDuplicate) {
            await request(baseURL).delete(`/students/${studentId}`);
        }
    });
});
describe("PUT /students/{record_id} - Success - Update student", () => {
    var response;

    beforeAll(async() => {
        // Choose an existing student's record_id to update
        const studentToUpdate = {
            record_id: 1696357091388,
            first_name: "Samba",
            last_name: "Nomba",
            gpa: 3.5,
            enrolled: true
        };

        response = await request(baseURL)
            .put(`/students/${studentToUpdate.record_id}`)
            .send(studentToUpdate);
    });

    it('should return a 201 status', async() => {
        expect(response.status).toBe(201);
    });

    it('should return a message indicating the student was updated', async() => {
        expect(response.body).toEqual({
            "message": "successfully updated",
            "record_id": "1696357091388"
        });
    });

    // Optionally, you can add a test to verify the updated student's information
    it('should have updated student information', async() => {
        const updatedStudent = await request(baseURL).get(`/students/1696357091388`);
        expect(updatedStudent.body).toEqual({
            record_id: "1696357091388", // Updated to a string
            first_name: "Samba",
            last_name: "Nomba",
            gpa: 3.5, // Updated to a number
            enrolled: true // Make sure this matches your API's response format
        });
    });
});




describe("PUT /students/{record_id} - Failure - Resource Not Found", () => {
    var response;

    beforeAll(async() => {
        // Choose a non-existent student's record_id to update
        const nonExistentStudent = {
            record_id: "nonexistent123", // Provide a non-existent record_id
            first_name: "Non",
            last_name: "Existent",
            gpa: 3.5,
            enrolled: true
        };

        response = await request(baseURL)
            .put(`/students/${nonExistentStudent.record_id}`)
            .send(nonExistentStudent);
    });

    it('should return a 404 status', async() => {
        expect(response.status).toBe(404);
    });

    it('should return a message indicating the resource was not found', async() => {
        expect(response.body).toEqual({
            "message": "error - resource not found",
            "record_id": "nonexistent123" // Ensure this matches the non-existent record_id used in the request
        });
    });
});













describe("DELETE /students/{record_id} - Failure - Student Not Found", () => {
    var response;

    beforeAll(async() => {
        // Choose a non-existent student's record_id to delete
        const nonExistentRecordId = "nonexistent123"; // Provide a non-existent record_id

        response = await request(baseURL)
            .delete(`/students/${nonExistentRecordId}`);
    });

    it('should return a message indicating the student was not found', async() => {
        expect(response.body).toEqual({
            "message": "error - resource not found", // Update the expected message
            "record_id": "nonexistent123" // Ensure this matches the non-existent record_id used in the request
        });
    });

});



describe("DELETE /students/{record_id} - Success - Delete Student", () => {
    var response;
    var studentToDeleteRecordId; // Store the record_id of the student to be deleted here

    beforeAll(async() => {
        // Create a new student first and obtain their record_id
        const newStudent = {
            first_name: "John",
            last_name: "Doe",
            gpa: 3.5,
            enrolled: true
        };

        const createStudentResponse = await request(baseURL)
            .post('/students')
            .send(newStudent);

        // Store the record_id of the newly created student
        studentToDeleteRecordId = createStudentResponse.body.record_id;

        // Now, attempt to delete the student
        response = await request(baseURL)
            .delete(`/students/${studentToDeleteRecordId}`);
    });



    it('should delete the student', async() => {
        // Verify that the student has been deleted by attempting to retrieve them
        const verifyResponse = await request(baseURL).get(`/students/${studentToDeleteRecordId}`);
        expect(verifyResponse.status).toBe(404); // Expect a 404 status indicating the student was not found
    });

    afterAll(async() => {
        // Clean up any remaining student records (if needed)
        await request(baseURL).delete(`/students/${studentToDeleteRecordId}`);
    });
});