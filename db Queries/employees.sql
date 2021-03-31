

insert into leave_types(name, description, createdAt, updatedAt) VALUES ('Casual', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select * from leave_types
delete from leave_types
select * from employees

select * from audit_logs

INSERT INTO employees(name, email, password, dob, address, phone, starting_date, resume, attendMachineId, createdAt, updatedAt, roleId, employeeTypeId, employeeDesignationId, employeeGradeId) 
VALUES ('amna_ali','amna@dummy.com', '123', '1 May 1997', 'abc address', '0305-6230474', '2/19/2020', 'resume.pdf', 'DSC-011', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1 , 1, NULL);


UPDATE employees
SET email='amna@gmail.com' WHERE id=7;


UPDATE company_funds SET name='umar' where id=1

INSERT INTO roles(title, createdAt, updatedAt) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

delete from employees where id=1

delete from company_funds

INSERT INTO employee_types(employee_type, createdAt, updatedAt) VALUES ('Permanent', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select * from employee_types

SELECT SCOPE_IDENTITY() AS roleId


INSERT INTO employee_designations(designation_type, createdAt, updatedAt) VALUES ('Netsuite Developer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

select * from employee_designations

select * from employee_types

delete from employee_types where id = 3


select * from salaries

select * from employee_grades 

select * from EmpGrade_Allowances
delete    from employee_grades
delete from audit_logs

INSERT INTO employee_grades(grade, min_salary, max_salary, createdAt, updatedAt) VALUES ('OG3', 40000, 60000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)



