




select * from employees

INSERT INTO employees(name, email, password, dob, address, phone, starting_date, resume, createdAt, updatedAt, roleId, employeeTypeId, employeeDesignationId) 
VALUES ('amna_ali','amna@dummy.com', '123', '1 May 1997', 'abc address', '0305-6230474', '2/19/2020', 'resume.pdf', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 2 , 2);


UPDATE employees
SET email='amna@gmail.com' WHERE id=2;


INSERT INTO roles(title, createdAt, updatedAt) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


delete from employees where id=3



INSERT INTO employee_types(employee_type, createdAt, updatedAt) VALUES ('Probation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select * from employee_types

SELECT SCOPE_IDENTITY() AS roleId


INSERT INTO employee_designations(designation_type, createdAt, updatedAt) VALUES ('JS Developer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select * from employee_designations

select * from employee_types

delete from employee_types where id = 3