

select * from roles

INSERT INTO roles(title, createdAt, updatedAt, employeeId) VALUES ('admin',CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, SCOPE_IDENTITY());

delete from roles where id = 2