create table users
(
	id            integer     not null
		constraint users_pk
			primary key autoincrement,
	username      varchar(80) not null
		constraint users_username
			unique,
	password_salt char(64)    not null,
	password_hash char(64)    not null
);


create table apps
(
	id            integer     not null
		constraint apps_pk
			primary key autoincrement,
	name          varchar(80) not null,
	description   varchar(200) default null,
	audience_key  char(16)    not null
		constraint apps_audience_key
			unique,
	telemetry_key char(16)    not null
		constraint apps_telemetry_key
			unique,
	owner_id      integer     not null
		constraint apps_users_id_fk
			references users (id)
			on update cascade on delete cascade
);

create table sessions
(
	id        integer      not null
		constraint sessions_pk
			primary key autoincrement,
	public_id varchar(80)  not null
		constraint sessions_public_id
			unique,
	user_id   int          not null
		constraint sessions_users_id
			references users (id)
			on update cascade on delete cascade,
	ip        varchar(20)  not null,
	ua        varchar(200) not null,
	time      bigint       not null
);
