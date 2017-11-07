create table CLUSTER_SERVICE (
  PLATFORM_ID int(11) not null,
  CLUSTER_ID varchar(512) not null,
  NAME varchar(512) not null,
  URL varchar(512) not null,
  primary key (PLATFORM_ID, CLUSTER_ID, NAME),
  constraint CLUSTER_SERVICES_FK
  foreign key (PLATFORM_ID, CLUSTER_ID) references CLUSTER (PLATFORM_ID, CLUSTER_ID) on delete cascade
)