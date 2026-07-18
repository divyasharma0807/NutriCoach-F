/**
 * K6 Testing Infrastructure - Shared Constants
 * Exposes core user roles, HTTP methods, status codes, content types, and headers.
 */

export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  CLIENT: 'client',
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
};

export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  COOKIE: 'Cookie',
};

export default {
  ROLES,
  HTTP_METHODS,
  STATUS_CODES,
  CONTENT_TYPES,
  HEADERS,
};
