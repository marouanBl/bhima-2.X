/**
 * @module config/errorHandlers
 *
 * @description This modules defines serveral different error handlers for the bhima
 * application.  Errors generally fall into three categories:
 *  1. Database Errors
 *  2. Application/API Errors
 *  3. Unexpected Errors
 *
 * Each error handler is responsible for logging the errors to a log file and returning
 * an appropriate error code (for translation) to the client.
 *
 * @todo Import logging functionality into this module.
 *
 * @requires config/codes
 */

var errors = require('./codes');

/**
 * This function identifies whether a parameter is a native error of JS or not.
 *
 * @param error
 * @returns {boolean} bool True if the error is a native error, false otherwise
 */
function isNativeError(error) {
  return (
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof EvalError ||
    error instanceof URIError ||
    error instanceof EvalError
  );
}


/**
 * Handles errors specifically generated by the application API.
 */
exports.apiErrorHandler = function apiErrorHandler(error, req, res, next) {
  'use strict';

  // skip native errors - caught in catchAll
  if (isNativeError(error)) { return next(error); }

  // check to see if this is an API error
  if (error && error.httpStatus) {

    // return to the client as a JSON object error.
    res.status(error.httpStatus).json(error);

  // if not matching an API error, pass along to the next interceptor
  } else {
    next(error);
  }
};


/**
 * Handles errors specifically generated by MySQL.
 */
exports.databaseErrorHandler = function databaseErrorHandler(error, req, res, next) {
  'use strict';

  // skip native errors - caught in catchAllErrorHandler
  if (isNativeError(error)) { return next(error); }

  // check to see if this is a database error
  if (error && error.sqlState) {

    // retrieve the formatted error from
    try {
      var appError = new errors[error.code]();

      // send the formatted error back to the client.
      res.status(appError.httpStatus).json(appError);

    // if no matching error found, pass on to next();
    } catch (e)  {
      next(error);
    }

  // if not matching a databse error, forward to next interceptor
  } else {
    next(error);
  }
};



/**
 * Handles errors not caught by the previous error handlers.  These are often
 * unanticipated errors passed to next(), not ones emitted as an uncaught exception event.
 */
exports.catchAllErrorHandler = function catchAllErrorHandler(error, req, res, next) {
  'use strict';

  // log errors unless explicitly turned of in the config
  if (process.env.LOG_LEVEL !== 'none') {
    console.error('[ERROR]', error);
  }

  // return a 500 error so the client
  res.status(500).json(error);
};

