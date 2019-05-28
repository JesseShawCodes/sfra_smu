'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.get('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
    res.render('/home/homePage2');
    next();
}, pageMetaData.computedPageMetaData);

server.get('IncludeCarousel', consentTracking.consent, cache.applyDefaultCache, function(req, res, next) {
     res.render('/content/home/carousel');
     next();
}, pageMetaData.computedPageMetaData)

server.get('IncludeHeader', consentTracking.consent, cache.applyDefaultCache, function(req, res, next) {
     res.render('/components/header/header');
     next();
}, pageMetaData.computedPageMetaData)

server.get('IncludeHeaderMenu', consentTracking.consent, cache.applyDefaultCache, function(req, res, next) {
     res.render('/components/header/headercustomerinfo');
     next();
}, pageMetaData.computedPageMetaData)

server.get('IncludeHeaderCustomerInfo', consentTracking.consent, cache.applyDefaultCache, function(req, res, next) {
     res.render('/components/header/headermenu');
     next();
}, pageMetaData.computedPageMetaData)

server.get('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(404);
    res.render('error/notFound');
    next();
});

module.exports = server.exports();
