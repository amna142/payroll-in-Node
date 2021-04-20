
INSERT INTO roles(title, createdAt, updatedAt) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO employee_designations(designation_type, createdAt, updatedAt) VALUES ('CEO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

INSERT INTO employee_types(employee_type, createdAt, updatedAt) VALUES ('Permanent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

INSERT INTO employees(name, email, password, dob, address, phone, starting_date, resume, attendMachineId, createdAt, updatedAt, roleId, employeeTypeId, employeeDesignationId, employeeGradeId) 
VALUES ('Qaiser Siddiqui','qaiser.siddiqui@dynasoftcloud.com', '123', '1 May 1997', 'abc address', '0305-6230474', '2/19/2020', 'resume.pdf', 'DSC-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1 , 1, NULL);

