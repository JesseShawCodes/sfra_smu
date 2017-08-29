'use strict';

var assign = require('./assign');

/**
 * @constructor
 * @classdesc Creates writtable response object
 *
 * @param {Object} response - Global response object
 */
function Response(response) {
    this.view = null;
    this.viewData = {};
    this.redirectUrl = null;
    this.messageLog = [];
    this.base = response;
    this.cachePeriod = null;
    this.cachePeriodUnit = null;
    this.personalized = false;
}

Response.prototype = {
    /**
     * Stores template name and data for rendering at the later time
     * @param {string} name - Path to a template
     * @param {Object} data - Data to be passed ot the template
     * @returns {void}
     */
    render: function render(name, data) {
        this.view = name;
        this.viewData = assign(this.viewData, data);
    },
    /**
     * Stores data to be rendered as json
     * @param {Object} data - Data to be rendered as json
     * @returns {void}
     */
    json: function json(data) {
        this.isJson = true;
        this.viewData = assign(this.viewData, data);
    },
    /**
     * Stores data to be rendered as XML
     * @param {string} xmlString - The XML to print.
     * @returns {void}
     */
    xml: function xml(xmlString) {
        this.isXml = true;
        this.viewData = xmlString;
    },
    /**
     * Redirects to a given url right away
     * @param {string} url - Url to be redirected to
     * @returns {void}
     */
    redirect: function redirect(url) {
        this.redirectUrl = url;
    },
    /**
     * Get data that was setup for a template
     * @returns {Object} Data for the template
     */
    getViewData: function () {
        return this.viewData;
    },
    /**
     * Updates data for the template
     * @param {Object} data - Data for template
     * @returns {void}
     */
    setViewData: function (data) {
        this.viewData = assign(this.viewData, data);
    },
    /**
     * Logs information for output on the error page
     * @param {string[]} arguments - List of items to be logged
     * @returns {void}
     */
    log: function log() {
        var args = Array.prototype.slice.call(arguments);

        var output = args.map(function (item) {
            if (typeof item === 'object' || Array.isArray(item)) {
                return JSON.stringify(item);
            }
            return item;
        });

        this.messageLog.push(output.join(' '));
    },
    /**
     * Set content type for the output
     * @param {string} type - Type of the output
     * @returns {void}
     */
    setContentType: function setContentType(type) {
        this.base.setContentType(type);
    },

    /**
     * Set status code of the response
     * @param {int} code - Valid HTTP return code
     * @returns {void}
     */
    setStatusCode: function setStatusCode(code) {
        this.base.setStatus(code);
    },

    /**
     * Print a message directly to the output
     * @param {string} message - Message to be printed
     * @returns {void}
     */
    print: function print(message) {
        this.base.writer.print(message);
    },

    /**
     * Sets current page cache expiration period value in hours
     * @param  {int} period Number of hours from current time
     * @return {void}
     */
    cacheExpiration: function cacheExpiration(period) {
        this.cachePeriod = period;
    }

};

module.exports = Response;
