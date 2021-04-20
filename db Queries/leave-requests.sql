

-- //for Rejected
insert into leave_request_statuses(status, createdAt, updatedAt) VALUES ('Accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

-- for Accepted 
insert into leave_request_statuses(status, createdAt, updatedAt) VALUES ('Rejected', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

-- for Pending 

insert into leave_request_statuses(status, createdAt, updatedAt) VALUES ('Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)


-- //enetre leave types of your choice via this query
insert into leave_types(name, description, createdAt, updatedAt) VALUES ('Maternity', 'casual leave includes cusual person condition', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
