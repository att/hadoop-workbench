CREATE TABLE USER_ROLES (
  USER varchar(512) not null,
  ROLE varchar(512) not null,
  primary key (USER, ROLE)
);