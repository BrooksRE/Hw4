//studentserver.js

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob");
const { type } = require('os');

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Student Server API',
            version: '1.0.0'
        }
    },
    apis: ['studentserver.js']

};

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

app.use((req, res, next) => {
    res.set('Content-Type', 'application/json');
    next();
});

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Creates a new student object with all of its attributes.
 *     description: Use this endpoint to create a new student.
 *     parameters:
 *       - name: first_name
 *         description: Student's first name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: last_name
 *         description: Student's last name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: gpa
 *         description: Student's GPA
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: enrolled
 *         description: Student's enrolled status
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unable to create resource.
 *       201:
 *         description: Success. The student object has been created.
 *       409:
 *         description: Conflict. A student with the same name already exists.
 */

app.post('/students', function(req, res) {
    var record_id = new Date().getTime();

    var obj = {};
    obj.record_id = record_id;
    obj.first_name = req.body.first_name;
    obj.last_name = req.body.last_name;
    obj.gpa = req.body.gpa;
    obj.enrolled = req.body.enrolled;

    var str = JSON.stringify(obj, null, 2);
    const fs = require('fs');

    const dir = 'students';

    fs.access(dir, (err) => {
        if (err) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Directory created successfully!');
                }
            });
        } else {
            console.log('Directory already exists!');
        }

        if (checkStudentExists(obj.first_name, obj.last_name, dir)) {
            var rsp_obj = {};
            rsp_obj.message = 'Student with the same name already exists';
            return res.status(409).send(rsp_obj); // 409 Conflict
        }

        // Else, write the student data
        fs.writeFile("students/" + record_id + ".json", str, function(err) {
            var rsp_obj = {};
            if (err) {
                rsp_obj.record_id = -1;
                rsp_obj.message = 'error - unable to create resource';
                return res.status(400).send(rsp_obj);
            } else {
                rsp_obj.record_id = record_id;
                rsp_obj.message = 'successfully created';
                return res.status(201).send(rsp_obj);
            }
        }); // end writeFile method
    });
});
//end post method
/**
 * @swagger
 * /students/{recordid}:
 *   get:
 *     summary: Get a student by record ID.
 *     description: Use this endpoint to retrieve a student based on their record ID.
 *     parameters:
 *       - name: recordid
 *         description: Student's record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success. The student object has been retrieved.
 *       404:
 *         description: Error. The requested resource was not found.
 */
app.get('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;

    fs.readFile("students/" + record_id + ".json", "utf8", function(err, data) {
        if (err) {
            var rsp_obj = {};
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        } else {
            return res.status(200).send(data);
        }
    });
});

function readFiles(files, arr, res) {
    fname = files.pop();
    if (!fname)
        return;
    fs.readFile(fname, "utf8", function(err, data) {
        if (err) {
            return res.status(500).send({ "message": "error - internal server error" });
        } else {
            arr.push(JSON.parse(data));
            if (files.length == 0) {
                var obj = {};
                obj.students = arr;
                return res.status(200).send(obj);
            } else {
                readFiles(files, arr, res);
            }
        }
    });
}

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get an array of all students.
 *     description: Use this endpoint to retrieve an array of all students.
 *     responses:
 *       200:
 *         description: Success. An array of students has been retrieved.
 *       500:
 *         description: Error. Internal server error occurred.
 */
app.get('/students', function(req, res) {
    console.log("get students")
    var obj = {};
    var arr = [];
    filesread = 0;

    glob("students/*.json", null, function(err, files) {
        if (err) {
            return res.status(500).send({ "message": "error - internal server error" });
        }
        readFiles(files, [], res);
    });

});
/**
 * @swagger
 * /students/{record_id}:
 *   put:
 *     summary: Update an existing student by record ID.
 *     description: Use this endpoint to update an existing student based on their record ID.
 *     parameters:
 *       - name: record_id
 *         description: Student's record ID
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: first_name
 *         description: Student's first name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: last_name
 *         description: Student's last name
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: gpa
 *         description: Student's GPA
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *       - name: enrolled
 *         description: Student's enrolled status
 *         in: formData
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error. Unable to update resource.
 *       201:
 *         description: Success. The student has been updated.
 *       404:
 *         description: Error. The requested resource was not found.
 */
app.put('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;
    var fname = "students/" + record_id + ".json";
    var rsp_obj = {};
    var obj = {};

    obj.record_id = record_id;
    obj.first_name = req.body.first_name;
    obj.last_name = req.body.last_name;
    obj.gpa = req.body.gpa;
    obj.enrolled = req.body.enrolled;

    var str = JSON.stringify(obj, null, 2);

    //check if file exists
    fs.stat(fname, function(err) {
        if (err == null) {

            //file exists
            fs.writeFile("students/" + record_id + ".json", str, function(err) {
                var rsp_obj = {};
                if (err) {
                    rsp_obj.record_id = record_id;
                    rsp_obj.message = 'error - unable to update resource';
                    return res.status(200).send(rsp_obj);
                } else {
                    rsp_obj.record_id = record_id;
                    rsp_obj.message = 'successfully updated';
                    return res.status(201).send(rsp_obj);
                }
            });

        } else {
            rsp_obj.record_id = record_id;
            const fs = require('fs');
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        }

    });

}); //end put method

/**
 * @swagger
 * /students/{record_id} :
 *  delete:
 *    description: Deletes a from the student directory by their record ID.
 *    parameters:
 *    - name: record_id
 *      description: Student's Record ID
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 *    responses:
 *      200:
 *        description: record deleted
 *      404:
 *        description: error - resource not found
 */
app.delete('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;
    var fname = "students/" + record_id + ".json";

    fs.unlink(fname, function(err) {
        var rsp_obj = {};
        if (err) {
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        } else {
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'record deleted';
            return res.status(200).send(rsp_obj);
        }
    });


}); //end delete method



function checkStudentExists(first_name, last_name, dir) {
    const studentFiles = fs.readdirSync(dir);
    for (let file of studentFiles) {
        const studentData = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf-8'));

        // Make sure studentData has valid properties
        if (studentData && studentData.first_name && studentData.last_name) {
            // Handle case sensitivity
            if (
                studentData.first_name.toLowerCase() === first_name.toLowerCase() &&
                studentData.last_name.toLowerCase() === last_name.toLowerCase()
            ) {
                return true;
            }
        }
    }
    return false;
}
const server = app.listen(5678); //start the server
console.log('Server is running...');
console.log('Webapp:   http://localhost:5678')
console.log('API Docs: http://localhost:5678/api-docs')

module.exports = {
    server: server,
    app: app
}