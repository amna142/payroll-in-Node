




select * from employees

INSERT INTO employees(name, email, password, createdAt, updatedAt, roleId) VALUES ('amna_ali','amna@dummy.com', '123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SCOPE_IDENTITY());


UPDATE employees
SET email='amna@gmail.com' WHERE id=2;


INSERT INTO roles(title, createdAt, updatedAt) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT SCOPE_IDENTITY() AS roleId

delete from employees where id=2