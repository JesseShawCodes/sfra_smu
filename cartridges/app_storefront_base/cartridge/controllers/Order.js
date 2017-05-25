'use strict';

var server = require('server');

var CustomerMgr = require('dw/customer/CustomerMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var OrderModel = require('~/cartridge/models/order');

var OrderHelpers = require('~/cartridge/scripts/order/orderHelpers');
var CSRFProtection = require('~/cartridge/scripts/middleware/csrf');


server.get('Confirm', function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.ID);
    var config = {
        numberOfLineItems: '*'
    };
    var orderModel = new OrderModel(order, { config: config });
    var passwordForm;

    if (!req.currentCustomer.profile) {
        passwordForm = server.forms.getForm('newpasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true
        });
    }

    next();
});

server.post(
    'Track',
    server.middleware.https,
    CSRFProtection.validateRequest,
    CSRFProtection.generateToken,
    function (req, res, next) {
        var order;
        var validForm = true;

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();

        if (req.form.trackOrderEmail && req.form.trackOrderPostal && req.form.trackOrderNumber) {
            order = OrderMgr.getOrder(req.form.trackOrderNumber);
        } else {
            validForm = false;
        }

        if (!order) {
            res.render('/account/login', {
                navTabValue: 'login',
                orderTrackFormError: validForm,
                profileForm: profileForm,
                userName: ''
            });
            next();
        } else {
            var config = {
                numberOfLineItems: '*'
            };
            var orderModel = new OrderModel(order, { config: config });

            // check the email and postal code of the form
            if (req.form.trackOrderEmail !== orderModel.orderEmail) {
                validForm = false;
            }

            if (req.form.trackOrderPostal
                !== orderModel.billing.billingAddress.address.postalCode) {
                validForm = false;
            }

            if (validForm) {
                var exitLinkText;
                var exitLinkUrl;

                exitLinkText = !req.currentCustomer.profile
                    ? Resource.msg('link.continue.shop', 'order', null)
                    : Resource.msg('link.orderdetails.myaccount', 'account', null);

                exitLinkUrl = !req.currentCustomer.profile
                    ? URLUtils.https('Home-Show')
                    : URLUtils.https('Account-Show');

                res.render('account/orderdetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl
                });
            } else {
                res.render('/account/login', {
                    navTabValue: 'login',
                    profileForm: profileForm,
                    orderTrackFormError: !validForm,
                    userName: ''
                });
            }

            next();
        }
    }
);

server.get('History', server.middleware.https, function (req, res, next) {
    if (!req.currentCustomer.profile) {
        res.redirect(URLUtils.url('Login-Show'));
    } else {
        var ordersResult = OrderHelpers.getOrders(req.currentCustomer, req.querystring);
        var orders = ordersResult.orders;
        var filterValues = ordersResult.filterValues;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ];

        res.render('account/order/history', {
            orders: orders,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false,
            breadcrumbs: breadcrumbs
        });
    }
    next();
});

server.get('Details', server.middleware.https, function (req, res, next) {
    if (!req.currentCustomer.profile) {
        res.redirect(URLUtils.url('Login-Show'));
    } else {
        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var currentCustomerNo = order.customer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        if (order && orderCustomerNo === currentCustomerNo) {
            var config = {
                numberOfLineItems: '*'
            };

            var orderModel = new OrderModel(order, { config: config });
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            res.render('account/orderdetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
    }
    next();
});

server.get('Filtered', server.middleware.https, function (req, res, next) {
    if (!req.currentCustomer.profile) {
        res.redirect(URLUtils.url('Login-Show'));
    } else {
        var ordersResult = OrderHelpers.getOrders(req.currentCustomer, req.querystring);
        var orders = ordersResult.orders;
        var filterValues = ordersResult.filterValues;

        res.render('account/order/orderlist', {
            orders: orders,
            filterValues: filterValues,
            orderFilter: req.querystring.orderFilter,
            accountlanding: false
        });
    }
    next();
});

server.post('CreateAccount', server.middleware.https, function (req, res, next) {
    var formErrors = require('~/cartridge/scripts/formErrors');

    var passwordForm = server.forms.getForm('newpasswords');
    var newPassword = passwordForm.newpassword.htmlValue;
    var confirmPassword = passwordForm.newpasswordconfirm.htmlValue;
    if (newPassword !== confirmPassword) {
        passwordForm.valid = false;
        passwordForm.newpasswordconfirm.valid = false;
        passwordForm.newpasswordconfirm.error =
            Resource.msg('error.message.mismatch.newpassword', 'forms', null);
    }

    var order = OrderMgr.getOrder(req.querystring.ID);

    var registrationObj = {
        firstName: order.billingAddress.firstName,
        lastName: order.billingAddress.lastName,
        phone: order.billingAddress.phone,
        email: order.customerEmail,
        password: newPassword
    };

    if (passwordForm.valid) {
        res.setViewData(registrationObj);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var registrationData = res.getViewData();

            var login = registrationData.email;
            var password = registrationData.password;
            var newCustomer;
            var authenticatedCustomer;
            var newCustomerProfile;
            var registeredUser;

            // attempt to create a new user and log that user in.
            try {
                Transaction.wrap(function () {
                    newCustomer = CustomerMgr.createCustomer(login, password);
                    authenticatedCustomer =
                        CustomerMgr.loginCustomer(login, password, false);
                    if (newCustomer && authenticatedCustomer.authenticated) {
                        // assign values to the profile
                        newCustomerProfile = newCustomer.getProfile();
                        newCustomerProfile.firstName = registrationData.firstName;
                        newCustomerProfile.lastName = registrationData.lastName;
                        newCustomerProfile.phoneHome = registrationData.phone;
                        newCustomerProfile.email = registrationData.email;
                        order.setCustomer(newCustomer);
                        registeredUser = {
                            email: login,
                            firstName: registrationData.firstName,
                            lastName: registrationData.lastName
                        };
                        OrderHelpers.sendConfirmationEmail(registeredUser);
                        res.json({
                            success: true,
                            redirectUrl: URLUtils.url('Account-Show').toString()
                        });
                    }
                });
            } catch (e) {
                res.json({
                    error: [Resource.msg('error.account.exists', 'checkout', null)]
                }); // Show error if the login email already exists
            }
        });
    } else {
        res.json({
            fields: formErrors(passwordForm)
        });
    }
    next();
});

module.exports = server.exports();
