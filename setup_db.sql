-- Run this in PostgreSQL to create database and user
-- Connect to PostgreSQL as superuser first: psql -U postgres

-- Create user
CREATE USER textile_user WITH PASSWORD 'textile_pass_123';

-- Create database
CREATE DATABASE textile_inspector OWNER textile_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;
