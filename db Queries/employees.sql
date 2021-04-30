

-- //7

-- // deafult password hashed:  $2b$08$Xkg5VtiDoYb2eqAl2rYLveGyLpBywcLMbLMNr0CCU/i31NbOM.p9u
--// actual password value : 123
INSERT INTO employees(name, last_name, email, password, dob, address, phone, starting_date, resume, attendMachineId, createdAt, updatedAt, roleId, employeeTypeId, employeeDesignationId, employeeGradeId, cnic) 
VALUES ('Qaiser','Siddiqui', 'amna@dynasoftcloud.com', '$2b$08$Xkg5VtiDoYb2eqAl2rYLveGyLpBywcLMbLMNr0CCU/i31NbOM.p9u', '1 May 1997', 'abc address', '0305-6230474', '2/19/2020', 'resume.pdf', 'DSC-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1 , 1, NULL);

UPDATE company_funds SET name='umar' where id=1
-- // 6
INSERT INTO roles(title, createdAt, updatedAt) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- // 5
INSERT INTO employee_types(employee_type, createdAt, updatedAt) VALUES ('Permanent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Probation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Internship', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

-- //4 
INSERT INTO employee_designations(designation_type, createdAt, updatedAt) VALUES ('CEO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('HR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Netsuite Developer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)


INSERT INTO employee_grades(grade, min_salary, max_salary, createdAt, updatedAt) VALUES ('OG3', 40000, 60000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

-- //3

insert into leave_request_statuses(status, createdAt, updatedAt) VALUES ('Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Rejected', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)



-- //enetre leave types of your choice via this query 
 -- //2
insert into leave_types(name, description, createdAt, updatedAt) VALUES ('Maternity', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Casual', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Sick', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), ('Annual', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)



select * from leave_request_statuses
 -- //1
insert into company_preferences(start_time, off_time, working_hours, working_days, over_time, total_annual_leaves,  createdAt, updatedAt) VALUES('9:00 AM' , '5:30 PM' , 8.00, 6, 10, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)